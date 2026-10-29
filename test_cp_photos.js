/*
 * Node tests — 🖼 CPPHOTOS, photos on any card from ONE pool (DESIGN_class_platform_2026-10-28.md §6.7, §9, §13 row 29, §14 Q47–Q50; her
 * question 2026-10-28 "are there options to add photos for when that's needed, or is that going to be part of the skill area?" — both,
 * from one pool; her yes to building the design 2026-10-28).
 *   · how the block is hooked (three typeof-guarded lines tagged 🖼 CPPHOTOS: cpcsDetailHtml, envClsKidLoad, envPicsFor); it only declares;
 *     every write goes through envsWrite; its only Firebase calls are the kid's once-reads; no uploads;
 *   · Howe, DeWalt and LINCOLN: nothing on — envPicsFor gives today's repo pictures byte-for-byte even with full layers in memory;
 *   · the pool: repo ← unit ← class, ⭐ main first, 🙈 hidden out, a unit photo without a free licence dropped, the lookups by item + tag,
 *     a card's (no track / skull unless it is about them), a mock's fixed id, the parts count and the Trim lock;
 *   · 📚 Cards (demo, teacher and Adrienne): the 🖼 strip, ⭐ / 🙈 / ↩, ＋ Add photo via 🗂 the pool and 🔎 Wikipedia (the demo's lookup is
 *     canned: no network), "Class use only / Not sure" never offered to the unit, Undo; every change ONE targeted write;
 *   · live: exactly the photo's paths; the Wikipedia thumbnail hot-linked with the licence "Not sure"; dry run writes nothing;
 *   · the kid's boot: classPhotos/<cid> and units/<id>/photos read once, laid over in memory, never written;
 *   · the rules: classPhotos/$cid and units/$unitId/photos accept exactly the shapes the code writes; make_demo carries the photo set.
 * Every count comes from the data (envirothon/pics/index.json), never typed in.                          run: node test_cp_photos.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const PICS=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","pics","index.json"),"utf8"));
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const BLK=cut("// CPPHOTOS_START","// CPPHOTOS_END");
const fnSrc=name=>{ const i=src.indexOf("\nfunction "+name+"("); const j=src.indexOf("\n}\n",i); return src.slice(i+1,j+2); };
const PICSFOR=(()=>{ const i=src.indexOf("function envPicsFor(deck,name){"); return src.slice(i,src.indexOf("\n",src.indexOf("\n",i)+1)+1); })();
const NAMES="CPPH_TAGS, CPPH_LIC, CPPH_FREE, CPPH_PARTS, CPPH_PART_NEED, CPPH_WIKI_RE, CPPH_REPO_RE, _cpph, cpphSite, cpphOn, cpphKey, cpphItemOf, cpphLicOf, cpphShotTags, cpphRepoId, cpphUrlOk, cpphRepoMap, cpphKidOn, cpphClassL, cpphUnitL, cpphStart, cpphLayeredK, cpphLayered, cpPhotos, cpPhotoForCard, cpPhotoById, cpPhotoParts, cpPhotoTrimLock, cpphKidLoad, cpphKidRepaint, cpphKidItem, cpphPicsFor, cpphCard, cpphStripHtml, cpphCommons, cpphPool, cpphPick, cpphAddOpen, cpphAddClose, cpphIn, cpphWay, cpphLic, cpphTag, cpphPoolPick, cpphWiki, cpphWikiIn, cpphDraftWhy, cpphRec, cpphNewId, cpphSave, cpphMain, cpphHide, cpphCommit, cpphUndo, cpphMemGet, envPicsFor";
// the world's extras: ENVIDFLASH's envPicsFor (the real line) over a picture index G.pics; UNIT_PICS's lookup and fetch counted, never reached in the demo
const PICSFOR_W=PICSFOR.replace("const idx=_envPicsIdx;","const idx=(G.pics||null);");   // the world's picture index is G.pics, set after the world is made
const REV=BLK+"\nfunction envPicsIndex(){ return G.pics||null; } function envPicsLoad(){ G.picLoads=(G.picLoads||0)+1; return Promise.reject(new Error('no')); } function envPicsDeckOn(d){ return !G.deckOff; }\n"+PICSFOR_W+
  "\nfunction fetch(u){ G.fetched=(G.fetched||0)+1; return Promise.reject(new Error('offline')); } function _unitPicsLookup(f,t,n){ G.looked=(G.looked||[]).concat([t]); return Promise.resolve(G.wiki||null); }\nG.cpph={ "+NAMES+" };";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,lib:LIB,rev:REV},o)); w.P=w.G.cpph; return w; }
function demo(role,o){ const w=W(Object.assign({search:"?demo=1&role="+(role||"teacher")},o||{})); w.G.pics=PICS; w.envSiteDemoBoot(); w.renderAll(); return w; }
const W_=w=>w._envs.writes, last=w=>W_(w)[W_(w).length-1];
const openCard=(w,c)=>{ w.envcView("cpcards"); w.ccs.cpcsTap("st",c.sec); if(c.kind==="id"){ w.ccs.cpcsTap("grp",c.sec+"|id"); w.ccs.cpcsTap("sp",c.g.key); } else w.ccs.cpcsTap("grp",c.g.key); w.ccs._cpcs.more[c.g.key]=1e6; w.ccs.cpcsTap("row",c.i); };
const CID="ms-science-2026";
// the data: an ID item with the most repo photos, its card, its photos by tag — all read from index.json and envirothon.js
const IDCARDS=[].concat(...LIB.unit.decks.filter(d=>/ · ID$/.test(d.key)).map(d=>d.cards.map(c=>Object.assign({deck:d.key},c))));
const repoOf=item=>{ const seen={}, out=[]; IDCARDS.filter(c=>(c.item||c.name.split(" · ")[0])===item).forEach(c=>(PICS[c.name]||[]).forEach(p=>{ if(!seen[p.url]){ seen[p.url]=1; out.push(p); } })); return out; };
const ITEMS=[...new Set(IDCARDS.map(c=>c.item||c.name.split(" · ")[0]))].filter(i=>repoOf(i).length>=3);
const ITEM=ITEMS.find(i=>/Sassafras/.test(i))||ITEMS[0], REPO_N=repoOf(ITEM).length, CARD0=IDCARDS.find(c=>c.item===ITEM);
const TRACKY=ITEMS.find(i=>repoOf(i).some(p=>/track|skull/i.test(p.shot))&&repoOf(i).some(p=>!/track|skull/i.test(p.shot)));
const WIKI="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Sassafras_albidum_leaf.jpg/320px-Sassafras_albidum_leaf.jpg";

const run=async()=>{
console.log("── the block and its hooks ──");
{ ok("one CPPHOTOS block, with her question and the date", src.split("// CPPHOTOS_START").length===2&&/are there\s*\n?\/\/ options to add photos|are there options to add photos/.test(BLK.replace(/\n\/\/ /g," "))&&/2026-10-28/.test(BLK.slice(0,700)));
  ok("the header names §6.7, §13 row 29, PR 29, the layers, and no uploads", /§6\.7/.test(BLK)&&/§13 row 29/.test(BLK)&&/PR 29/.test(BLK)&&/repo ← unit ← class/.test(BLK)&&/NO uploads/.test(BLK));
  ok("the block only declares (nothing runs at boot)", BLK.split("\n").every(l=>!l.trim()||/^(\/\/|function |const |let |var | |})/.test(l)));
  const a=src.indexOf("// CPPHOTOS_START"), b=src.indexOf("// CPPHOTOS_END"), hooks=(src.slice(0,a)+src.slice(b)).split("\n").filter(l=>/🖼 CPPHOTOS/.test(l));
  ok("three hook lines outside the block, each tagged 🖼 CPPHOTOS and typeof-guarded on a cpph function", hooks.length===3&&hooks.every(l=>/typeof cpph\w+==="function"/.test(l)), hooks);
  ok("…in cpcsDetailHtml (the strip, the old single photo kept for a page without the block), envClsKidLoad (after the card and test layers) and envPicsFor",
    /if\(typeof cpphStripHtml==="function"\) h\+=cpphStripHtml\(c\); else if\(p\) h\+='<img class="cpcs-pic"/.test(fnSrc("cpcsDetailHtml"))&&
    /cpctKidLoad\(sdb,cid\);[^\n]*\n  if\(typeof cpphKidLoad==="function"\) cpphKidLoad\(sdb,cid\);/.test(fnSrc("envClsKidLoad"))&&
    /^function envPicsFor\(deck,name\)\{ const idx=_envPicsIdx; if\(typeof cpphPicsFor==="function"\)\{ const _c=cpphPicsFor\(deck,name,idx\); if\(_c!==undefined\) return _c; \}/.test(PICSFOR));
  const code=BLK.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("every write goes through envsWrite; the only Firebase calls are the kid's once-reads of classPhotos/<cid> and units/<id>/photos", !/(?<!kitems)\.set\(|\.update\(|\.remove\(|\bdb\.|firebase\.|envcWrite/.test(code)&&(code.match(/\.ref\(/g)||[]).length===2&&/sdb\.ref\("classPhotos\/"\+cid\)\.once\("value"/.test(code)&&/sdb\.ref\("units\/"\+u\+"\/photos"\)\.once\("value"/.test(code)&&(code.match(/envsWrite\(/g)||[]).length===3);
  ok("no upload in this PR: no file input, no canvas, no Storage", !/type="file"|canvas|storage\(\)|toDataURL|FileReader/i.test(code));
  ok("no Howe kid name as a code literal; no 🔀", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(BLK)&&BLK.indexOf("\u{1F500}")<0); }

console.log("\n── the small pure parts ──");
{ const w=W(), P=w.P;
  ok("an item's key: lower case, spaces collapsed, . # $ [ ] / % coded", P.cpphKey("  Bald   Eagle ")==="bald eagle"&&P.cpphKey("St. John's/wort")==="st%2E john's%2Fwort"&&P.cpphKey("")==="");
  ok("a card's item: its item, else an ID front's first part, else the front", P.cpphItemOf({item:"Sweetgum",name:"Sweet gum · leaf"})==="Sweetgum"&&P.cpphItemOf({kind:"id",name:"Beaver · tracks"})==="Beaver"&&P.cpphItemOf({kind:"term",name:"Biltmore stick"})==="Biltmore stick");
  ok("the licence from a repo credit: CC0 / Public domain → cc0, CC BY-SA → ccbysa, CC BY → ccby, anything else → Not sure", P.cpphLicOf("A · Wikimedia Commons · CC0 1.0")==="cc0"&&P.cpphLicOf("A · Public domain")==="cc0"&&P.cpphLicOf("A · CC BY-SA 4.0")==="ccbysa"&&P.cpphLicOf("A · CC BY 2.0")==="ccby"&&P.cpphLicOf("A · educational use")==="unknown");
  const shots=[...new Set([].concat(...Object.values(PICS).map(a=>a.map(p=>p.shot))))];
  ok("every shot in the repo index becomes one or more of the 15 tags (leaves → leaf, acorns → fruit, tracks → track …)", shots.every(s=>{ const t=P.cpphShotTags(s); return t.length&&t.every(x=>P.CPPH_TAGS.indexOf(x)>=0); })&&P.cpphShotTags("leaves")[0]==="leaf"&&P.cpphShotTags("acorns")[0]==="fruit"&&P.cpphShotTags("tracks")[0]==="track"&&P.cpphShotTags("live NC")[0]==="live", shots.filter(s=>!P.cpphShotTags(s).length));
  const urls=[...new Set([].concat(...Object.values(PICS).map(a=>a.map(p=>p.url))))];
  ok("every repo picture gets a database-safe id r~<deck>~<item>~<n>, one per picture", urls.every(u=>/^r~[a-z0-9_~-]+$/.test(P.cpphRepoId(u)))&&new Set(urls.map(P.cpphRepoId)).size===urls.length);
  ok("the Commons page of a hot-linked thumbnail (an en-wiki file links to en-wiki)", P.cpphCommons(WIKI)==="https://commons.wikimedia.org/wiki/File:Sassafras_albidum_leaf.jpg"&&/^https:\/\/en\.wikipedia\.org\/wiki\/File:X\.png$/.test(P.cpphCommons("https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/X.png/200px-X.png"))&&P.cpphCommons("https://example.com/x.jpg")==="");
  ok("only a Wikimedia thumbnail or a repo picture is a usable url (live)", P.cpphUrlOk(WIKI)&&P.cpphUrlOk("envirothon/pics/forestry_id/sassafras/1.jpg")&&!P.cpphUrlOk("https://example.com/a.jpg")&&!P.cpphUrlOk("data:image/svg+xml,x")&&!P.cpphUrlOk("javascript:alert(1)"));
  const d={url:WIKI,credit:"Wikipedia · Sassafras",lic:"unknown",tags:{leaf:true}};
  ok("a draft needs a picture, a credit, a licence and a tag; the same picture twice is refused; only a free licence goes to the unit",
    /Pick a photo/.test(P.cpphDraftWhy({}))&&/credit/.test(P.cpphDraftWhy(Object.assign({},d,{credit:" "})))&&/licence/.test(P.cpphDraftWhy(Object.assign({},d,{lic:""})))&&/Tick/.test(P.cpphDraftWhy(Object.assign({},d,{tags:{}})))&&
    /already/.test(P.cpphDraftWhy(d,[{url:WIKI}]))&&/free-licence/.test(P.cpphDraftWhy(d,[],true))&&P.cpphDraftWhy(d,[],false)===""&&P.cpphDraftWhy(Object.assign({},d,{lic:"ccbysa"}),[],true)==="");
  ok("a new photo id is p + base 36", /^p[a-z0-9]{4,24}$/.test(P.cpphNewId())); }

console.log("\n── Howe, DeWalt and Lincoln: nothing on ──");
for(const f of ["howe","dewalt"]){ const w=W({fam:{familyId:f,roster:[]}}), P=w.P; w.G.pics=PICS;
  P._cpph.kidC={[P.cpphKey(ITEM)]:{_hide:{[P.cpphRepoId(repoOf(ITEM)[0].url)]:true}}}; P._cpph.L.c1=P._cpph.kidC; w._envs.kid="lincoln"; w._envs.role="kid"; w._envc.cid="c1";   // layers in memory must still change nothing
  ok(f+": no lookups, no strip, no kid hook, no boot read", P.cpphSite()===false&&P.cpPhotos(ITEM).length===0&&P.cpPhotoById("r~x")===null&&P.cpphStripHtml({i:0,name:"x"})===""&&P.cpphPicsFor(CARD0.deck,CARD0.name,PICS)===undefined&&P.cpphKidLoad(w.firebase.database(),"c1")===false&&w.G.reads.length===0); }
{ const h=W({fam:{familyId:"howe",roster:[]}}); h.G.pics=PICS; h._envs.kid="lincoln"; h._envs.role="kid"; h.P._cpph.kidC={[h.P.cpphKey(ITEM)]:{_main:"r~zzz",_hide:{[h.P.cpphRepoId(repoOf(ITEM)[0].url)]:true}}};
  const plain=W({fam:{familyId:"howe",roster:[]},rev:"function envPicsDeckOn(d){ return true; }\n"+PICSFOR_W.replace(/if\(typeof cpphPicsFor[^}]*\} \}/,"")+"\nG.cpph={envPicsFor};"}); plain.G.pics=PICS;
  ok("Lincoln (a Howe kid, a full class layer in memory): envPicsFor gives the very pictures it gives with no block at all", JSON.stringify(h.P.envPicsFor(CARD0.deck,CARD0.name))===JSON.stringify(PICS[CARD0.name])&&h.P.envPicsFor(CARD0.deck,CARD0.name)===PICS[CARD0.name]); }

console.log("\n── the pool: repo ← unit ← class ──");
{ const w=demo("kid"), P=w.P, k=P.cpphKey(ITEM), R=repoOf(ITEM), r0=P.cpphRepoId(R[0].url), r1=P.cpphRepoId(R[1].url);
  ok("the repo set by item: every picture of "+ITEM+" ("+REPO_N+" from index.json), in order, the shot as a tag", (()=>{ const L=P.cpPhotos(ITEM); return L.length===REPO_N&&L.every((p,i)=>p.url===R[i].url&&p.from==="repo"&&p.tags.length); })());
  ok("an item whose cards say it differently (\"Sweet gum · …\" is Sweetgum) still finds its pictures", (()=>{ const c=IDCARDS.find(x=>x.item&&x.name.split(" · ")[0]!==x.item&&PICS[x.name]); return !c||P.cpPhotos(c.item).length>=new Set(PICS[c.name].map(p=>p.url)).size; })());
  P._cpph.U.nc_envirothon={[k]:{pu1:{url:WIKI,credit:"Adrienne · CC BY-SA 4.0",lic:"ccbysa",tags:{bark:true},by:"a",ts:1},pu2:{url:WIKI.replace("leaf","bad"),credit:"x",lic:"class",tags:{leaf:true},by:"a",ts:2}}};
  P._cpph.L[CID]={[k]:{pc1:{url:WIKI.replace("leaf","twig"),credit:"Wikipedia · Sassafras twig",lic:"unknown",tags:{twig:true},by:"t",ts:3},_main:"pc1",_hide:{[r0]:true}}}; P.cpphStart&&0;
  const L=P.cpPhotos(ITEM), all=P.cpphLayered(ITEM).list;
  ok("the unit's photo joins after the repo's; a unit photo without a free licence is dropped (the rules refuse it too)", all.some(p=>p.id==="pu1"&&p.from==="unit")&&!all.some(p=>p.id==="pu2"));
  ok("the class's photo joins last; ⭐ its main comes FIRST; 🙈 the hidden repo photo is out of the lookup, still in the strip's list", L[0].id==="pc1"&&L[0].main&&!L.some(p=>p.id===r0)&&all.find(p=>p.id===r0).hid===true&&L.length===REPO_N-1+2);
  ok("by tag: cpPhotos(item, \"twig\") and a list of tags", P.cpPhotos(ITEM,"twig").map(p=>p.id).join()==="pc1"&&P.cpPhotos(ITEM,["twig","bark"]).length===1+1+R.filter(p=>/bark/.test(p.shot)).length);
  ok("a mock's fixed id finds its photo even once hidden (the form stays the same)", P.cpPhotoById(r0).url===R[0].url&&P.cpPhotoById("pc1",ITEM).credit==="Wikipedia · Sassafras twig"&&P.cpPhotoById("nope")===null);
  P._cpph.L[CID][k]._main="r~gone";
  ok("a main that isn't there (or is hidden) falls back to the first one showing", P.cpPhotos(ITEM)[0].id===r1);
  if(TRACKY){ const tr=repoOf(TRACKY).filter(p=>/track|skull/i.test(p.shot)).length;
    ok("a card's photos leave out tracks and skulls ("+TRACKY+": "+tr+" of "+repoOf(TRACKY).length+") unless the card is about them — then those come first",
      P.cpPhotoForCard({item:TRACKY,name:TRACKY+" · diet",def:"x"}).length===repoOf(TRACKY).length-tr&&P.cpPhotoForCard({item:TRACKY,name:TRACKY+" · tracks",def:"x"}).slice(0,tr).every(p=>p.tags.some(t=>t==="track"||t==="skull"))); }
  const parts=P.cpPhotoParts(ITEM), want={}; P.CPPH_PARTS.forEach(t=>{ want[t]=P.cpPhotos(ITEM).filter(p=>p.tags.some(x=>x===t||(t==="leaf"&&x==="needle")||(t==="fruit"&&x==="cone"))).length; });
  ok("the parts count per (item, tag) — needles count as leaf, cones as fruit", JSON.stringify(parts)===JSON.stringify(want), [parts,want]);
  const lock=P.cpPhotoTrimLock([ITEM]), short=P.CPPH_PARTS.filter(t=>parts[t]<2);
  ok("the Trim lock: "+(short.length?"🔒 "+short.join(", ")+" short":"ready")+" for "+ITEM+"; the missing count is what the 2-a-part rule still needs", lock.ready===!short.length&&lock.missing===short.reduce((s,t)=>s+2-parts[t],0)&&lock.short.length===short.length);
  P._cpph.L[CID][k].ptw={url:WIKI.replace("leaf","t2"),credit:"x",lic:"cc0",tags:{twig:true,leaf:true,bark:true,fruit:true},by:"t",ts:4}; P._cpph.L[CID][k].ptx={url:WIKI.replace("leaf","t3"),credit:"x",lic:"cc0",tags:{twig:true,leaf:true,bark:true,fruit:true},by:"t",ts:5};
  ok("…and turns ready by itself once each part has 2 (nothing written, the trim itself is still her tap)", P.cpPhotoTrimLock([ITEM]).ready===true&&W_(w).length===0);
  ok("no items → not ready", P.cpPhotoTrimLock([]).ready===false); }

console.log("\n── 📚 Cards (demo): the 🖼 strip, ⭐ and 🙈 ──");
{ const w=demo("teacher"), P=w.P, c=w.ccs.cpcsIndex().C.find(x=>x.item===ITEM&&x.kind==="id"), k=P.cpphKey(ITEM); openCard(w,c);
  const H=w.G.content, n=(H.match(/class="cpph-th/g)||[]).length;
  ok("an opened card shows the strip: “🖼 Photos of "+ITEM+"”, one thumbnail per photo ("+REPO_N+"), the first ⭐, shared by every card of the item", /🖼 Photos of /.test(H)&&n===REPO_N&&/cpph-th main/.test(H)&&/shared by every card of this/.test(H)&&/＋ Add photo/.test(H)&&!/class="cpcs-pic"/.test(H));
  ok("“Shows:” counts the tags", /Shows: [a-z]+ \d/.test(H));
  const id1=P.cpphRepoId(repoOf(ITEM)[1].url); P.cpphPick(c.i,id1);
  ok("tap a photo: its credit, licence, tags, whose it is, ⭐ Main photo and 🙈 Hide for my class", new RegExp(repoOf(ITEM)[1].credit.split(" · ")[0].replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).test(w.G.content)&&/Licence: <b>/.test(w.G.content)&&/the unit’s \(repo set\)/.test(w.G.content)&&/⭐ Main photo/.test(w.G.content)&&/Hide for my class/.test(w.G.content));
  P.cpphMain(c.i,id1);
  ok("⭐ Main photo: ONE write, classPhotos/<cid>/<item>/_main = its id; it is first now", JSON.stringify(last(w))===JSON.stringify({op:"set",path:"classPhotos/"+CID+"/"+k+"/_main",val:id1})&&P.cpPhotos(ITEM)[0].id===id1);
  P.cpphHide(c.i,id1,true);
  ok("🙈 Hide: ONE write, …/_hide/<id> = true; out of the lookup, still in the strip (greyed) with ↩ Show again", JSON.stringify(last(w))===JSON.stringify({op:"set",path:"classPhotos/"+CID+"/"+k+"/_hide/"+id1,val:true})&&!P.cpPhotos(ITEM).some(p=>p.id===id1)&&/cpph-th hid/.test(w.G.content)&&/↩ Show again/.test(w.G.content));
  P.cpphHide(c.i,id1,false);
  ok("↩ Show again: ONE remove of that flag", JSON.stringify(last(w))===JSON.stringify({op:"remove",path:"classPhotos/"+CID+"/"+k+"/_hide/"+id1,val:null})&&P.cpPhotos(ITEM).some(p=>p.id===id1));
  const n0=W_(w).length; P.cpphUndo();
  ok("Undo writes back what was there (the flag again)", W_(w).length===n0+1&&last(w).path==="classPhotos/"+CID+"/"+k+"/_hide/"+id1&&last(w).val===true); }

console.log("\n── ＋ Add photo: 🗂 the pool and 🔎 Wikipedia (demo) ──");
{ const w=demo("teacher"), P=w.P, c=w.ccs.cpcsIndex().C.find(x=>x.item===ITEM&&x.kind==="id"), k=P.cpphKey(ITEM); openCard(w,c); P.cpphAddOpen(c.i);
  const H=w.G.content, total=new Set([].concat(...Object.values(PICS).map(a=>a.map(p=>p.url)))).size;
  ok("＋ Add photo opens the panel: 🔎 Wikipedia / Commons, 🗂 the unit’s pool (open), camera / file named as coming with uploads", /Add a photo to “/.test(H)&&/🔎 Wikipedia \/ Commons/.test(H)&&/🗂 The unit’s pool/.test(H)&&/Camera or file comes with uploads/.test(H)&&!/type="file"/.test(H));
  ok("the pool holds every repo picture once ("+total+"), the first 60 drawn", P.cpphPool("").length===total&&(H.match(/class="cpph-gp/g)||[]).length===Math.min(60,total));
  const other=ITEMS.find(i=>i!==ITEM), byTag=P.cpphPool("skull");
  ok("search by item (“"+other+"”) or by tag (“skull”)", P.cpphPool(other.toLowerCase()).every(p=>p.item.toLowerCase().indexOf(other.toLowerCase())>=0)&&P.cpphPool(other).length>0&&byTag.length>0&&byTag.every(p=>p.tags.indexOf("skull")>=0||/skull/i.test(p.shot)||/skull/i.test(p.item)));
  P.cpphIn("q",""); P._cpph.add.pq=other; w.renderAll(); P.cpphPoolPick(0); const picked=P._cpph.add.draft;
  ok("pick one: its picture, credit, licence and tags come with it, “already stored, so nothing new uploads”", picked.url===P._cpph.add.list[0].url&&picked.credit===P._cpph.add.list[0].credit&&picked.how==="pool"&&/nothing new uploads/.test(w.G.content));
  ok("a teacher sees no “for every class” choice", !/The unit, for every class/.test(w.G.content));
  const n0=W_(w).length, pid=P.cpphSave(c.i), wr=last(w);
  ok("Save: ONE set of classPhotos/<cid>/<item>/<photoId> = {url, credit, lic, tags, item, how, by, ts}", W_(w).length===n0+1&&wr.op==="set"&&wr.path==="classPhotos/"+CID+"/"+k+"/"+pid&&JSON.stringify(Object.keys(wr.val).sort())===JSON.stringify(["by","credit","how","item","lic","tags","ts","url"])&&wr.val.by==="uid_teacher_demo"&&wr.val.item===ITEM&&wr.val.how==="pool");
  ok("…the strip has it, marked as your class’s; the lookup has it", (w.G.content.match(/class="cpph-th/g)||[]).length===REPO_N+1&&/your class’s/.test(w.G.content)&&P.cpPhotos(ITEM).some(p=>p.id===pid));
  P.cpphAddOpen(c.i); P._cpph.add.pq=other; w.renderAll(); P.cpphPoolPick(0); ok("the same picture twice on one item is refused", P.cpphSave(c.i)===null&&W_(w).length===n0+1);
  P.cpphAddOpen(c.i); P.cpphWay("wiki"); P.cpphIn("q","Sassafras albidum"); const r=await P.cpphWiki(c.i), d=P._cpph.add.draft;
  ok("🔎 the demo's lookup is a canned answer: no fetch, UNIT_PICS's lookup not called", !!r&&r.demo===true&&!w.G.fetched&&!w.G.looked&&/^data:image\/svg\+xml/.test(d.url)&&/canned answer/.test(w.G.content));
  ok("…its licence starts “Not sure”, and a Not sure photo stays in the class (the note says so)", d.lic==="unknown"&&d.how==="wiki"&&/stay in your class/.test(w.G.content));
  P.cpphTag("leaf"); P.cpphIn("main",true); const n1=W_(w).length, pid2=P.cpphSave(c.i), u=last(w);
  ok("⭐ ticked: still ONE write — a multi-path update of classPhotos/<cid>/<item> with the photo and _main", W_(w).length===n1+1&&u.op==="update"&&u.path==="classPhotos/"+CID+"/"+k&&u.val._main===pid2&&u.val[pid2].lic==="unknown"&&P.cpPhotos(ITEM)[0].id===pid2);
  P.cpphUndo(); ok("Undo of an add: ONE update back (the record and _main as they were)", last(w).op==="update"&&last(w).val[pid2]===null&&last(w).val._main===null&&!P.cpPhotos(ITEM).some(p=>p.id===pid2)); }

console.log("\n── Adrienne: the unit, free licences only ──");
{ const w=demo("admin"), P=w.P, c=w.ccs.cpcsIndex().C.find(x=>x.item===ITEM&&x.kind==="id"), k=P.cpphKey(ITEM); openCard(w,c); P.cpphAddOpen(c.i);
  const j=P._cpph.add.list.findIndex(p=>p.lic!=="unknown"); P.cpphPoolPick(j);
  ok("a free-licence pick: “The unit, for every class” is offered", /The unit, for every class/.test(w.G.content));
  P.cpphIn("scope","unit"); const pid=P.cpphSave(c.i), wr=last(w);
  ok("…Save → ONE set of units/nc_envirothon/photos/<item>/<photoId>; every class's pool has it", wr.op==="set"&&wr.path==="units/nc_envirothon/photos/"+k+"/"+pid&&P.CPPH_FREE[wr.val.lic]&&P.cpPhotos(ITEM).some(p=>p.id===pid&&p.from==="unit"));
  P.cpphAddOpen(c.i); P.cpphPoolPick(j===0?1:0); P.cpphLic("class");
  ok("“Class use only”: the unit choice disappears (and the draft goes back to My class only)", !/The unit, for every class/.test(w.G.content)&&P._cpph.add.draft.scope==="class"&&/stay in your class/.test(w.G.content));
  P._cpph.add.draft.scope="unit"; P._cpph.add.draft.url=WIKI; const p2=P.cpphSave(c.i);
  ok("…even forced, it saves to the class only", last(w).path==="classPhotos/"+CID+"/"+k+"/"+p2); }

console.log("\n── live: exactly these paths; dry run writes nothing ──");
{ const live=dry=>{ const w=W({dry,remote:{["classPhotos/c1"]:{}}}); w.G.pics=PICS; w._envs.role="teacher"; w._envs.uid="t1"; w._envc.sdb=w.firebase.database(); w._envc.cid="c1"; w._envs.cid="c1"; w._envc.view="cpcards"; return w; };
  const w=live(false), P=w.P; P.cpphStart();
  ok("📚 Cards listens to classPhotos/<cid> and units/<id>/photos while open", w.G.listeners.some(l=>l.p==="classPhotos/c1")&&w.G.listeners.some(l=>l.p==="units/nc_envirothon/photos"));
  await P.cpphCommit({"classPhotos/c1/sassafras/_hide/r~forestry_id~sassafras~1":true},"x"); await w.flush();
  ok("one change, one Firebase call at that very path", JSON.stringify(w.G.writes)===JSON.stringify([["set","classPhotos/c1/sassafras/_hide/r~forestry_id~sassafras~1",true]]));
  ok("live, memory waits for the listener", P.cpphMemGet("classPhotos/c1/sassafras/_hide/r~forestry_id~sassafras~1")===null);
  P._cpph.add={way:"wiki",q:"",draft:{tags:{}}}; w.G.wiki={url:WIKI,credit:"Wikipedia · Sassafras"}; const i=w.ccs.cpcsIndex();
  P._cpph.add={way:"wiki",q:"Sassafras",msg:"",draft:{url:"",credit:"",lic:"",tags:{},main:false,scope:"class"}};
  await P.cpphWiki(0);
  ok("🔎 live: UNIT_PICS's lookup; the thumbnail hot-linked from upload.wikimedia.org, licence Not sure, a link to the file on Commons", (w.G.looked||[]).join()==="Sassafras"&&P._cpph.add.draft.url===WIKI&&P._cpph.add.draft.lic==="unknown"&&/check the file’s licence on Commons/.test(P._cpph.add.draft.credit)&&/commons\.wikimedia\.org\/wiki\/File:/.test(P._cpph.add.draft.commons));
  w.G.wiki={url:"https://example.com/x.jpg"}; await P.cpphWiki(0); ok("a picture from anywhere else is not taken", P._cpph.add.draft.url===WIKI&&/No picture/.test(P._cpph.add.msg));
  const d=live(true); await d.P.cpphCommit({"classPhotos/c1/sassafras/_main":"r~x"},"x"); await d.flush(); ok("?dryrun=1: nothing written", d.G.writes.length===0); }

console.log("\n── the kid's boot: read once, laid over in memory ──");
{ const k=ITEM.toLowerCase(), r0="r~"+repoOf(ITEM)[0].url.replace(/^envirothon\/pics\//,"").replace(/\.jpg$/,"").replace(/\//g,"~");
  const remote={"classPhotos/c1":{[k]:{pk:{url:WIKI,credit:"Wikipedia · Sassafras",lic:"unknown",tags:{leaf:true},by:"t",ts:1},_main:"pk",_hide:{[r0]:true}}},"units/nc_envirothon/photos":{},"classes/c1/settings":{},"students/fam_k/settings":{}};
  const w=W({remote}); w.G.pics=PICS; w._envs.role="kid"; w._envs.kid="k"; w._envs.sid="fam_k"; w._envs.cid="c1"; const P=w.P;
  ok("before the read: envPicsFor is today's", P.envPicsFor(CARD0.deck,CARD0.name)===PICS[CARD0.name]);
  w.envsReadShared();
  ok("ONE once each of classPhotos/<cid> and units/<id>/photos, no listener", w.G.reads.filter(p=>p==="classPhotos/c1").length===1&&w.G.reads.filter(p=>p==="units/nc_envirothon/photos").length===1&&!w.G.listeners.some(l=>/Photos|photos/.test(l.p)));
  const got=P.envPicsFor(CARD0.deck,CARD0.name);
  ok("…then a card's pictures (study, ID Flash, the games): the class's main first, the hidden one gone, the rest in order", got[0].url===WIKI&&!got.some(p=>p.url===repoOf(ITEM)[0].url)&&got.length===REPO_N&&got.slice(1).every((p,i)=>p.url===repoOf(ITEM)[i+1].url));
  ok("…every one in envPicsFor's shape {url, credit, shot}", got.every(p=>typeof p.url==="string"&&"credit" in p&&"shot" in p));
  const terms=LIB.unit.decks.find(d=>/ · Terms$/.test(d.key)), tc=terms.cards[0];
  ok("a Terms card with no photos of its own: still today's answer (none)", P.envPicsFor(terms.key,tc.name)===null);
  P.cpphKidLoad(w.firebase.database(),"c1"); ok("a second load reads nothing more; nothing written", w.G.reads.filter(p=>p==="classPhotos/c1").length===1&&w.G.writes.length===0&&w._envs.writes.length===0);
  const t=W({remote}); t.G.pics=PICS; t._envs.role="teacher"; t._envs.kid="k"; t.P._cpph.kidC=remote["classPhotos/c1"];
  ok("a teacher login never gets the kid's hook", t.P.cpphKidOn()===false&&t.P.envPicsFor(CARD0.deck,CARD0.name)===PICS[CARD0.name]);
  const e=W({remote:{"classPhotos/c1":null}}); e.G.pics=PICS; e._envs.role="kid"; e._envs.kid="k"; e._envs.sid="fam_k"; e._envs.cid="c1"; e.envsReadShared();
  ok("a class with no photo layer: envPicsFor is today's, and no repaint", e.P.envPicsFor(CARD0.deck,CARD0.name)===PICS[CARD0.name]&&e.P.cpphKidRepaint()===false); }

console.log("\n── the rules ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, C=R.classPhotos&&R.classPhotos.$cid, U=R.units&&R.units.$unitId&&R.units.$unitId.photos;
  ok("classPhotos/$cid: read by the class's logins, its teacher and admin; written per item by its teacher or admin", !!C&&/logins\/'\+auth\.uid\+'\/cid'\)\.val\(\) == \$cid/.test(C[".read"])&&/teacher'\)\.val\(\) == auth\.uid/.test(C.$item[".write"])&&/admins/.test(C.$item[".write"])&&!/logins/.test(C.$item[".write"]));
  ok("units/$unitId/photos: read by any signed-in login, written by admin only", !!U&&U[".read"]==="auth != null"&&/admins/.test(U.$item[".write"])&&!/teacher/.test(U.$item[".write"]));
  const rx=s=>{ const m=/matches\(\/(.+?)\/\)/.exec(s); return new RegExp(m[1]); };
  const w=W(), P=w.P, rec=P.cpphRec({url:WIKI,credit:"c",lic:"unknown",tags:{leaf:true,bogus:true},how:"wiki"},ITEM,"u",1), pid=P.cpphNewId(), rid=P.cpphRepoId(repoOf(ITEM)[0].url);
  const kids=Object.keys(C.$item.$pid).filter(x=>x[0]!=="."&&x[0]!=="$");
  ok("the record the code writes has exactly the fields the rules name (an unknown tag dropped)", JSON.stringify(Object.keys(rec).sort())===JSON.stringify(kids.sort())&&JSON.stringify(rec.tags)==='{"leaf":true}');
  ok("its id, the main's id (a class photo or a repo photo) and a hidden id pass", rx(C.$item.$pid[".validate"]).test(pid)&&rx(C.$item._main[".validate"]).test(pid)&&rx(C.$item._main[".validate"]).test(rid)&&rx(C.$item._hide.$pid[".validate"].split("&&")[1]).test(rid));
  const urlRx=C.$item.$pid.url[".validate"].match(/matches\(\/(.+?)\/\)/g).map(m=>new RegExp(m.slice(9,-2)));
  ok("the url rule takes a Wikimedia thumbnail and a repo picture, nothing else", urlRx[0].test(WIKI)&&urlRx[1].test(repoOf(ITEM)[0].url)&&!urlRx.some(r=>r.test("https://example.com/a.jpg"))&&!urlRx.some(r=>r.test("data:image/svg+xml,x")));
  const tagRx=rx(C.$item.$pid.tags.$t[".validate"]);
  ok("the tag rule is the code's 15 tags", P.CPPH_TAGS.every(t=>tagRx.test(t))&&!tagRx.test("bogus"));
  const cl=rx(C.$item.$pid.lic[".validate"]), ul=rx(U.$item.$pid.lic[".validate"]);
  ok("licences: the class takes all six; the unit refuses “Class use only” and “Not sure” (§6.7 rule 4)", P.CPPH_LIC.every(l=>cl.test(l[0]))&&ul.test("ccbysa")&&ul.test("cc0")&&ul.test("own")&&ul.test("ccby")&&!ul.test("class")&&!ul.test("unknown")); }

console.log("\n── the demo file carries the photo set ──");
{ const M=require(path.join(REPO,"envirothon","build","make_demo.js")), p=M.demoPics(), n=Object.values(p.items).reduce((s,a)=>s+a.length,0);
  const urls=new Set([].concat(...Object.values(PICS).map(a=>a.map(x=>x.url))));
  ok("make_demo: every repo picture under its item (each picture once per item), two places to find the files", n>=urls.size&&[...urls].every(u=>Object.values(p.items).some(a=>a.some(r=>r[0]===u)))&&p.bases[0]==="../"&&/^file:\/\//.test(p.bases[1])&&p.items[ITEM].length===REPO_N);
  const html=M.buildDemo(fs.readFileSync(path.join(REPO,"index.html"),"utf8"),"test",{},null,p);
  ok("…written into the page as window.HowePicsDemo, right after the config", /window\.HowePicsDemo=\{"bases"/.test(html)&&html.indexOf("window.HowePicsDemo")<html.indexOf("// CPPHOTOS_START"));
  ok("…and a page built without it has none (the other demos are unchanged)", !/HowePicsDemo=/.test(M.buildDemo(fs.readFileSync(path.join(REPO,"index.html"),"utf8"),"test",{},null))); }

console.log("\n"+pass+" passed, "+fail+" failed"); if(fail) process.exit(1);
};
run().catch(e=>{ console.error(e); process.exit(1); });
