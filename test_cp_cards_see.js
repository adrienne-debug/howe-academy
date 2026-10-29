/*
 * Node tests — 📚 CPCARDSSEE, the teacher's cards browser, read-only (DESIGN_class_platform_2026-10-28.md §6.0, §6.1, §8.4, §13 row 9, §15;
 * her words 2026-10-28: "super easy for her to quickly go through and see all the questions and the answers, or the front or the back …
 * not look like a huge amount, so things need to collapse … naturally collapsed unless she opens them, and then if she moves on, collapse
 * it back"). The look is the agreed mockup, ~/Desktop/Envirothon/MOCKUP_teacher_browser.html.
 *   · where the block sits and how it is hooked (2 typeof-guarded lines; the console's chips array literal is not edited);
 *   · Howe / DeWalt / Burris inert (also in test_env_site.js); the kid's and parent's pages never show it;
 *   · 📚 Cards for the teacher and Adrienne, before 🃏 Teacher cards (which stays until PR 10);
 *   · FOLDING: everything folded at first; one open at each level; opening the next folds the last; moving on (another chip) folds it all;
 *   · COUNTS on every header, counted HERE FROM THE DATA (envirothon.js + unit.json's deck → section map), never typed in;
 *   · PAGING: 20 rows a folder, "Show 20 more · N left", back to 20 after folding; search 30 at a time;
 *   · SEARCH across fronts, backs, info and sources; CHIPS: Terms / Facts / ID, ⭐ Core only, Not on any test (§8.4's links);
 *   · AN OPENED CARD: back, info, ⭐ Core / Not core, deck, item, source, "On the tests: …" / "On no test question";
 *   · THE LINKS: compile_unit.js's matcher on fixtures; LINKS.json current; envirothon.js's questions carry them; the demo's browse copy;
 *   · nothing is written anywhere.
 * Uses the world from test_env_site.js (the real ENVSITE + ENVCONSOLE + ENVCLASSSET + CPCLASS + CPUNIT + CPCARDSSEE blocks; CCS = this block).
 *                                                                                                   run: node test_cp_cards_see.js
 */
