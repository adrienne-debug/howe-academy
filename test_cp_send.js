/*
 * Node tests — 📤 CPSEND, PR 31 of the class platform (DESIGN_class_platform_2026-10-28.md §6.8, §5.1, §8.3, §9, §13 row 31). Her words
 * 2026-10-28: "sending out like one subcategory at a time … send out to all kids … or send out to individual kid for each of these little
 * subcategories or main categories. Then you could also in that section schedule when it's going to be sent out … I don't think sending
 * out like individual cards is necessary, but sections and subsections would be great."
 *   · where the block sits, its typeof-guarded hooks; Howe / Lincoln / DeWalt untouched ("the hooks say no" without the class site);
 *   · compile_unit.js: sections[].concepts (k<n>) and units/<id>/RELEASE_KEYS.json; the rules allow exactly those keys;
 *   · the pure parts: key form, the class's time zone (DST both ways, another zone), the updates (now / schedule / tidy / send now);
 *   · the teacher: 📤 on the 📚 Cards folders (none on an ID species), the sheet, now and scheduled writes, the Send out tree + states,
 *     the toggle, the final, 📋 Sent / Scheduled (Reschedule / Send now / Cancel / Undo), the console's tidy;
 *   · the kid's app: the apply step (cat_hold + cat_open in ONE update, idempotent), the scheduled listener (server clock, due / not yet,
 *     the timer capped at 6 h), the bank (only the open Key Concepts, newest first with the catch-up share), ID Flash, the check-in first;
 *   · the demo: Teacher ▸ 📚 Cards ▸ Wildlife ▸ a Key Concept ▸ 📤 ▸ Maya + Jonah ▸ a date ▸ Kid: "📅 Coming soon", nothing open ▸ the
 *     demo clock ▸ that Key Concept's cards come (after the check-in), the others don't.
 * Uses the world from test_env_site.js; its `o.rev` line injects this block (and mastBankEligible, for the bank).   run: node test_cp_send.js
 */