const fs=require("fs"), path=require("path"), os=require("os");
const {world,src,CCS,REPO}=require("./test_env_site.js");
const C=require("./units/build/compile_unit.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
function demo(role,o){ const w=world(Object.assign({fam:FAM,search:"?demo=1&role="+(role||"teacher"),lib:LIB},o||{})); w.envSiteDemoBoot(); w.renderAll(); return w; }
function open(w){ w.envcView("cpcards"); return w.G.content; }
const N=n=>Number(n).toLocaleString("en-US");
const RX=t=>new RegExp(String(t).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
// ── what the data says, counted here: every card with its section (unit.json), kind, Key Concept / item, and its questions (LINKS.json)
const UJ=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","unit.json"),"utf8"));
const LINKS=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","LINKS.json"),"utf8"));
const SEC={}; UJ.decks.forEach(d=>{ SEC[d.key]=d.section; });
const CARDS=[]; LIB.unit.decks.forEach(d=>d.cards.forEach(c=>CARDS.push({id:d.key+"#o"+c.order,deck:d.key,sec:SEC[d.key],kind:c.kind,name:c.name,def:c.def,src:c.src||"",info:c.info||"",item:c.item||"",group:c.group,core:!!c.core})));
const LINKED=new Set(); Object.keys(LINKS).forEach(s=>Object.keys(LINKS[s]).forEach(q=>LINKS[s][q].forEach(id=>LINKED.add(id))));
const bySec=s=>CARDS.filter(c=>c.sec===s), core=a=>a.filter(c=>c.core).length;
const SECS=UJ.sections.map(s=>s.key);

const run=async()=>{
console.log("── the block, where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPCARDSSEE_START"), b=src.indexOf("// CPCARDSSEE_END");
  ok("one CPCARDSSEE block, right after CPSEATS_END (which sits right after CPUNIT_END)", a>0&&b>a&&src.indexOf("// CPCARDSSEE_START",a+1)<0&&src.slice(src.indexOf("// CPSEATS_END"),a).trim()==="// CPSEATS_END");
  const decl=l=>!l.trim()||/^(\/\/|function |const |let |var | |})/.test(l);
  ok("the block only declares (nothing runs at boot)", CCS.split("\n").every(decl));
  const hooks=src.split("\n").filter(l=>/📚 CPCARDSSEE/.test(l)&&l.indexOf("// CPCARDSSEE_START")<0&&(src.indexOf(l)<a||src.indexOf(l)>b));
  ok("exactly 2 hook lines outside the block, each typeof-guarded: the chip (after the console's chip list) and the view dispatch", hooks.length===2&&hooks.every(l=>/typeof cpcs\w+==="function"/.test(l))&&hooks.some(l=>/cpcsChips\(chips\)/.test(l))&&hooks.some(l=>/v==="cpcards"&&typeof cpcsHtml==="function"\) h\+=cpcsHtml\(\)/.test(l)), hooks);
  const lit=src.slice(src.indexOf("function envConsoleHtml(){"),src.indexOf("function envConsoleHtml(){")+3000).split("\n").find(l=>/const chips=\[\["grid"/.test(l));
  ok("the console's chips array literal is not edited (no cpcards in it; 🃏 Teacher cards still there)", !!lit&&lit.indexOf("cpcards")<0&&lit.indexOf('["cards","\\u{1F0CF} Teacher cards"]')>0);
  ok("no write of any kind in the block (no ref(, set(, update(, envsWrite, envcWrite, envcMulti, db.)", !/\bref\(|\.set\(|\.update\(|envsWrite|envcWrite|envcMulti|\bdb\./.test(CCS));
  ok("no Envirothon word in the browser's strings: section, Key Concept and item words come from cpLabel", !/["'][^"']*\b(Station|station|Key Concept|species|check-in|Check-in)\b[^"']*["']/.test(CCS.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n")));
  ok("no Howe kid name as a code literal; no 🔀", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(CCS)&&CCS.indexOf("\u{1F500}")<0); }

console.log("\n── Howe, DeWalt, Burris: inert ──");
["howe","dewalt","burris"].forEach(f=>{ const w=world({fam:{familyId:f,roster:[]},lib:LIB}), c=w.ccs, chips=[["grid","a"],["cards","b"]];
  ok(f+": cpcsOn false; the chips come back the very same array, untouched; no page, no index; taps change nothing; nothing created, read or written", c.cpcsOn()===false&&c.cpcsChips(chips)===chips&&chips.length===2&&c.cpcsHtml()===""&&c.cpcsIndex()===null&&(c.cpcsTap("st","forestry"),c._cpcs.os===null)&&w.G.created.length===0&&w.G.reads.length===0&&w.G.writes.length===0&&w.G.listeners.length===0); });
{ const k=demo("kid"), p=demo("parent");
  ok("the kid's and the parent's pages have no 📚 Cards (cpcsOn is the console's only)", k.ccs.cpcsOn()===false&&p.ccs.cpcsOn()===false&&!/cpcsTap|cpcs-list/.test(k.G.content)&&!/cpcsTap|cpcs-list/.test(p.G.content)); }

console.log("\n── 📚 Cards in the console ──");
{ const w=demo("teacher"), a=demo("admin");
  const chipRow=h=>(h.match(/<div class="envs-chips">([\s\S]*?)<\/div>/)||["",""])[1];
  const t=chipRow(w.G.content), ad=chipRow(a.G.content);
  ok("teacher: 📚 Cards sits right before 🃏 Teacher cards (which stays until PR 10)", /envcView\('cpcards'\)">📚 Cards<\/button><button[^>]*envcView\('cards'\)">🃏 Teacher cards/.test(t), t.slice(0,400));
  ok("Adrienne: the same chip", /📚 Cards<\/button><button[^>]*>🃏 Teacher cards/.test(ad));
  ok("the chip is added once, however often the console paints", (w.renderAll(),w.renderAll(),(w.G.content.match(/envcView\('cpcards'\)/g)||[]).length===1));
  const h=open(w);
  ok("tapping it opens the browser: the search box, the chips, the list", /id="cpcs-q"/.test(h)&&/id="cpcs-chips"/.test(h)&&/id="cpcs-list"/.test(h)&&/placeholder="Search fronts, backs, sources…"/.test(h));
  ok("the cards come from the unit's own file (HoweUnits.nc_envirothon = envirothon.js): every card of every attached section is indexed", w.ccs.cpcsLib("nc_envirothon")===LIB&&w.ccs.cpcsIndex().C.length===CARDS.length, [w.ccs.cpcsIndex().C.length,CARDS.length]);
  ok("nothing was written", w.G.writes.length===0&&w.G.envs===undefined); }

console.log("\n── first open: everything folded, counts from the data on every station line ──");
{ const w=demo("teacher"), h=open(w), L=(h.match(/<div id="cpcs-list">[\s\S]*$/)||[""])[0];
  ok("six station lines and nothing else open (no Key Concept, no row)", (L.match(/class="cpcs-fold" id="cpcs-h-/g)||[]).length===SECS.length&&!/cpcs-fold[^"]*open/.test(L)&&!/cpcs-row/.test(L));
  SECS.forEach(s=>{ const a=bySec(s), lab=UJ.sections.find(x=>x.key===s).label;
    ok(lab+": “"+N(a.length)+" cards · ⭐ "+N(core(a))+"”", RX('<div class="cpcs-t1">'+lab+'</div><div class="cpcs-cnt"><span><b>'+N(a.length)+'</b> cards</span><span>⭐ '+N(core(a))+'</span></div>').test(L.replace(/&#39;|&amp;/g,m=>m==="&amp;"?"&":"'")||L)); });
  ok("the note uses the unit's words: “Tap a station, then a Key Concept (or an ID species), then a card. …”", /Tap a station, then a Key Concept \(or an ID species\), then a card\. Only one thing opens at a time; opening the next folds the last\./.test(L));
  const tot=w.ccs.cpcsIndex(); ok("the index holds every card and every core card ("+N(CARDS.length)+" / "+N(core(CARDS))+")", tot.C.length===CARDS.length&&tot.C.filter(c=>c.core).length===core(CARDS)); }

console.log("\n── folding: one open at each level; opening the next folds the last; moving on folds back ──");
{ const w=demo("teacher"); open(w); const c=w.ccs, S=c._cpcs, M=c.cpcsIndex(), F=M.secs.find(s=>s.id==="forestry"), W=M.secs.find(s=>s.id==="wildlife");
  const openCount=(lvl)=>(w.G.content.match(new RegExp('class="cpcs-fold'+(lvl>1?' l'+lvl:'')+' open"','g'))||[]).length;
  c.cpcsTap("st","forestry");
  const kcs=[...new Set(bySec("forestry").filter(x=>x.kind!=="id").map(x=>x.group))], items=[...new Set(bySec("forestry").filter(x=>x.kind==="id").map(x=>x.item))];
  ok("Forestry open: its "+kcs.length+" Key Concepts + 🔎 ID · "+items.length+" species, all folded", S.os==="forestry"&&openCount(1)===1&&openCount(2)===0&&F.groups.length===kcs.length&&F.items.length===items.length&&RX("🔎 ID · "+items.length+" species").test(w.G.content));
  F.groups.forEach(g=>{ const a=bySec("forestry").filter(x=>x.kind!=="id"&&x.group===g.label); if(!RX('<div class="cpcs-t1">'+g.label+'</div><div class="cpcs-cnt"><span><b>'+N(a.length)+'</b> cards</span>'+(core(a)?'<span>⭐ '+N(core(a))+'</span>':'')+'</div>').test(w.G.content)) ok("Key Concept header "+g.label, false); });
  ok("every Key Concept header carries its own counts (cards · ⭐ core), counted from the data", F.groups.every(g=>{ const a=bySec("forestry").filter(x=>x.kind!=="id"&&x.group===g.label); return g.cards.length===a.length&&RX('<b>'+N(a.length)+'</b> cards</span>'+(core(a)?'<span>⭐ '+N(core(a))+'</span>':'')).test(w.G.content); }));
  const cOrd=[]; LIB.unit.decks.filter(d=>SEC[d.key]==="forestry").forEach(d=>d.cards.forEach(x=>{ if(x.kind!=="id"&&!cOrd.some(y=>y[0]===x.group)) cOrd.push([x.group,+x.concept,cOrd.length]); }));
  const expOrd=cOrd.sort((a,b)=>(a[1]-b[1])||(a[2]-b[2])).map(x=>x[0]);
  ok("Key Concepts come in the unit's concept order ("+expOrd.join(" · ")+"), terms before facts inside each", JSON.stringify(F.groups.map(g=>g.label))===JSON.stringify(expOrd)&&F.groups.every(g=>{ const k=g.cards.map(x=>x.kind); return k.indexOf("fact")<0||k.lastIndexOf("term")<k.indexOf("fact"); }));
  const g0=F.groups[0].key, g1=F.groups[1].key;
  c.cpcsTap("grp",g0); ok("a Key Concept opens; the station stays open; no card open", S.og===g0&&openCount(1)===1&&openCount(2)===1&&!/cpcs-row open/.test(w.G.content));
  const r0=F.groups[0].cards[0].i, r1=F.groups[0].cards[2].i;
  c.cpcsTap("row",r0); ok("a card opens: its row is the one open row, the back shows below it", S.or===r0&&(w.G.content.match(/cpcs-row open/g)||[]).length===1&&RX('<div class="cpcs-back">'+F.groups[0].cards[0].def.replace(/&/g,"&amp;").replace(/</g,"&lt;")).test(w.G.content));
  c.cpcsTap("row",r1); ok("opening another card folds the first (one open row, the second)", S.or===r1&&(w.G.content.match(/cpcs-row open/g)||[]).length===1&&RX('id="cpcs-r-'+r1+'"').test(w.G.content)&&!RX('class="cpcs-row open" id="cpcs-r-'+r0+'"').test(w.G.content));
  c.cpcsTap("row",r1); ok("tapping the open card again folds it", S.or===null&&!/cpcs-row open/.test(w.G.content));
  c.cpcsTap("row",r0); c.cpcsTap("grp",g1); ok("opening the next Key Concept folds the last AND the card she left", S.og===g1&&S.or===null&&openCount(2)===1&&!/cpcs-row open/.test(w.G.content));
  c.cpcsTap("grp","forestry|id"); const sp0=F.items[0].key, sp1=F.items[1].key;
  c.cpcsTap("sp",sp0); ok("🔎 ID opens, then a species: three levels open (station, ID, species), never a fourth", S.og==="forestry|id"&&S.osp===sp0&&openCount(1)===1&&openCount(2)===1&&openCount(3)===1);
  c.cpcsTap("sp",sp1); ok("opening the next species folds the last", S.osp===sp1&&openCount(3)===1);
  c.cpcsTap("st","wildlife"); ok("opening another station folds Forestry and everything under it", S.os==="wildlife"&&S.og===null&&S.osp===null&&S.or===null&&openCount(1)===1&&openCount(2)===0&&RX('class="cpcs-fold open" id="cpcs-h-wildlife"').test(w.G.content));
  c.cpcsTap("st","wildlife"); ok("tapping the open station folds it: six station lines again", S.os===null&&openCount(1)===0);
  // Bald Eagle (design §13 row 9's tap): Wildlife ▸ 🔎 ID ▸ Bald Eagle ▸ a card — the row drops "Bald Eagle · "
  const BE=W.items.find(x=>x.label==="Bald Eagle"), beCards=CARDS.filter(x=>x.item==="Bald Eagle");
  c.cpcsTap("st","wildlife"); c.cpcsTap("grp","wildlife|id"); c.cpcsTap("sp",BE.key);
  ok("Wildlife ▸ 🔎 ID · "+W.items.length+" species ▸ Bald Eagle: "+beCards.length+" rows, each the front without “Bald Eagle · ”", !!BE&&BE.cards.length===beCards.length&&RX("🔎 ID · "+W.items.length+" species").test(w.G.content)&&(w.G.content.match(/class="cpcs-tag I">I<\/span><span class="cpcs-rt">/g)||[]).length===Math.min(20,beCards.length)&&!/cpcs-rt">Bald Eagle · /.test(w.G.content));
  // moving on: another chip folds everything, so 📚 Cards opens folded next time
  w.envcView("roster"); ok("moving on to another chip folds it all back (station, folder, species, card, paging, chips, search)", S.os===null&&S.og===null&&S.osp===null&&S.or===null&&S.q===""&&S.kind==="all"&&Object.keys(S.f).length===0);
  open(w); ok("…and 📚 Cards opens folded again", !/cpcs-fold[^"]*open/.test((w.G.content.match(/<div id="cpcs-list">[\s\S]*$/)||[""])[0])); }

console.log("\n── an opened card: back, info, core, deck, item, source, the tests ──");
{ const w=demo("teacher"); open(w); const c=w.ccs, M=c.cpcsIndex();
  const linked=M.C.find(x=>LINKED.has(x.id)&&x.info&&x.kind==="term"), lone=M.C.find(x=>!LINKED.has(x.id)&&x.core&&x.kind==="id");
  c.cpcsTap("st",linked.sec); c.cpcsTap("grp",linked.g.key); c.cpcsTap("row",linked.i);
  const qs=[]; Object.keys(LINKS).forEach(s=>Object.keys(LINKS[s]).forEach(q=>{ if(LINKS[s][q].indexOf(linked.id)>=0){ const sh=UJ.sections.find(x=>x.key===s).short; const lab=sh+" "+(q.split("-")[0]==="pre"?"check-in":"final")+" Q"+q.split("-")[1]; if(qs.indexOf(lab)<0) qs.push(lab); } }));
  const det=(w.G.content.match(/<div class="cpcs-det">[\s\S]*?<\/div><\/div>/)||[""])[0];
  ok("a linked term (“"+linked.name+"”): the back, ℹ️ info, Not core / ⭐ Core, its deck, its source, and “On the tests: "+qs.join(", ")+"”", /cpcs-back/.test(det)&&RX("ℹ️ ").test(det)&&RX(linked.core?"⭐ Core":"Not core").test(det)&&RX(linked.deck).test(det)&&RX("Source: ").test(det)&&/On the tests: /.test(det)&&qs.every(q=>RX('<span class="cpcs-lk">'+q+'</span>').test(det)), [qs,det.slice(0,600)]);
  c.cpcsTap("st",lone.sec); c.cpcsTap("grp",lone.sec+"|id"); c.cpcsTap("sp",lone.g.key); c.cpcsTap("row",lone.i);
  const det2=(w.G.content.match(/<div class="cpcs-det">[\s\S]*?<\/div><\/div>/)||[""])[0];
  ok("an ID card on no test (“"+lone.name+"”): ⭐ Core · its deck · its item, and “On no test question”", /<b>⭐ Core<\/b>/.test(det2)&&RX(lone.deck+" · "+lone.item).test(det2)&&/On no test question/.test(det2));
  { // the photo: the block alone with the unit's picture index stubbed (ENVIDFLASH's envPicsIndex)
    const PICS=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","pics","index.json"),"utf8")), name=Object.keys(PICS).find(k=>CARDS.some(x=>x.name===k)), card=CARDS.find(x=>x.name===name);
    const f=new Function("PICS",'function envcOn(){ return true; } function envsEsc(v){ return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); } function envPicsIndex(){ return PICS; } function envcJ(s){ return s; }\n'+CCS+'\nreturn {cpcsDetailHtml};');
    const d=f(PICS).cpcsDetailHtml({id:card.id,deck:card.deck,kind:"id",name:card.name,def:card.def,src:card.src,info:"",item:card.item,core:card.core},{Q:{},anyTests:true});
    ok("an opened card with a picture shows its first photo and its credit (“"+name+"”)", RX('<img class="cpcs-pic" src="'+PICS[name][0].url+'"').test(d)&&RX(PICS[name][0].credit.replace(/&/g,"&amp;")).test(d));
    const d2=f(PICS).cpcsDetailHtml({id:"x#o1",deck:"x",kind:"term",name:"No such front",def:"b",src:"s",info:"",item:"",core:false},{Q:{},anyTests:true});
    ok("a card without one shows none", !/<img/.test(d2)); } }

console.log("\n── 20 rows at a time, Show 20 more ──");
{ const w=demo("teacher"); open(w); const c=w.ccs, S=c._cpcs, M=c.cpcsIndex();
  const big=[].concat(...M.secs.map(s=>s.groups)).sort((a,b)=>b.cards.length-a.cards.length)[0], sec=big.key.split("|")[0], n=big.cards.length;
  c.cpcsTap("st",sec); c.cpcsTap("grp",big.key);
  const rows=()=>(w.G.content.match(/class="cpcs-row/g)||[]).length;
  ok("the biggest folder ("+big.label+", "+n+" cards) shows 20 rows and “Show 20 more · "+N(n-20)+" left”", c.CPCS_PAGE===20&&rows()===20&&RX("Show 20 more · "+N(n-20)+" left").test(w.G.content));
  c.cpcsTap("more",big.key); ok("Show more → 40 rows, “· "+N(n-40)+" left”", rows()===40&&RX("Show 20 more · "+N(n-40)+" left").test(w.G.content));
  const small=M.secs.find(s=>s.id===sec).groups.find(g=>g.cards.length>20&&g.cards.length<40&&g!==big)||null;
  if(small){ c.cpcsTap("grp",small.key); ok("a folder of "+small.cards.length+": “Show "+(small.cards.length-20)+" more · "+(small.cards.length-20)+" left”", RX("Show "+(small.cards.length-20)+" more · "+(small.cards.length-20)+" left").test(w.G.content)); }
  c.cpcsTap("grp",big.key); if(S.og!==big.key) c.cpcsTap("grp",big.key); ok("coming back to the folder starts again at 20 (folding back resets its paging)", rows()===20&&!S.more[big.key]);
  const tiny=M.secs.find(s=>s.id==="general").groups.find(g=>g.cards.length<=20); c.cpcsTap("st","general"); c.cpcsTap("grp",tiny.key);
  ok("a folder of 20 or fewer has no Show more", rows()===tiny.cards.length&&!/cpcs-more/.test(w.G.content)); }

console.log("\n── search: fronts, backs, info, sources; one flat list with paths, 30 at a time ──");
{ const w=demo("teacher"); open(w); const c=w.ccs, S=c._cpcs;
  const hit=(q,x)=>[x.name,x.def,x.info,x.src].some(t=>String(t||"").toLowerCase().indexOf(q)>=0);
  c.cpcsSearch("cambium"); ok("typing waits a beat (one timer), then searches", S.q===""&&(w.G.timers||[]).length===1&&(w.tick(),S.q==="cambium"));
  const exp=CARDS.filter(x=>hit("cambium",x));
  ok("“cambium”: "+exp.length+" cards across every station, the count line, each row with its path (“Forestry › …”), the match marked", RX("<b>"+exp.length+"</b> cards match “cambium” across every station").test(w.G.content)&&(w.G.content.match(/class="cpcs-row/g)||[]).length===exp.length&&/cpcs-crumb">Forestry › /.test(w.G.content)&&/<mark>/.test(w.G.content));
  ok("search reaches the backs too (a card whose front lacks the word is in the list)", exp.some(x=>x.name.toLowerCase().indexOf("cambium")<0));
  const src1="Wildlife Manual"; c.cpcsSearch(src1); w.tick(); const e2=CARDS.filter(x=>hit(src1.toLowerCase(),x));
  ok("…and the sources (“"+src1+"”: "+N(e2.length)+"), 30 rows and “Show 30 more”", RX("<b>"+N(e2.length)+"</b> cards match").test(w.G.content)&&(w.G.content.match(/class="cpcs-row/g)||[]).length===30&&RX("Show 30 more · "+N(e2.length-30)+" left").test(w.G.content));
  c.cpcsTap("more","search"); ok("Show 30 more → 60", (w.G.content.match(/class="cpcs-row/g)||[]).length===60);
  const inf=CARDS.find(x=>x.info&&x.info.length>40&&!hit(x.info.slice(16,36).toLowerCase(),Object.assign({},x,{info:""}))), q=inf.info.slice(16,36), e3=CARDS.filter(x=>hit(q.toLowerCase(),x));
  c.cpcsSearch(q); w.tick(); ok("…and the info line (“"+q+"”: "+e3.length+", including “"+inf.name+"”, whose front, back and source don't have it)", RX("<b>"+N(e3.length)+"</b> card"+(e3.length===1?"":"s")+" match").test(w.G.content)&&new RegExp('<span class="cpcs-rt"><div class="cpcs-crumb">[^<]*</div>'+RX(inf.name.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;")).source).test(w.G.content));
  c.cpcsSearch("x"); w.tick(); ok("one letter is not a search: the folders come back", !/cards match/.test(w.G.content)&&/class="cpcs-fold" id="cpcs-h-forestry"/.test(w.G.content));
  c.cpcsSearch("cambium"); w.tick(); c.cpcsTap("clear"); ok("✕ clears it: the folders come back", S.q===""&&!/cards match/.test(w.G.content)); }

console.log("\n── the chips: Terms / Facts / ID, ⭐ Core only, Not on any test ──");
{ const w=demo("teacher"); const h=open(w), c=w.ccs, S=c._cpcs;
  ok("the chips row: All · Terms · Facts · ID · ⭐ Core only · Not on any test", /All<\/button><button[^>]*>Terms<\/button><button[^>]*>Facts<\/button><button[^>]*>ID<\/button><span class="cpcs-sep">·<\/span><button[^>]*>⭐ Core only<\/button><button[^>]*>Not on any test<\/button>/.test(h));
  const hdr=(s)=>{ const m=w.G.content.match(RX('id="cpcs-h-'+s+'"')); return !!m; };
  const check=(label,pred)=>{ let good=true; SECS.forEach(s=>{ const all=bySec(s), a=all.filter(pred); if(!a.length){ if(hdr(s)) good=false; return; }
      if(!RX('<b>'+N(a.length)+'</b> of '+N(all.length)+' cards</span>'+(core(a)?'<span>⭐ '+N(core(a))+'</span>':'')).test(w.G.content)) good=false; }); ok(label,good); };
  c.cpcsTap("kind","id"); check("ID: each station's header reads “N of M cards · ⭐ core” for its ID cards; General concepts and CEI drop out (no ID cards)", x=>x.kind==="id");
  ok("…General and Current Environmental Issues are gone from the list", !hdr("general")&&!hdr("cei"));
  c.cpcsTap("kind","term"); check("Terms: the counts are the terms", x=>x.kind==="term");
  c.cpcsTap("kind","fact"); check("Facts: the counts are the facts", x=>x.kind==="fact");
  c.cpcsTap("kind","all"); c.cpcsTap("f","core"); check("⭐ Core only: the counts are the core cards ("+N(core(CARDS))+")", x=>x.core);
  c.cpcsTap("f","core"); c.cpcsTap("f","notest"); check("Not on any test: the cards no question links to (§8.4 · "+N(CARDS.filter(x=>!LINKED.has(x.id)).length)+" of "+N(CARDS.length)+")", x=>!LINKED.has(x.id));
  c.cpcsTap("f","core"); check("⭐ Core only + Not on any test together: core cards on no test ("+N(CARDS.filter(x=>x.core&&!LINKED.has(x.id)).length)+")", x=>x.core&&!LINKED.has(x.id));
  ok("a chip is on (filled) while it filters", /class="cpcs-chip on" onclick="cpcsTap\('f','core'\)"/.test(w.G.content)&&/class="cpcs-chip on" onclick="cpcsTap\('f','notest'\)"/.test(w.G.content));
  c.cpcsTap("st","forestry"); const F=c.cpcsIndex().secs.find(s=>s.id==="forestry");
  ok("inside a station, the Key Concept headers read “N of M” too, and folders with nothing left drop out", F.groups.every(g=>{ const a=g.cards.filter(x=>x.core&&!LINKED.has(x.id)); return a.length?RX('<b>'+N(a.length)+'</b> of '+N(g.cards.length)+' cards').test(w.G.content):!RX('id="cpcs-h-'+g.key.replace(/[^a-z0-9_-]/gi,"_")+'"').test(w.G.content); }));
  ok("nothing was written", w.G.writes.length===0); }

console.log("\n── a unit without tests, core or items: the chips it can't use stay away ──");
{ const w=demo("teacher"); open(w); const c=w.ccs;
  const plain={unit:{decks:LIB.unit.decks.map(d=>({key:d.key,kind:d.kind,cards:d.cards.filter(x=>x.kind==="term").map(x=>({name:x.name,def:x.def,group:x.group,order:x.order,src:x.src,kind:"term"}))}))},tests:{}};
  w.cpu.win.HoweUnits.nc_envirothon=plain; w.cpu.win.HoweEnvirothon=plain; c._cpcs.memo=null;
  const ch=c.cpcsChipsHtml();
  ok("no core, no tests, one kind: no kind chips, no ⭐ Core only, no Not on any test; the headers show no ⭐", ch===""&&!/⭐/.test(c.cpcsListHtml()));
  ok("a card with no tests anywhere shows no “On no test question” line", (()=>{ c.cpcsTap("st","forestry"); const g=c.cpcsIndex().secs.find(s=>s.id==="forestry").groups[0]; c.cpcsTap("grp",g.key); c.cpcsTap("row",g.cards[0].i); return !/On no test question|On the tests/.test(w.G.content); })());
  c._cpcs.kind="id"; ok("a filter that leaves nothing says so: “No card matches these filters.”", /No card matches these filters\./.test(c.cpcsListHtml())&&!/cpcs-fold/.test(c.cpcsListHtml())); }

console.log("\n── the demo: the whole unit from the page's browse copy (HoweEnvirothon holds the questions only) ──");
{ const {demoBrowse,browseScript}=require(path.join(REPO,"envirothon","build","make_demo.js")), b=demoBrowse(), sb={}; new Function("window",browseScript(b).replace(/^<script>\n?/,"").replace(/<\/script>$/,""))(sb);
  const w=demo("teacher",{lib:{demo:true,tests:LIB.tests}}); w.cpu.win.HoweUnitsDemo=sb.HoweUnitsDemo; open(w);
  ok("the browser shows every card ("+N(CARDS.length)+") and the questions' links work (Not on any test = "+N(CARDS.filter(x=>!LINKED.has(x.id)).length)+")", w.ccs.cpcsIndex().C.length===CARDS.length&&w.ccs.cpcsIndex().C.filter(x=>!(w.ccs.cpcsIndex().Q[x.id]||[]).length).length===CARDS.filter(x=>!LINKED.has(x.id)).length);
  ok("the browse copy is read only in the demo: a live console ignores window.HoweUnitsDemo", (()=>{ const L=world({fam:FAM,lib:{tests:LIB.tests}}); L.cpu.win.HoweUnitsDemo=sb.HoweUnitsDemo; return L.ccs.cpcsLib("nc_envirothon")===null; })());
  ok("…and the kid's cards are still the demo's sample deck (HoweEnvirothon has no unit)", !w.cpu.win.HoweEnvirothon.unit); }

console.log("\n── loading: the first open asks for the unit's file once, and draws when it comes ──");
{ const w=world({fam:FAM,search:"?demo=1&role=teacher",lib:null}); w.envSiteDemoBoot(); w.renderAll();
  const h=open(w);
  ok("no cards yet → “Loading the cards…” and ONE script element asked for envirothon.js", /Loading the cards…/.test(h)&&w.G.created.filter(e=>e.tag==="script").length===1&&/envirothon\.js$/.test(w.G.created.find(e=>e.tag==="script").src));
  open(w); ok("painting again doesn't ask twice", w.G.created.filter(e=>e.tag==="script").length===1);
  const s=w.G.created.find(e=>e.tag==="script"); w.cpu.win.HoweEnvirothon=LIB; s.onload(); await w.flush();
  ok("when it arrives the browser draws the stations", /id="cpcs-h-forestry"/.test(w.G.content)&&!/Loading the cards/.test(w.G.content)); }

console.log("\n── the links (§8.4): compile_unit.js works them out; the unit's file carries them ──");
{ const r=C.compile("nc_envirothon",{check:true});
  ok("compile_unit.js --check: LINKS.json is current and envirothon.js's questions carry exactly its links", r.ok, r.err);
  const L=C.loadUnit(REPO,"nc_envirothon"), links=C.questionLinks(L.decks,L.tests);
  ok("questionLinks() gives LINKS.json exactly", JSON.stringify(links)===JSON.stringify(LINKS));
  const T=LIB.tests; let all=true, n=0; Object.keys(T).forEach(s=>["pre","post"].forEach(f=>(T[s][f].items||[]).forEach(it=>{ n++; if(JSON.stringify(it.cards)!==JSON.stringify((LINKS[s]||{})[f+"-"+it.n]||[])) all=false; })));
  ok("every one of envirothon.js's "+n+" questions carries its `cards` ([] where none)", all&&n>0);
  ok("every linked card exists (deck#o<order>)", [...LINKED].every(id=>CARDS.some(x=>x.id===id)));
  ok("General concepts (no tests of its own) links to any station's question; a tested station's cards only to its own", Object.keys(LINKS).every(s=>Object.values(LINKS[s]).every(a=>a.every(id=>{ const c=CARDS.find(x=>x.id===id); return c.sec===s||c.sec==="general"; })))&&Object.values(LINKS).some(q=>Object.values(q).some(a=>a.some(id=>id.indexOf("General Concepts")===0))));
  // the matcher on a fixture
  const decks=[{key:"A · Terms",section:"a",kind:"terms",cards:[{name:"Cambium",def:"growth layer",order:1,kind:"term"},{name:"Bark",def:"outside",order:2,kind:"term"},{name:"Ash",def:"tree",order:3,kind:"term"},{name:"Cambiums",def:"x",order:4,kind:"term"}]},
    {key:"A · Facts",section:"a",kind:"facts",cards:[{name:"What feeds on the cambium?",def:"The Emerald Ash Borer",order:1,kind:"fact"},{name:"Q",def:"Gypsy Moth larvae",order:2,kind:"fact"}]},
    {key:"A · ID",section:"a",kind:"id",cards:[{name:"Bald Eagle · food",def:"fish",item:"Bald Eagle",order:1,kind:"id"}]},
    {key:"G · Terms",section:"g",kind:"terms",cards:[{name:"Photosynthesis",def:"sugar",order:1,kind:"term"}]},
    {key:"B · Terms",section:"b",kind:"terms",cards:[{name:"Cambium",def:"other station",order:1,kind:"term"}]}];
  const tests={sections:{a:{pre:{items:[{id:"pre-1",n:1,q:"This insect damages trees by feeding on the CAMBIUM layer (photosynthesis aside).",choices:["Ips beetle","Emerald Ash Borer"],ans:1},{id:"pre-2",n:2,q:"Which bird is on the seal? The bald eagle.",choices:["Yes","No"],ans:0}]}},b:{pre:{items:[{id:"pre-1",n:1,q:"Nothing here",choices:["a","b"],ans:0}]}}}};
  const FX=C.questionLinks(decks,tests);
  ok("fixture: a term links on its whole front, any case (Cambium, not Cambiums); 3-letter fronts never link (Ash); a fact links when the keyed answer is in its back; an item card on its item; General-like sections with no tests link anywhere; another tested section's cards never",
    JSON.stringify(FX.a["pre-1"])===JSON.stringify(["A · Terms#o1","A · Facts#o1","G · Terms#o1"])&&JSON.stringify(FX.a["pre-2"])===JSON.stringify(["A · ID#o1"])&&JSON.stringify(FX.b["pre-1"])==="[]", FX);
  const root=fs.mkdtempSync(path.join(os.tmpdir(),"cpcs-")); const put=(rel,o)=>{ const p=path.join(root,rel); fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,JSON.stringify(o)); };
  put("units/fix_unit/unit.json",{id:"fix_unit",title:"F",sections:[{key:"a"},{key:"g"},{key:"b"}],decks:decks.map(d=>({key:d.key,section:d.section,kind:d.kind,cards:d.cards.map(c=>Object.assign({src:"p.1"},c))}))}); put("units/fix_unit/tests.json",{sections:{a:{pre:{form:"F",items:tests.sections.a.pre.items}},b:{pre:{form:"F",items:tests.sections.b.pre.items}}}});
  const a=C.compile("fix_unit",{root,check:true}), b=C.compile("fix_unit",{root,write:true}), c=C.compile("fix_unit",{root,check:true});
  const js=fs.readFileSync(path.join(root,"units","fix_unit.js"),"utf8"), lib=new Function("module",js.replace(/^\/\*.*\*\/\n/,"")+";return module.exports;")({exports:{}});
  ok("a unit's plain run writes LINKS.json, --check fails before it and passes after, and units/<id>.js carries `cards` on each question", !a.ok&&a.err.some(e=>/LINKS\.json is not current/.test(e))&&b.ok&&c.ok&&fs.existsSync(path.join(root,"units","fix_unit","LINKS.json"))&&JSON.stringify(lib.tests.a.pre.items[0].cards)===JSON.stringify(FX.a["pre-1"])&&JSON.stringify(lib.tests.b.pre.items[0].cards)==="[]", [a.err,b.err,c.err]); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.error(e); process.exit(1); });