const fs=require("fs"), path=require("path");
const {world,src,REPO}=require("./test_env_site.js");
const C=require("./units/build/compile_unit.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,500):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const LIB=require(path.join(REPO,"envirothon.js"));
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
const BLK=cut("// CPSEND_START","// CPSEND_END");
const fnSrc=name=>{ const i=src.indexOf("\nfunction "+name+"("); const j=src.indexOf("\n}\n",i); return src.slice(i+1,j+2); };
const MBE=fnSrc("mastBankEligible");
const NAMES="CPSD_TZ, CPSD_AT, CPSD_CAP, _cpsd, cpsdSite, cpsdOn, cpsdSecs, cpsdConcepts, cpsdKcOf, cpsdParse, cpsdLabel, cpsdTz, cpsdNow, cpsdOffset, cpsdAtMs, cpsdDayIn, cpsdFmtDay, cpsdFmtAt, cpsdTzName, cpsdSchedList, cpsdForSid, cpSendDates, cpsdNowUpdate, cpsdSchedUpdate, cpsdConvert, cpsdTidyUpdate, cpsdTidy, cpsdTarget, cpsdCount, cpsdOpen, cpsdClose, cpsdSet, cpsdGo, cpsdUndoDone, cpsdFoldX, cpsdState, cpsdSendHtml, cpsdListHtml, cpsdCancel, cpsdSendNow, cpsdEditOpen, cpsdEditSet, cpsdEditSave, cpsdRelease, cpsdAttach, cpsdDueRel, cpsdNextMs, cpsdCheck, cpsdArm, cpsdConceptMap, cpOpenFilter, cpsdInterleave, cpsdFlash, cpsdKidNote, cpsdDemoJump, cpsdDemoSync, cpsdDemoCards, envmRelease, envmRelAttach, envsStudyHtml, mastBankEligible";
const REV=BLK+"\n"+MBE+"\nfunction mastFullBank(kid){ const b={}; let c=masteryData[kid+'_custom_items']||[]; if(!Array.isArray(c)) c=Object.values(c); c.forEach(x=>{ if(x){ (b[x.cat]=b[x.cat]||[]); if(b[x.cat].indexOf(x.name)<0) b[x.cat].push(x.name); } }); return b; }\nG.cpsd={ "+NAMES+" };";
function W(o){ o=o||{}; const w=world(Object.assign({fam:FAM,envt:true,lib:LIB,rev:o.off?"":REV},o.w||{})); w.S=w.G.cpsd||null; return w; }
function demo(role,o){ const w=W(Object.assign({},o,{w:Object.assign({search:"?demo=1&role="+(role||"teacher")},(o&&o.w)||{})})); w.envSiteDemoBoot(); w.renderAll(); return w; }
const CID="ms-science-2026", flush=()=>new Promise(r=>setImmediate(r));
const UJ=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","unit.json"),"utf8"));
const IDX=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","index.json"),"utf8"));

const run=async()=>{
console.log("── the block, where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPSEND_START"), b=src.indexOf("// CPSEND_END");
  ok("one CPSEND block, with her words and the date", a>0&&b>a&&src.indexOf("// CPSEND_START",a+1)<0&&/sending out like one subcategory at a time/.test(BLK)&&/2026-10-28/.test(BLK.slice(0,600)));
  const hooks=(src.slice(0,a)+src.slice(b)).split("\n").filter(l=>/📤 CPSEND/.test(l)&&!/^\/\//.test(l.trim()));
  ok("its one-line hooks are each tagged 📤 CPSEND and typeof-guarded", hooks.length>0&&hooks.every(l=>/typeof (cpsd\w+|cpOpenFilter)==="function"/.test(l)), hooks.length);
  const where=n=>{ const s=fnSrc(n); return /📤 CPSEND/.test(s); };
  ok("…in cpcsFoldHtml, envcSendHtml, envmRelease, envmRelAttach, mastBankEligible, envFlashDecks, envsStudyHtml", ["cpcsFoldHtml","envcSendHtml","envmRelease","envmRelAttach","mastBankEligible","envFlashDecks","envsStudyHtml"].every(where));
  ok("envcSendHtml: only its first line is new (the old screen is still below it, for a page without the block)", /^function envcSendHtml\(\)\{\n  if\(typeof cpsdSendHtml==="function"\)\{ const _c=cpsdSendHtml\(\); if\(_c!=null\) return _c; \}/.test(fnSrc("envcSendHtml"))&&/Send out a station/.test(fnSrc("envcSendHtml")));
  ok("the block writes the shared project only through envcWrite (→ envsWrite) and the family database only in cpsdRelease, guarded by db && !_dryRun && not the demo", !/firebase\.database\(\)|_envc\.sdb/.test(BLK)&&(BLK.match(/\bdb\.ref\(/g)||[]).length===1&&/typeof db!=="undefined"&&db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)&&!cpsdDemo\(\)\) db\.ref\("mastery\/"\+kid\+"_settings"\)\.update\(upd\)/.test(BLK));
  ok("no 🔀 emoji, no single-card send-out", !/\u{1F500}/u.test(BLK)&&!/#o\d|"card:/.test(BLK)); }

console.log("\n── Howe, Lincoln, DeWalt: the hooks say no ──");
{ const h=world({fam:{familyId:"howe",roster:[]},rev:REV}), S=h.G.cpsd;
  ok("Howe (no edition): not the site, not the console — every entry point returns its 'nothing'", S.cpsdSite()===false&&S.cpsdOn()===false&&S.cpsdFoldX(1,"forestry",true)===null&&S.cpsdSendHtml()===null&&S.cpsdKidNote("lincoln")===""&&S.cpsdRelease("lincoln",{"forestry~k2":{openedAt:1}})===null&&S.cpsdAttach("lincoln","c1",{ref(){ throw new Error("no"); }},{},"howe_lincoln")===false);
  const md={lincoln_settings:{cat_hold:{"Forestry · Terms":true}}};
  ok("cpOpenFilter with no cat_open (every Howe deck): the same list back, same order", (()=>{ const a=["x","y","z"]; h.masteryData.lincoln_settings={cat_hold:{}}; return S.cpOpenFilter("lincoln","Forestry · Terms",a)===a; })());
  // Lincoln's mirror (Howe + the Envirothon config): a Key Concept key and a scheduled record are skipped — ENVMIRROR's own code runs
  const L=world({fam:{familyId:"howe",roster:[],envirothon:{firebase:{databaseURL:"https://x.firebaseio.com"},classId:"c1"}},rev:REV,masteryData:md,unitStudies:{nc_envirothon:{id:"nc_envirothon",starter:"nc_envirothon",enrolled:{lincoln:true},decks:UJ.decks.map(d=>({key:d.key,station:d.section,cards:[]}))}}});
  L.initFb(); const n0=L.G.writes.length;
  ok("Lincoln: a Key Concept key opens nothing and writes nothing (Q52: he skips them until her yes)", L.G.cpsd.envmRelease("lincoln",{"forestry~k2":{openedAt:1,by:"t"}})===0&&L.G.writes.length===n0&&md.lincoln_settings.cat_hold["Forestry · Terms"]===true&&!md.lincoln_settings.cat_open);
  ok("Lincoln: a deck key still opens as today — ONE targeted removal of cat_hold/<deck>, no cat_open", L.G.cpsd.envmRelease("lincoln",{"Forestry · Terms":{openedAt:1}})===1&&JSON.stringify(L.G.writes.slice(n0))===JSON.stringify([["remove","mastery/lincoln_settings/cat_hold/Forestry · Terms"]]));
  L.G.cpsd.envmRelAttach("lincoln"); ok("Lincoln's mirror attaches no scheduled listener (release/<cid>/scheduled is never read in Howe)", !L.G.listeners.some(x=>/scheduled|serverTimeOffset/.test(x.p)));
  const D=world({fam:{familyId:"dewalt",roster:[]},rev:REV}); ok("DeWalt: the same — nothing on", D.G.cpsd.cpsdSite()===false&&D.G.cpsd.cpsdSendHtml()===null);
  ok("without the block, the page is today's (Send out's chips and ticks, the station toggle)", (()=>{ const w=demo("teacher",{off:true}); w.envcView("send"); w.envcSendPick("forestry"); return /Send out a station/.test(w.G.content)&&/Send out now/.test(w.G.content)&&(w.envcSendPick("forestry"),w._envc.send.station===""); })()); }

console.log("\n── compile_unit.js: Key Concept ids, RELEASE_KEYS, the rules ──");
{ const gen=IDX.sections.find(s=>s.key==="general");
  ok("index.sections[].concepts = {id:k<n>, label} in the unit's order — General concepts has 8, The Water Cycle is k2", gen&&gen.concepts.length===8&&gen.concepts[1].id==="k2"&&gen.concepts[1].label==="The Water Cycle"&&gen.concepts[0].label==="The Biosphere"&&gen.concepts.every((k,i)=>k.id==="k"+(i+1)));
  const want={}; LIB.unit.decks.forEach(d=>{ const sec=UJ.decks.find(x=>x.key===d.key).section; d.cards.forEach(c=>{ if(Number.isInteger(c.concept)) (want[sec]=want[sec]||new Set()).add(c.concept); }); });
  ok("every section's concepts are exactly its cards' concept numbers (counted here from envirothon.js)", IDX.sections.every(s=>JSON.stringify((s.concepts||[]).map(k=>+k.id.slice(1)))===JSON.stringify([...(want[s.key]||[])].sort((a,b)=>a-b))));
  ok("the id never uses the name: every id is k<n>, safe as a Firebase key", IDX.sections.every(s=>(s.concepts||[]).every(k=>/^k\d+$/.test(k.id))));
  const RK=JSON.parse(fs.readFileSync(path.join(REPO,"units","nc_envirothon","RELEASE_KEYS.json"),"utf8"));
  ok("units/nc_envirothon/RELEASE_KEYS.json: section keys, <section>~k<n>, deck keys — what compile makes", JSON.stringify(RK)===JSON.stringify(C.releaseKeys(IDX))&&RK.indexOf("general~k2")>=0&&RK.indexOf("Forestry · ID")>=0&&RK.indexOf("aquatics")>=0);
  ok("--check fails while RELEASE_KEYS.json is stale (and is current now)", C.compile("nc_envirothon",{check:true}).ok&&/RELEASE_KEYS/.test(fs.readFileSync(path.join(REPO,"units","build","compile_unit.js"),"utf8")));
  ok("sectionConcepts on a fixture: no concept numbers → none (📤 on sections and decks only)", C.sectionConcepts([{section:"a",cards:[{name:"x"}]}],"a").length===0&&JSON.stringify(C.sectionConcepts([{section:"a",cards:[{name:"x",concept:2,group:"Two"},{name:"y",concept:1,group:"One"}]}],"a"))==='[{"id":"k1","label":"One"},{"id":"k2","label":"Two"}]');
  const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules, rel=R.release.$cid;
  const ALL=[]; C.unitIds(REPO).forEach(id=>JSON.parse(fs.readFileSync(path.join(REPO,"units",id,"RELEASE_KEYS.json"),"utf8")).forEach(k=>ALL.push(k)));
  const rx=v=>{ const m=/\$key\.matches\(\/\^\((.*?)\)\$\/\)/.exec(v); return m?m[1].split("|"):null; };
  ok("release/$cid/all/$key: the key must be one of every unit's RELEASE_KEYS — exactly that list", JSON.stringify(rx(rel.all.$key[".validate"]))===JSON.stringify(ALL));
  ok("…and {openedAt:number, by == auth.uid, level? section|deck|kc, sched?}; students/$sid/$key the same, $sid in the class", /hasChildren\(\['openedAt','by'\]\)/.test(rel.all.$key[".validate"])&&/by'\)\.val\(\) == auth\.uid/.test(rel.all.$key[".validate"])&&/'kc'/.test(rel.all.$key[".validate"])&&rel.students.$sid.$key[".validate"]===rel.all.$key[".validate"]&&/classes\/'\+\$cid\+'\/students\/'\+\$sid\)\.exists\(\)/.test(rel.students.$sid[".validate"]));
  const sv=rel.scheduled.$schedId[".validate"];
  ok("release/$cid/scheduled/$schedId: key checked the same way, level, on YYYY-MM-DD, at HH:MM, to all|{sid:true} in the class, by == auth.uid, ts", /newData\.child\('key'\)\.val\(\)\.matches/.test(sv)&&sv.indexOf(ALL.join("|"))>0&&/\[0-9\]\{4\}-\[0-9\]\{2\}-\[0-9\]\{2\}/.test(sv)&&/\[0-2\]\[0-9\]:\[0-5\]\[0-9\]/.test(sv)&&/'all'/.test(sv)&&/by'\)\.val\(\) == auth\.uid/.test(sv)&&/classes\/'\+\$cid\+'\/students\/'\+\$sid\)\.exists\(\)/.test(rel.scheduled.$schedId.to.$sid[".validate"]));
  ok("writes stay the class's teacher or an admin (the $cid write), read any signed-in login", /classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid \|\| root\.child\('admins/.test(rel[".write"])&&rel[".read"]==="auth != null");
  const tz=R.classes.$cid.tz; ok("classes/$cid/tz: the teacher writes it, an IANA name", tz&&/teacher'\)\.val\(\) == auth\.uid/.test(tz[".write"])&&/matches/.test(tz[".validate"])); }

console.log("\n── the pure parts ──");
{ const w=W(), S=w.S;
  ok("keys: a section, a deck, a Key Concept", JSON.stringify(S.cpsdParse("soils"))==='{"level":"section","sec":"soils"}'&&JSON.stringify(S.cpsdParse("Soils and Land Use · Terms"))==='{"level":"deck","sec":"soils","deck":"Soils and Land Use · Terms"}'&&JSON.stringify(S.cpsdParse("general~k2"))==='{"level":"kc","sec":"general","kc":"k2"}');
  ok("labels from the unit: 'General concepts › The Water Cycle'", S.cpsdLabel("general~k2")==="General concepts › The Water Cycle"&&S.cpsdLabel("soils")==="Soils/Land Use");
  ok("Nov 10, 7:00 AM New York (EST, after the clocks go back) = 12:00 UTC", S.cpsdAtMs("2026-11-10","07:00","America/New_York")===Date.UTC(2026,10,10,12,0));
  ok("Oct 30, 7:00 AM New York (EDT) = 11:00 UTC; the same date in Los Angeles = 14:00 UTC", S.cpsdAtMs("2026-10-30","07:00","America/New_York")===Date.UTC(2026,9,30,11,0)&&S.cpsdAtMs("2026-10-30","07:00","America/Los_Angeles")===Date.UTC(2026,9,30,14,0));
  ok("the class's day: 11:30 PM Nov 9 New York is still Nov 9 there (Nov 10 in UTC)", S.cpsdDayIn(Date.UTC(2026,10,10,4,30),"America/New_York")==="2026-11-09");
  ok("formats: 'Nov 10' · '7:00 AM' · '3:30 PM'", S.cpsdFmtDay("2026-11-10")==="Nov 10"&&S.cpsdFmtAt("07:00")==="7:00 AM"&&S.cpsdFmtAt("15:30")==="3:30 PM");
  const n=S.cpsdNowUpdate("c1",["general~k2"],["a_x","b_y"],"u1",1000);
  ok("send now to picked students: one path each under students/<sid>/, {openedAt, by, level:kc}", JSON.stringify(Object.keys(n))==='["release/c1/students/a_x/general~k2","release/c1/students/b_y/general~k2"]'&&JSON.stringify(n["release/c1/students/a_x/general~k2"])==='{"openedAt":1000,"by":"u1","level":"kc"}');
  ok("send now to all: release/<cid>/all/<key>", JSON.stringify(Object.keys(S.cpsdNowUpdate("c1",["soils"],null,"u1",1)))==='["release/c1/all/soils"]');
  const sc=S.cpsdSchedUpdate("c1",["general~k2"],["a_x"],"2026-11-10","07:00","u1",5,()=>"s1");
  ok("schedule: ONE record at release/<cid>/scheduled/<id> = {key, level, to:{sid:true}, on, at, by, ts} — nothing under all/ or students/", JSON.stringify(sc)==='{"release/c1/scheduled/s1":{"key":"general~k2","level":"kc","to":{"a_x":true},"on":"2026-11-10","at":"07:00","by":"u1","ts":5}}');
  const R={scheduled:{s1:{key:"general~k2",level:"kc",to:"all",on:"2026-11-10",at:"07:00",by:"u1",ts:1},s2:{key:"soils",level:"section",to:{a_x:true},on:"2026-12-01",at:"07:00",by:"u1",ts:1}}}, at1=Date.UTC(2026,10,10,12,0);
  const t=S.cpsdTidyUpdate("c1",R,at1+5,"America/New_York","u2");
  ok("tidy: a due record becomes a normal release record at the scheduled moment (sched:<id>) and is removed, one update; a later one stays", JSON.stringify(t)===JSON.stringify({"release/c1/all/general~k2":{openedAt:at1,by:"u2",level:"kc",sched:"s1"},"release/c1/scheduled/s1":null}));
  ok("…one minute early: nothing", Object.keys(S.cpsdTidyUpdate("c1",R,at1-60000,"America/New_York","u2")).length===0);
  const due=S.cpsdDueRel(R.scheduled,"a_x",Date.UTC(2026,11,1,12,1),"America/New_York");
  ok("the kid's due list: both records name a_x once they're due, each at its own moment", JSON.stringify(Object.keys(due))==='["general~k2","soils"]'&&due["general~k2"].openedAt===at1&&due.soils.sched==="s2");
  ok("…another student isn't in the picked one", JSON.stringify(Object.keys(S.cpsdDueRel(R.scheduled,"b_y",Date.UTC(2026,11,2),"America/New_York")))==='["general~k2"]');
  ok("the next due moment for the timer", S.cpsdNextMs(R.scheduled,"a_x",at1+1,"America/New_York")===Date.UTC(2026,11,1,12,0));
  ok("interleave: newest first, 30 % of the picks from the older ones", JSON.stringify(S.cpsdInterleave(["n1","n2","n3","n4","n5","n6","n7"],["o1","o2","o3"],30))==='["n1","n2","n3","o1","n4","n5","o2","n6","n7","o3"]'); }

console.log("\n── the teacher: 📤 on the 📚 Cards tree ──");
{ const w=demo("teacher"), S=w.S; w.envcView("cpcards"); w.ccs&&0; w.ccs.cpcsTap("st","wildlife"); let h=w.G.content;
  ok("the Wildlife folder has 📤 next to ＋, and every other section's header too", /cpsdOpen\('f:wildlife'\)/.test(h)&&["general","forestry","soils","aquatics","cei"].every(s=>h.indexOf("cpsdOpen('f:"+s+"')")>0)&&/cpceQaOpen\('wildlife'\)/.test(h));
  ok("inside the open section: one 📤 per deck (Terms / Facts / ID)", /cpsdOpen\('d:Wildlife · Terms'\)/.test(h)&&/cpsdOpen\('d:Wildlife · Facts'\)/.test(h)&&/cpsdOpen\('d:Wildlife · ID'\)/.test(h));
  const M=w.ccs.cpcsIndex(), sec=M.secs.find(s=>s.id==="wildlife"), g=sec.groups[0];
  ok("each Key Concept folder has 📤 (→ wildlife~k1 …); the 🔎 ID folder = the ID deck", sec.groups.every(x=>h.indexOf("cpsdOpen('f:"+x.key+"')")>0)&&JSON.stringify(S.cpsdTarget("f:"+g.key).keys)==='["wildlife~k1"]'&&JSON.stringify(S.cpsdTarget("f:wildlife|id").keys)==='["Wildlife · ID"]');
  w.ccs.cpcsTap("grp","wildlife|id"); h=w.G.content;
  ok("an ID species folder gets no 📤 (Q53)", sec.items.length>0&&h.indexOf("cpcsTap('sp','"+sec.items[0].key+"')")>0&&h.indexOf("cpsdOpen('f:"+sec.items[0].key+"')")<0&&S.cpsdTarget("f:"+sec.items[0].key)===null);
  S.cpsdOpen("f:"+g.key); h=w.G.content; const cnt=S.cpsdCount(S._cpsd.sheet), want=LIB.unit.decks.filter(d=>/^Wildlife/.test(d.key)).reduce((a,d)=>a+d.cards.filter(c=>c.concept===1).length,0);
  ok("📤 on Wildlife Ecology opens ONE sheet: '📤 Send out · Wildlife › Wildlife Ecology (N cards ⭐…)' — N = that Key Concept in every deck of the section", /📤 Send out · Wildlife › Wildlife Ecology/.test(h)&&cnt.n===want&&cnt.n>0&&h.indexOf("("+want.toLocaleString("en-US")+" cards")>0, [cnt,want]);
  ok("…Who: All students / Pick students… · When: Now / On a date · the Undo note · Send out now", /All students/.test(h)&&/Pick students…/.test(h)&&/On a date/.test(h)&&/Undo stops future opens only/.test(h)&&/📤 Send out now/.test(h));
  S.cpsdSet("who","pick"); S.cpsdSet("when","date"); h=w.G.content;
  ok("pick students lists every student of the class; On a date shows a date + time (7:00 AM default) and the class's zone", (h.match(/cpsdSet\('pick'/g)||[]).length===w.envcStudents().length&&w.envcStudents().length>1&&/id="cpsd-on"/.test(h)&&/id="cpsd-at" value="07:00"/.test(h)&&/Eastern time/.test(h));
  S.cpsdSet("pick",["ramirez_maya",true]); S.cpsdSet("pick",["tran_jonah",true]); S.cpsdSet("on","2026-11-10"); h=w.G.content;
  ok("the button reads '📅 Schedule for Nov 10, 7:00 AM'", /📅 Schedule for Nov 10, 7:00 AM/.test(h));
  const n0=w._envs.writes.length; S.cpsdGo(); await w.flush(); const wr=w._envs.writes.slice(n0);
  const p=wr[0]&&wr[0].path, v=wr[0]&&wr[0].val;
  ok("Schedule: ONE set of release/<cid>/scheduled/<id> = {key wildlife~k1, level kc, to {Maya, Jonah}, on, at 07:00, by, ts} — demo: would write, nothing written", wr.length===1&&wr[0].op==="set"&&new RegExp("^release/"+CID+"/scheduled/s[a-z0-9]+$").test(p)&&v.key==="wildlife~k1"&&v.level==="kc"&&JSON.stringify(v.to)==='{"ramirez_maya":true,"tran_jonah":true}'&&v.on==="2026-11-10"&&v.at==="07:00"&&v.by==="uid_teacher_demo"&&typeof v.ts==="number"&&w.G.writes.length===0, wr);
  h=w.G.content; ok("…the sheet closes and a '✓ Scheduled …' note with Undo shows where it was", !/id="cpsd-sheet"/.test(h)&&/✓ Scheduled Wildlife › Wildlife Ecology for Nov 10, 7:00 AM · 2 students/.test(h)&&/cpsdUndoDone\(\)/.test(h));
  ok("pace's hook point: cpSendDates lists it (section wildlife, Key Concept k1, its moment)", (()=>{ const d=S.cpSendDates(CID); return d.length===1&&d[0].sec==="wildlife"&&d[0].kc==="k1"&&d[0].ms===Date.UTC(2026,10,10,12,0); })());
  const n1=w._envs.writes.length; S.cpsdUndoDone(); await w.flush(); const uw=w._envs.writes.slice(n1);
  ok("Undo on the note: one removal of that record", uw.length===1&&uw[0].op==="remove"&&uw[0].path===p&&!Object.keys(w._envc.release.scheduled||{}).length);
  S.cpsdOpen("d:Wildlife · Terms"); const n2=w._envs.writes.length; S.cpsdGo(); await w.flush(); const nw=w._envs.writes.slice(n2);
  ok("📤 on the Terms deck ▸ Send out now (all): ONE set of release/<cid>/all/Wildlife · Terms = {openedAt, by, level:deck}", nw.length===1&&nw[0].op==="set"&&nw[0].path==="release/"+CID+"/all/Wildlife · Terms"&&nw[0].val.level==="deck"&&nw[0].val.by==="uid_teacher_demo");
  S.cpsdOpen("f:"+g.key); S.cpsdSet("who","pick"); const n3=w._envs.writes.length; S.cpsdGo(); ok("pick with nobody ticked → nothing written", w._envs.writes.length===n3);
  S.cpsdSet("who","all"); S.cpsdSet("when","date"); S.cpsdSet("on","2026-10-01"); S.cpsdGo(); ok("a date already past → nothing written", w._envs.writes.length===n3);
  S.cpsdSet("who","pick"); S.cpsdSet("when","now"); S.cpsdSet("pick",["kim_theo",true]); S.cpsdSet("pick",["shah_priya",true]); S.cpsdGo(); await w.flush(); const pw=w._envs.writes.slice(n3);
  ok("now to 2 picked students: ONE multi-path update, one key per student under students/<sid>/", pw.length===1&&pw[0].op==="update"&&JSON.stringify(Object.keys(pw[0].val).sort())===JSON.stringify(["release/"+CID+"/students/kim_theo/wildlife~k1","release/"+CID+"/students/shah_priya/wildlife~k1"]));
  ok("the kid's and parent's pages never get a 📤", (()=>{ const k=demo("kid"); const p=demo("parent"); return !/cpsdOpen\(/.test(k.G.content)&&!/cpsdOpen\(/.test(p.G.content)&&k.S.cpsdFoldX(1,"wildlife",true)===null; })()); }

console.log("\n── the teacher: Send out = the same tree, states, the final, 📋 Sent / Scheduled ──");
{ const w=demo("teacher"), S=w.S; w.envcView("send"); let h=w.G.content;
  ok("Send out shows every section folded, each with a state line and 📤 — Forestry '📤 All · …', Wildlife '—', Aquatics '📤 1 student' (Maya)", /📤 Send out/.test(h)&&w.envsStations().every(s=>h.indexOf("envcSendPick('"+s.id+"')")>0&&h.indexOf("cpsdOpen('k:"+s.id+"')")>0)&&/Forestry<\/b><span class="cpsd-st">📤 All · /.test(h)&&/Wildlife<\/b><span class="cpsd-st">—/.test(h)&&/Aquatic Ecology<\/b><span class="cpsd-st">📤 1 student</.test(h)&&!/Send out a station/.test(h));
  w.envcSendPick("general"); h=w.G.content;
  ok("tap General: its decks and its 8 Key Concepts, each with 📤 and '✓ with the station' (it went out whole; the class's word); no final for General", /cpsdOpen\('k:General Concepts · Terms'\)/.test(h)&&(h.match(/cpsdOpen\('k:general~k\d'\)/g)||[]).length===8&&/The Water Cycle/.test(h)&&/✓ with the station/.test(h)&&!/envcFinalOut\(\)/.test(h));
  w.envcSendPick("general"); ok("tap it again: it closes (ENVSENDTOGGLE kept)", w._envc.send.station===""&&!/cpsdOpen\('k:general~k2'\)/.test(w.G.content));
  w.envcSendPick("wildlife"); h=w.G.content; ok("Wildlife open: '📝 Open the final · Wildlife' with whole class / pick students, as before", /envcFinalOut\(\)/.test(h)&&/Open the final · Wildlife/.test(h)&&/Pick students/.test(h));
  w._envc.send.to="pick"; w._envc.send.picked={ramirez_maya:true}; const nf=w._envs.writes.length; w.envcFinalOut(); await w.flush();
  ok("…and it still writes final/students/<sid>/wildlife for the picked one", JSON.stringify(Object.keys(w._envs.writes[nf].val))===JSON.stringify(["release/"+CID+"/final/students/ramirez_maya/wildlife"]));
  w._envc.send={station:"wildlife",decks:null,to:"class",picked:{}};
  S.cpsdOpen("k:wildlife~k2"); S.cpsdSet("when","date"); S.cpsdSet("on","2026-11-10"); S.cpsdGo(); await w.flush();
  S.cpsdOpen("k:wildlife~k3"); S.cpsdGo(); await w.flush(); h=w.G.content;
  ok("the tree's states: Wildlife '◐ 2 of 4 Key Concepts out', k2 '📅 Nov 10 · all', k3 '📤 All · …'", /Wildlife<\/b><span class="cpsd-st">◐ 2 of 4 Key Concepts out/.test(h)&&/Classification, Adaptations, and Identification<span class="cpsd-st">📅 Nov 10 · all/.test(h)&&/Conservation and Management of Wildlife<span class="cpsd-st">📤 All · /.test(h), h.slice(h.indexOf("Wildlife<\/b>"),h.indexOf("Wildlife<\/b>")+120));
  const L=h.slice(h.indexOf("📋 Sent / Scheduled"));
  ok("📋 Sent / Scheduled: the scheduled one first ('📅 Nov 10, 7:00 AM Eastern time', ✎ Reschedule · Send now · Cancel), then the sent ones newest first with Undo", /📋 Sent \/ Scheduled/.test(h)&&L.indexOf("Wildlife › Wildlife Classification")<L.indexOf("Wildlife › Conservation")&&/📅 Nov 10, 7:00 AM Eastern time/.test(L)&&/cpsdEditOpen\('s/.test(L)&&/cpsdSendNow\('s/.test(L)&&/cpsdCancel\('s/.test(L)&&/envcUndo\('release\/ms-science-2026\/all\/wildlife~k3'\)/.test(L)&&/Forestry \(whole station\)/.test(L));
  const id=Object.keys(w._envc.release.scheduled)[0], sp="release/"+CID+"/scheduled/"+id;
  S.cpsdEditOpen(id); ok("✎ Reschedule opens date / time / who for that record", /id="cpsd-e-on" value="2026-11-10"/.test(w.G.content));
  S.cpsdEditSet("on","2026-11-17"); S.cpsdEditSet("at","08:30"); S.cpsdEditSet("who","pick"); S.cpsdEditSet("pick",["walker_caleb",true]); let n0=w._envs.writes.length; S.cpsdEditSave(); await w.flush(); let x=w._envs.writes.slice(n0);
  ok("Save: ONE set of that same record — on Nov 17, at 08:30, to Caleb; key and level kept", x.length===1&&x[0].op==="set"&&x[0].path===sp&&x[0].val.on==="2026-11-17"&&x[0].val.at==="08:30"&&JSON.stringify(x[0].val.to)==='{"walker_caleb":true}'&&x[0].val.key==="wildlife~k2"&&x[0].val.level==="kc");
  n0=w._envs.writes.length; S.cpsdSendNow(id); await w.flush(); x=w._envs.writes.slice(n0);
  ok("Send now: ONE update — the release record for Caleb now (sched:<id>) + the scheduled record removed", x.length===1&&x[0].op==="update"&&JSON.stringify(Object.keys(x[0].val).sort())===JSON.stringify(["release/"+CID+"/scheduled/"+id,"release/"+CID+"/students/walker_caleb/wildlife~k2"].sort())&&x[0].val[sp]===null&&x[0].val["release/"+CID+"/students/walker_caleb/wildlife~k2"].sched===id);
  S.cpsdOpen("k:wildlife~k4"); S.cpsdSet("when","date"); S.cpsdSet("on","2026-11-20"); S.cpsdGo(); await w.flush(); const id2=Object.keys(w._envc.release.scheduled)[0];
  n0=w._envs.writes.length; S.cpsdCancel(id2); await w.flush(); x=w._envs.writes.slice(n0);
  ok("Cancel: one removal of that record", x.length===1&&x[0].op==="remove"&&x[0].path==="release/"+CID+"/scheduled/"+id2&&!w._envc.release.scheduled[id2]);
  // the console tidies a due record when she opens Send out after the date
  S.cpsdOpen("k:soils~k1"); S.cpsdSet("when","date"); S.cpsdSet("on","2026-11-02"); S.cpsdGo(); await w.flush(); const id3=Object.keys(w._envc.release.scheduled)[0];
  S._cpsd.demoMs=7*86400000; n0=w._envs.writes.length; w.envcView("send"); await w.flush(); x=w._envs.writes.slice(n0);
  ok("past its date, opening Send out tidies it: ONE update → release/<cid>/all/soils~k1 {openedAt: its moment, sched} + the record removed", x.length===1&&x[0].op==="update"&&x[0].val["release/"+CID+"/scheduled/"+id3]===null&&x[0].val["release/"+CID+"/all/soils~k1"].openedAt===Date.UTC(2026,10,2,12,0)&&x[0].val["release/"+CID+"/all/soils~k1"].sched===id3, x);
  w.renderAll(); ok("…and it lists as a sent row '📅 scheduled' with Undo; opening again writes nothing more", /📅 scheduled/.test(w.G.content)&&(()=>{ const m=w._envs.writes.length; w.envcView("send"); return w._envs.writes.length===m; })());
  const a=demo("admin"); a.envcView("send"); ok("Adrienne gets the same screen", /📋 Sent \/ Scheduled/.test(a.G.content)&&/cpsdOpen\('k:forestry'\)/.test(a.G.content));
  const k=demo("kid"); const nk=k._envs.writes.length; k.S.cpsdOpen("k:soils"); k.S.cpsdGo(); k.S.cpsdCancel("x"); ok("a kid on the site can't send out anything (no console)", k._envs.writes.length===nk&&k.S.cpsdSendHtml()===null); }

console.log("\n── the kid's app: the apply step (family database) ──");
const deck=(key,sec,cards)=>({key,station:sec,cards});
const card=(name,concept,extra)=>Object.assign({name,def:"d",concept,group:"G"+concept},extra||{});
function kidWorld(md,o){ const decks=[deck("General Concepts · Terms","general",[card("Biosphere",1),card("Runoff",2),card("Aquifer",2),card("Glucose",3)]),deck("General Concepts · Facts","general",[card("Fact one",1),card("Fact two",2),card("Fact three",3)]),deck("Forestry · Terms","forestry",[card("Cambium",2)]),deck("Forestry · ID","forestry",[card("Loblolly pine · needles",4,{item:"Loblolly pine"}),card("Bald cypress · knees",2,{item:"Bald cypress"})])];
  const fam=Object.assign({},FAM,{envirothon:{firebase:{databaseURL:"https://howe-envirothon-default-rtdb.firebaseio.com"},familyId:"ramirez",kids:["maya"],classId:CID}});   // what ENVSITE sets at a kid's login
  const w=W({w:Object.assign({fam,masteryData:md,unitStudies:{nc_envirothon:{id:"nc_envirothon",starter:"nc_envirothon",enrolled:{maya:true},decks}}},o||{})}); w._envs.role="kid"; w._envs.kid="maya"; w._envs.sid="ramirez_maya"; w._envs.cid=CID; w.initFb(); w.U=w.unitStudies.nc_envirothon; return w; }
{ const md={maya_settings:{cat_hold:{"General Concepts · Terms":true,"General Concepts · Facts":true,"Forestry · Terms":true,"Forestry · ID":true}}}; const w=kidWorld(md), S=w.S;
  ok("the class site's kid: on", S.cpsdSite()===true);
  const n0=w.G.writes.length; const r=S.cpsdRelease("maya",{"general~k2":{openedAt:111,by:"t",level:"kc"}},w.U); const wr=w.G.writes.slice(n0);
  ok("general~k2 (The Water Cycle): ONE update of mastery/maya_settings — for each deck of General: cat_hold/<deck> null + cat_open/<deck>/k2 = the moment", r===4&&wr.length===1&&wr[0][0]==="update"&&wr[0][1]==="mastery/maya_settings"&&JSON.stringify(wr[0][2])===JSON.stringify({"cat_hold/General Concepts · Terms":null,"cat_open/General Concepts · Terms/k2":111,"cat_hold/General Concepts · Facts":null,"cat_open/General Concepts · Facts/k2":111}), wr);
  ok("…in memory at once (the bank reads it now): holds gone, cat_open set, Forestry untouched", !md.maya_settings.cat_hold["General Concepts · Terms"]&&md.maya_settings.cat_open["General Concepts · Terms"].k2===111&&md.maya_settings.cat_hold["Forestry · Terms"]===true);
  ok("applying it again changes nothing (no write)", S.cpsdRelease("maya",{"general~k2":{openedAt:222}},w.U)===0&&w.G.writes.length===n0+1);
  S.cpsdRelease("maya",{"general~k3":{openedAt:333}},w.U); const w3=w.G.writes[w.G.writes.length-1];
  ok("a second Key Concept: only cat_open/<deck>/k3 (the hold is already gone)", JSON.stringify(w3[2])===JSON.stringify({"cat_open/General Concepts · Terms/k3":333,"cat_open/General Concepts · Facts/k3":333}));
  S.cpsdRelease("maya",{"forestry~k4":{openedAt:444}},w.U); const w4=w.G.writes[w.G.writes.length-1];
  ok("forestry~k4: only the deck that HAS that Key Concept (Forestry · ID) opens; Forestry · Terms (no k4 card) stays held", JSON.stringify(w4[2])===JSON.stringify({"cat_hold/Forestry · ID":null,"cat_open/Forestry · ID/k4":444})&&md.maya_settings.cat_hold["Forestry · Terms"]===true);
  S.cpsdRelease("maya",{"general":{openedAt:555}},w.U); const w5=w.G.writes[w.G.writes.length-1];
  ok("then the whole section: cat_open/<deck> removed for each deck (the whole deck open), in one update", JSON.stringify(w5[2])===JSON.stringify({"cat_hold/General Concepts · Terms":null,"cat_open/General Concepts · Terms":null,"cat_hold/General Concepts · Facts":null,"cat_open/General Concepts · Facts":null})&&!md.maya_settings.cat_open["General Concepts · Terms"]);
  S.cpsdRelease("maya",{"Forestry · ID":{openedAt:666}},w.U); ok("a deck key after its Key Concept: removes that deck's cat_open", JSON.stringify(w.G.writes[w.G.writes.length-1][2])===JSON.stringify({"cat_hold/Forestry · ID":null,"cat_open/Forestry · ID":null}));
  ok("envmRelease goes through it on the site (the hook) and the old path's deck-by-deck removal isn't used", (()=>{ const m=w.G.writes.length; md.maya_settings.cat_hold["Forestry · Terms"]=true; const n=S.envmRelease("maya",{"forestry":{openedAt:1}}); const x=w.G.writes.slice(m); return n>0&&x.length===1&&x[0][0]==="update"&&x[0][1]==="mastery/maya_settings"; })());
  const dry=kidWorld({maya_settings:{cat_hold:{"General Concepts · Terms":true}}},{dry:true}); const m=dry.G.writes.length; dry.S.cpsdRelease("maya",{"general~k1":{openedAt:1}},dry.U);
  ok("dry run: the memory changes, the database doesn't", dry.G.writes.length===m&&dry.masteryData.maya_settings.cat_open["General Concepts · Terms"].k1===1); }

console.log("\n── the kid's app: the bank, ID Flash, the check-in ──");
{ const md={maya_settings:{cat_hold:{},cat_open:{"General Concepts · Terms":{k1:100,k2:900}}},maya_custom_items:[]}; const w=kidWorld(md), S=w.S;
  ["Biosphere","Runoff","Aquifer","Glucose"].forEach(n=>md.maya_custom_items.push({cat:"General Concepts · Terms",name:n,def:"d"}));
  ok("cpOpenFilter: only the open Key Concepts' cards (Glucose, k3, stays out); the newest (k2) first", JSON.stringify(S.cpOpenFilter("maya","General Concepts · Terms",["Biosphere","Runoff","Aquifer","Glucose"]))==='["Runoff","Aquifer","Biosphere"]');
  ok("mastBankEligible (the real one + its hook) gives the same", JSON.stringify(S.mastBankEligible("maya","General Concepts · Terms"))==='["Runoff","Aquifer","Biosphere"]');
  md.maya_settings.cat_open["General Concepts · Terms"]={k1:true,k2:true}; ok("opened together (same moment): the unit's order", JSON.stringify(S.cpOpenFilter("maya","General Concepts · Terms",["Runoff","Biosphere","Aquifer","Glucose"]))==='["Biosphere","Runoff","Aquifer"]');
  delete md.maya_settings.cat_open["General Concepts · Terms"]; ok("no cat_open for the deck: everything, untouched", S.mastBankEligible("maya","General Concepts · Terms").length===4);
  md.maya_settings.cat_open["General Concepts · Terms"]={k1:1}; w.U.decks[0].cards.push({name:"Her card",def:"x",concept:"The Biosphere"}); S._cpsd.map={};
  ok("a card she added (PR 10), named by its Key Concept, joins that Key Concept", JSON.stringify(S.cpOpenFilter("maya","General Concepts · Terms",["Her card","Runoff"]))==='["Her card"]');
  const out=[{key:"Forestry · ID",unit:w.U,items:[{item:"Loblolly pine"},{item:"Bald cypress"}]},{key:"Wildlife · ID",unit:w.U,items:[{item:"x"}]}];
  md.maya_settings.cat_open["Forestry · ID"]={k4:1}; S.cpsdFlash("maya",out);
  ok("ID Flash: a deck opened by Key Concept keeps only those items (Loblolly pine, k4); a deck without cat_open untouched", out.length===2&&JSON.stringify(out[0].items)==='[{"item":"Loblolly pine"}]'&&out[1].items.length===1);
  ok("envFlashDecks calls it right before PR 10's line", /cpsdFlash\(kid,out\);[^\n]*\n  if\(typeof cpceFlash/.test(fnSrc("envFlashDecks")));
  // the check-in fires on the section's FIRST release at any level (ENVTEST unchanged): a Key Concept clears the holds → the cards wait for it
  const md2={maya_settings:{cat_hold:{"Wildlife · Terms":true,"Wildlife · Facts":true,"Wildlife · ID":true}},maya_custom_items:[{cat:"Wildlife · Terms",name:"Habitat",def:"d"}]};
  const w2=kidWorld(md2); w2.U.decks.push(deck("Wildlife · Terms","wildlife",[card("Habitat",1),card("Raptor",2)])); w2.masteryData.maya_custom_items.push({cat:"Wildlife · Terms",name:"Raptor",def:"d"});
  ok("before: Wildlife held, no check-in offered", w2.S.mastBankEligible("maya","Wildlife · Terms").length===0&&w2.envt.envtWaitsForCheckin("maya","Wildlife · Terms")===true);
  w2.S.cpsdRelease("maya",{"wildlife~k1":{openedAt:5}},w2.U);
  ok("after wildlife~k1: the check-in comes first (its cards wait), then only Habitat (k1), not Raptor (k2)", w2.S.mastBankEligible("maya","Wildlife · Terms").length===0&&(w2.masteryData.maya_tests={wildlife:{pre:{right:3,n:15}}},JSON.stringify(w2.S.mastBankEligible("maya","Wildlife · Terms"))==='["Habitat"]')); }

console.log("\n── the kid's app: the scheduled listener (server clock, class zone, timer) ──");
{ const md={maya_settings:{cat_hold:{"General Concepts · Terms":true,"General Concepts · Facts":true}}}; const w=kidWorld(md), S=w.S;
  const now=w.G.now, tz="America/New_York", today=S.cpsdDayIn(now,tz), later=S.cpsdDayIn(now+2*86400000,tz);
  w.G.remote["release/"+CID+"/scheduled"]={s1:{key:"general~k2",level:"kc",to:{ramirez_maya:true},on:later,at:"07:00",by:"t",ts:1},s2:{key:"general~k1",level:"kc",to:{tran_jonah:true},on:today,at:"00:00",by:"t",ts:1}};
  const subs={}; const n0=w.G.writes.length; S.cpsdAttach("maya",CID,w.firebase.database(),subs,"ramirez_maya");
  ok("one listener on release/<cid>/scheduled + the server's clock offset; once per kid", w.G.listeners.some(l=>l.p==="release/"+CID+"/scheduled")&&w.G.listeners.some(l=>l.p===".info/serverTimeOffset")&&S.cpsdAttach("maya",CID,w.firebase.database(),subs,"ramirez_maya")===true&&w.G.listeners.filter(l=>l.p==="release/"+CID+"/scheduled").length===1);
  ok("Maya's record isn't due yet → nothing opens; Jonah's due one isn't hers → nothing", w.G.writes.length===n0&&md.maya_settings.cat_hold["General Concepts · Terms"]===true);
  const t=(w.G.timers||[]).filter(x=>x.ms>1000).pop(); ok("one timer armed for the next moment, capped at 6 h", !!t&&t.ms===6*3600000, t&&t.ms);
  S._cpsd.off=3*86400000; S.cpsdCheck("maya"); const wr=w.G.writes.slice(n0);
  ok("the server's clock past the moment (offset = 3 days): it opens through the same apply — one update, k2 at the scheduled moment", wr.length===1&&wr[0][2]["cat_open/General Concepts · Terms/k2"]===S.cpsdAtMs(later,"07:00",tz));
  S.cpsdCheck("maya"); ok("checking again: nothing more", w.G.writes.length===n0+1);
  ok("a tablet clock set ahead doesn't open it: the due test uses Date.now() + the server's offset, never anything else", /function cpsdNow\(\)\{ return Date\.now\(\)\+\(_cpsd\.off\|\|0\)\+\(cpsdDemo\(\)\?_cpsd\.demoMs:0\); \}/.test(BLK));
  ok("visibilitychange re-checks; the class zone comes from classes/<cid>/tz (read once when the class record isn't here)", /visibilitychange/.test(BLK)&&w.G.reads.indexOf("classes/"+CID+"/tz")>=0);
  // the note on the kid's page
  const w2=kidWorld({maya_settings:{cat_hold:{"General Concepts · Terms":true}}}); w2.G.remote["release/"+CID+"/scheduled"]={s1:{key:"general~k2",level:"kc",to:"all",on:S.cpsdDayIn(now+86400000,tz),at:"07:00",by:"t",ts:1}};
  w2.S.cpsdAttach("maya",CID,w2.firebase.database(),{},"ramirez_maya"); const note=w2.S.cpsdKidNote("maya");
  ok("the kid's study page: '📅 Coming soon · General concepts › The Water Cycle · <date>, 7:00 AM' (no demo clock outside the demo)", /📅 Coming soon/.test(note)&&/General concepts › The Water Cycle · [A-Z][a-z]{2} \d+, 7:00 AM/.test(note)&&!/Demo clock/.test(note)&&/cpsdKidNote\(kid\)\+body/.test(fnSrc("envsStudyHtml"))); }

console.log("\n── the demo: Teacher ▸ 📚 Cards ▸ Wildlife ▸ a Key Concept ▸ 📤 ▸ 2 students ▸ a date ▸ Kid ▸ the demo clock ──");
{ const w=demo("teacher"), S=w.S; w.envcView("cpcards"); w.ccs.cpcsTap("st","wildlife"); const M=w.ccs.cpcsIndex(), g=M.secs.find(s=>s.id==="wildlife").groups[0];
  S.cpsdOpen("f:"+g.key); S.cpsdSet("who","pick"); S.cpsdSet("pick",["ramirez_maya",true]); S.cpsdSet("pick",["tran_jonah",true]); S.cpsdSet("when","date"); S.cpsdSet("on","2026-11-03"); S.cpsdGo(); await w.flush();
  const md=w.masteryData, hold=md.maya_settings.cat_hold;
  w.envsDemoGo("kid"); let h=w.G.content;
  ok("Kid (Maya): '📅 Coming soon · Wildlife › Wildlife Ecology · Nov 3, 7:00 AM' and a demo-clock button; Wildlife still held", /📅 Coming soon/.test(h)&&/Wildlife › Wildlife Ecology · Nov 3, 7:00 AM/.test(h)&&/cpsdDemoJump\('s/.test(h)&&hold["Wildlife · Terms"]===true&&hold["Wildlife · Facts"]===true);
  const id=Object.keys(w._envc.release.scheduled)[0]; S.cpsdDemoJump(id); h=w.G.content;
  ok("⏩ to Nov 3: Wildlife's decks open by Key Concept (cat_open k1), the note is gone", !hold["Wildlife · Terms"]&&md.maya_settings.cat_open["Wildlife · Terms"]&&Object.keys(md.maya_settings.cat_open["Wildlife · Terms"]).join()==="k1"&&!/📅 Coming soon/.test(h));
  const bank=S.cpOpenFilter("maya","Wildlife · Terms",(md.maya_custom_items||[]).filter(c=>c.cat==="Wildlife · Terms").map(c=>c.name)), lib=LIB.unit.decks.find(d=>d.key==="Wildlife · Terms").cards, kOf=n=>(lib.find(c=>c.name===n)||{}).concept;
  ok("…the sample cards it brought: only Wildlife Ecology's (k1) reach her bank — the other Key Concepts' don't", bank.length>0&&bank.every(n=>kOf(n)===1)&&(md.maya_custom_items||[]).some(c=>c.cat==="Wildlife · Terms"&&kOf(c.name)===2));
  ok("…and the Wildlife check-in comes first (ENVTEST: released, no pre yet → the cards wait)", w.envt.envtWaitsForCheckin("maya","Wildlife · Terms")===true&&S.mastBankEligible("maya","Wildlife · Terms").length===0);
  w.envsDemoGo("teacher"); w.envcView("send"); await w.flush(); h=w.G.content;
  ok("Teacher ▸ Send out: the console tidied it (Maya and Jonah each get a sent row '📅 scheduled'), the clock shows 'moved on'", /Wildlife › Wildlife Ecology<\/b> · Maya R\./.test(h)&&/Wildlife › Wildlife Ecology<\/b> · Jonah T\./.test(h)&&/📅 scheduled/.test(h)&&/moved on/.test(h)&&!Object.keys(w._envc.release.scheduled||{}).length); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.log("  FAIL- threw: "+(e&&e.stack||e)); process.exit(1); });
