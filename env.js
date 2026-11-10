// env.js — 🌿 THE ENVIROTHON SITE AND THE CLASS LINK: the one-page Envirothon site routed by login role (ENVSITE), the coach's
// console (ENVCONSOLE), the class settings (ENVCLASSSET) and the family → class mirror (ENVMIRROR). Moved VERBATIM out of
// index.html on 2026-11-08 (LAZYSPLIT, PLAN_lg_performance_2026-11-08.md Part 2 step 3 — her words 11/8: the LG StanbyME "gets
// slow every week").
//   · Loaded ONCE, as a classic <script> by haLazyLoad("env") in index.html — always BEFORE classes.js (the class platform calls
//     into it and its top-level lines read ENVCS_FIELDS), so every door that loads classes.js loads this file first: the
//     Envirothon cards (envLoad), the class link (HA_FAMILY.envirothon — haLazyBoot preloads it and then runs the mirror's boot
//     catch-up), and the Envirothon site / demo (haLazyBoot, before boot()). Howe, DeWalt and Burris never need it at boot.
//   · What stays in index.html: the unit record and the cards' loader (ENVUNIT), the station check-ins (ENVTEST), read-aloud
//     (ENVREADALOUD), ID Flash (ENVIDFLASH) and drill-first (ENVDRILLFIRST) — Lincoln's own study and drills use them in Howe.
//   · EDIT THE CODE HERE. Each block's place in index.html is its marker line `// ⇢ env.js: NAME`; test_src.js puts the blocks
//     back at their markers so the tests read one source.
// ENVMIRROR_START — 🌿 ENVIROTHON MIRROR, step 5 of PLAN_envirothon_2026-10-27.md (design DESIGN_envirothon_console_2026-10-27.md
// ✅ DECISIONS + §1.2 + §3 + §4; her decision 2026-10-27: "ONE Envirothon site, ONE Firebase project … ENVMIRROR copies Lincoln's
// summary from the Howe project into this one, and he never needs a login here"; her 8.9: streak / accuracy = study sittings only).
//   · Config: window.HA_FAMILY.envirothon = { firebase:{…the Envirothon project's web config…}, familyId?, kids?, classId? }.
//     ABSENT → every function here returns at once: no named app, no listener, no Settings card, nothing on boot — every
//     other family's boot is byte-identical. PRESENT → a NAMED app, firebase.initializeApp(cfg.firebase,"envirothon"), with
//     its own auth and database. It is opened only from the boot hook (the first `mastery` arrival, after initFb has made the
//     default app and `db`), so the default-app guard `if(!(firebase.apps&&firebase.apps.length))` is never fooled. Nothing
//     here ever touches `db` except the release read-back's one targeted removal.
//   · Sign-in: a Mom-only card in Settings ("🌿 Envirothon"). Email + password go straight to the named app's auth and are
//     never stored; the auth SDK keeps the session on the device (localStorage, like the family login). Kids' devices never
//     see a password prompt — Mom signs each of his study devices in once.
//   · envSummary(kid, ctx) is PURE — from masteryData (the kid's items, _settings.cat_hold, _custom_items, studyLog, history,
//     _tests) and the unit record (hydrated cards), restricted to the Envirothon unit's decks (the record's deck keys, never a
//     list here). The §1.2 record: byDeck {total,new,waiting,learning,active,mastered,held,correct,miss,acc,c14,m14,acc14,last},
//     byConcept (the same counters, keyed <station>|<Key Concept>), streak {days,last}, weak (≤10 fronts per deck: {n,m,d,t}),
//     days (the last 30 study days {n,c,m,secs}), plus unitVer, at, and tests (pre/post/graduated per station, read
//     defensively from mastery/<kid>_tests). Accuracy, streak and days count STUDY SITTINGS only (studyLog); Mom's drills
//     (history) count only toward a card's miss total in the weak list. No card back, no other deck, no roster, no schedule.
//   · Publish = ONE update on the named app at students/<sid> = { summary, meta:{familyId,kid,name,at} }, sid = <familyId>_<kid>,
//     the kid's display name from the roster (cap). Debounced: at most once per 60 s; a hash of the summary sits in HA_LS so an
//     unchanged summary is never re-sent and boot sends only what changed since the last publish. Only when signed in, never in
//     dry run, never while the season is locked.
//   · Release read-back (§4): one listener each on release/<classId>/all and release/<classId>/students/<sid>. A key there is a
//     deck key or a station id; each matching deck whose hold is still set gets ONE targeted removal of
//     mastery/<kid>_settings/cat_hold/<deck> in the family database (db && !_dryRun()). Never sets a hold; idempotent; a notice
//     "🌿 <deck> released by your teacher" (toast + the card). classId = cfg.classId, else students/<sid>/class read once.
//   · release/locked = true on the Envirothon project: publishing stops (summaries stay), the card says "season closed".
//     Nothing in Howe is ever locked by it.
const ENVM_APP="envirothon", ENVM_MIN_MS=60000, ENVM_DAYS=30, ENVM_WEAK=10, ENVM_RECENT=14, ENVM_BOOT_TRIES=40;
const _envm={app:null,auth:null,edb:null,user:null,locked:false,classOf:{},subs:{},timer:null,lastAt:0,lastPub:0,tries:0,busy:false,err:"",notices:[]};
function envmCfg(){ try{ const c=(typeof window!=="undefined"&&window.HA_FAMILY&&window.HA_FAMILY.envirothon)||null; return (c&&c.firebase&&typeof c.firebase==="object"&&c.firebase.databaseURL)?c:null; }catch(e){ return null; } }
function envmFamilyId(){ const c=envmCfg(); if(c&&c.familyId) return String(c.familyId); try{ return String((window.HA_FAMILY&&window.HA_FAMILY.familyId)||"howe"); }catch(e){ return "howe"; } }
function envmSid(kid){ return envmFamilyId()+"_"+kid; }
// ENVMCK (2026-11-09): byConcept is keyed "<station>|<Key Concept>" and the concept is a NAME from the unit — "Forest Management / Fire" (cei)
// holds a /, which Firebase refuses in a key, so Lincoln's very first publish failed whole ("values argument contains an invalid key"). The key
// goes through haKey (HAKEY: . # $ [ ] / %-coded, every other name byte for byte the same); cpmLearn (the teacher's Key Concept view) builds it the same way.
function envmCk(station,concept){ const k=(station||"")+"|"+(concept||"General"); return (typeof haKey==="function")?haKey(k):k; }
// The Envirothon unit on this family: the starter id first, else any unit whose cards live in code.
function envmUnit(){
  const us=(typeof unitStudies!=="undefined"&&unitStudies)||{};
  if(typeof ENV_UNIT_ID!=="undefined"&&us[ENV_UNIT_ID]) return us[ENV_UNIT_ID];
  for(const k in us){ if(us[k]&&typeof envCardsInCode==="function"&&envCardsInCode(us[k])) return us[k]; }
  return null;
}
// The kids mirrored: the config's list (if given) filtered to the unit's enrolled kids, else every enrolled kid.
function envmKids(){
  if(!envmCfg()) return [];
  const u=envmUnit(), en=(u&&u.enrolled)||{}, c=envmCfg();
  const all=Object.keys(en).filter(k=>en[k]);
  return (Array.isArray(c.kids)&&c.kids.length)?c.kids.filter(k=>en[k]):all;
}
function envmDayKey(ms){ return new Date(ms).toISOString().slice(0,10).replace(/-/g,""); }   // the studyLog's key format (mstTodayKey)
function envmKeyMs(k){ k=String(k||""); return Date.UTC(+k.slice(0,4),+k.slice(4,6)-1,+k.slice(6,8)); }
function envmDaysBetween(a,b){ return Math.round((envmKeyMs(b)-envmKeyMs(a))/86400000); }
function envmShift(k,n){ return envmDayKey(envmKeyMs(k)+n*86400000); }
function envmMastered(it){
  const mTier=(typeof MAST_MASTERY_TIER_DEFAULT!=="undefined")?MAST_MASTERY_TIER_DEFAULT:"monthly";
  if(typeof mastTierAtLeast==="function") return mastTierAtLeast(it.tier,mTier);
  const o=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"]; return o.indexOf(it.tier||"daily")>=o.indexOf(mTier);
}
function envmTierIx(t){ const o=(typeof MAST_TIER_ORDER!=="undefined"&&MAST_TIER_ORDER)||["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"]; const i=o.indexOf(t||"daily"); return i<0?0:i; }
function envmCtr(){ return {total:0,new:0,waiting:0,learning:0,active:0,mastered:0,held:false,correct:0,miss:0,acc:null,c14:0,m14:0,acc14:null,last:null}; }
function envmBucket(c,it){ if(it.status==="parked") c.waiting++; else if(it.status==="introduction") c.learning++; else if(envmMastered(it)) c.mastered++; else c.active++; }
function envmAcc(c){ c.acc=(c.correct+c.miss)?Math.round(c.correct/(c.correct+c.miss)*100):null; c.acc14=(c.c14+c.m14)?Math.round(c.c14/(c.c14+c.m14)*100):null; }
// PURE. ctx = {M: masteryData, u: the unit record, now: ms} — every input is passed or read from memory; nothing is fetched.
function envSummary(kid,ctx){
  ctx=ctx||{};
  const M=ctx.M||((typeof masteryData!=="undefined"&&masteryData)||{});
  const u=ctx.u||envmUnit();
  const now=(ctx.now!=null)?ctx.now:Date.now(), today=envmDayKey(now);
  const decks=((u&&u.decks)||[]).filter(d=>d&&d.key);
  const isDeck={}; decks.forEach(d=>{ isDeck[d.key]=true; });
  let items=M[kid]; if(!Array.isArray(items)) items=Object.values(items||{});
  items=items.filter(i=>i&&isDeck[i.subject]);
  const st=M[kid+"_settings"]||{}, hold=st.cat_hold||{};
  let bank=M[kid+"_custom_items"]; if(!Array.isArray(bank)) bank=Object.values(bank||{});
  const bankN={}; bank.forEach(b=>{ if(b&&b.cat&&isDeck[b.cat]) bankN[b.cat]=(bankN[b.cat]||0)+1; });
  const byDeck={}, byConcept={}, conceptOf={}, byId={};
  items.forEach(i=>{ if(i.id) byId[i.id]=i; });
  decks.forEach(d=>{
    const c=byDeck[d.key]=envmCtr(); c.held=!!hold[d.key];
    const its=items.filter(i=>i.subject===d.key), byName={}; its.forEach(i=>{ byName[i.prompt]=i; });
    const cards=Array.isArray(d.cards)?d.cards.filter(Boolean):null;
    c.total=cards?cards.length:Math.max(d.n||0,bankN[d.key]||0,its.length);
    its.forEach(i=>envmBucket(c,i));
    c.new=Math.max(0,c.total-its.length);
    if(!cards) return;
    cards.forEach(card=>{
      const ck=envmCk(d.station,card.family||card.group||"General");   // ENVMCK: a Key Concept name may hold / . # (e.g. "Forest Management / Fire") — never a raw key
      conceptOf[d.key+"|"+card.name]=ck;
      const cc=byConcept[ck]||(byConcept[ck]=Object.assign(envmCtr(),{held:true}));
      cc.total++; cc.held=cc.held&&!!hold[d.key];
      const it=byName[card.name]; if(it) envmBucket(cc,it); else cc.new++;
    });
  });
  // Study sittings: accuracy per deck / concept, the study days, the misses per card.
  const sl=(M.studyLog||{})[kid]||{}, dayAgg={}, missBy={};
  Object.keys(sl).forEach(sid=>{ const byDay=sl[sid]||{}; Object.keys(byDay).forEach(dk=>{
    const e=byDay[dk]; if(!e||!/^\d{8}$/.test(dk)) return;
    let its=e.items; if(!Array.isArray(its)) its=its?Object.values(its):[];
    const recent=envmDaysBetween(dk,today)<ENVM_RECENT; let n=0,cc=0,mm=0;
    its.forEach(x=>{
      if(!x||!isDeck[x.deck]) return; n++;
      const tgt=[byDeck[x.deck]]; const ck=conceptOf[x.deck+"|"+x.name]; if(ck&&byConcept[ck]) tgt.push(byConcept[ck]);
      tgt.forEach(c=>{ if(x.result==="c"){ c.correct++; if(recent) c.c14++; } else if(x.result==="m"){ c.miss++; if(recent) c.m14++; } if(!c.last||dk>c.last) c.last=dk; });
      if(x.result==="c") cc++; else if(x.result==="m"){ mm++; missBy[x.deck+"|"+x.name]=(missBy[x.deck+"|"+x.name]||0)+1; }
    });
    if(!n) return;
    let secs=0; if(Array.isArray(e.sits)) e.sits.forEach(s=>{ secs+=(s&&s.secs)||0; }); else secs=e.secs||0;
    if(its.length&&n<its.length) secs=Math.round(secs*n/its.length);   // a mixed sitting (Daily Study) gives this unit its share
    const da=dayAgg[dk]||(dayAgg[dk]={n:0,c:0,m:0,secs:0}); da.n+=n; da.c+=cc; da.m+=mm; da.secs+=secs;
  }); });
  Object.keys(byDeck).forEach(k=>envmAcc(byDeck[k])); Object.keys(byConcept).forEach(k=>envmAcc(byConcept[k]));
  // Mom's drills: a miss there counts toward the card's miss total (the weak list) — not toward accuracy or the streak (her 8.9).
  const hist=(M.history||{})[kid]||{};
  Object.keys(hist).forEach(dk=>{ const e=hist[dk]; let its=e&&e.items; if(!Array.isArray(its)) its=its?Object.values(its):[];
    its.forEach(x=>{ if(!x||x.result!=="m") return; const it=byId[x.id]; if(!it) return; missBy[it.subject+"|"+it.prompt]=(missBy[it.subject+"|"+it.prompt]||0)+1; }); });
  if(typeof cplntMissBy==="function") cplntMissBy(kid,M,missBy,isDeck);   // 👩‍🏫 CPLINCOLNL3: a ✗ from his teacher's drill counts toward the card's miss total too (his mirror only)
  // Streak: consecutive study days ending today or yesterday.
  const dayKeys=Object.keys(dayAgg).sort();
  const streak={days:0,last:dayKeys.length?dayKeys[dayKeys.length-1]:null};
  if(streak.last&&envmDaysBetween(streak.last,today)<=1){ const set=new Set(dayKeys); let k=streak.last; while(set.has(k)){ streak.days++; k=envmShift(k,-1); } }
  const days={}; dayKeys.slice(-ENVM_DAYS).forEach(k=>{ days[k]=dayAgg[k]; });
  // Weakest cards: m×2 + drop_count, lower tier first; the front only; ≤10 per deck (⚠️ CPMISSED, PR 18: was 5, so the class view has enough to rank); decks with nothing weak are left out.
  const weak={};
  decks.forEach(d=>{
    const rows=items.filter(i=>i.subject===d.key).map(i=>({n:i.prompt,m:missBy[d.key+"|"+i.prompt]||0,d:i.drop_count||0,t:i.tier||"daily"})).filter(r=>r.m+r.d>0);
    rows.sort((a,b)=>(b.m*2+b.d)-(a.m*2+a.d)||envmTierIx(a.t)-envmTierIx(b.t)||String(a.n).localeCompare(String(b.n)));
    if(rows.length) weak[d.key]=rows.slice(0,ENVM_WEAK);
  });
  const out={unitVer:(u&&(u.starterVer||u.ver))||1,at:now,byDeck,byConcept,streak,weak,days};
  // Pre / post tests (ENVTEST writes mastery/<kid>_tests/<station> = {pre:{right,n,date,…}, post:{best:{right,n,date},…}, graduated}) — read defensively.
  const T=M[kid+"_tests"]; if(T&&typeof T==="object"){ const tests={};
    Object.keys(T).forEach(stn=>{ const r=T[stn]; if(!r||typeof r!=="object") return; const o={};
      if(r.pre&&typeof r.pre==="object") o.pre={right:+r.pre.right||0,n:+r.pre.n||0,date:r.pre.date||null};
      const best=r.post&&r.post.best; if(best&&typeof best==="object") o.post={best:{right:+best.right||0,n:+best.n||0,date:best.date||null}};
      if(r.graduated) o.graduated=(typeof r.graduated==="object")?{date:r.graduated.date||null,right:+r.graduated.right||0,n:+r.graduated.n||0}:true;
      if(Object.keys(o).length) tests[stn]=o; });
    if(Object.keys(tests).length) out.tests=tests; }
  if(typeof cprSumAns==="function") cprSumAns(kid,out,M);   // 📊 CPRESULTS: + each check-in's and the newest final's answers by question id (the site's students; Lincoln's Envirothon forms only, through his mirror)
  if(typeof cpAheadSum==="function"){ const ah=cpAheadSum(kid,M,u); if(ah) out.ahead=ah; }   // 🚀 CPAHEAD: summary.ahead, the cards learned beyond the assignment per day (the class site only; null for Howe and Lincoln)
  if(typeof cpPaceSumCore==="function") cpPaceSumCore(kid,out,ctx);   // 📅 CPPACE: the site kid's core cards per section (the site only; Lincoln's mirror in Howe is untouched)
  if(typeof cpSkillSummary==="function"){ const sk=cpSkillSummary(kid,M,now); if(sk) out.skills=sk; }   // 🧩 CPSKILL: summary.skills on the class site only (null for Howe and Lincoln)
  if(typeof cpWatchSum==="function"){ const rv=cpWatchSum(kid,M,now); if(rv) out.review=rv; }   // 🧠 CPWATCH: summary.review, the parent drill watch (the class site only; null for Howe and Lincoln)
  if(typeof cpWeekSum==="function") cpWeekSum(kid,out,M,u);   // 📊 CPWEEK: each day's cards split by section, days.<date>.by.<section> = {n,c,m,secs} (counts only; Lincoln's mirror too, §8.11)
  return out;
}
function envmHash(s){ const o=Object.assign({},s); delete o.at; const str=JSON.stringify(o); let h=5381; for(let i=0;i<str.length;i++) h=((h*33)^str.charCodeAt(i))>>>0; return h.toString(36)+":"+str.length; }
// The named app — only once the default app and `db` exist (initFb), never before (the default-app guard reads firebase.apps.length).
function envmReady(){
  const cfg=envmCfg(); if(!cfg) return false;
  if(typeof haLazyLoad==="function"&&!haLazyReady("classes")) haLazyLoad("classes").catch(()=>{});   // 🪶 LAZYSPLIT: a class link → the class platform (classes.js)
  if(_envm.app) return true;
  if(typeof db==="undefined"||!db||typeof firebase==="undefined"||!firebase.apps||!firebase.apps.length) return false;
  try{
    const have=(firebase.apps||[]).filter(a=>a&&a.name===ENVM_APP)[0];
    _envm.app=have||firebase.initializeApp(cfg.firebase,ENVM_APP);
    _envm.edb=_envm.app.database();
    _envm.auth=(typeof _envm.app.auth==="function")?_envm.app.auth():null;
    if(_envm.auth&&typeof _envm.auth.onAuthStateChanged==="function") _envm.auth.onAuthStateChanged(u=>{ _envm.user=u||null; _envm.busy=false; envmAuthChanged(); });
    return true;
  }catch(e){ _envm.err=String((e&&e.message)||e); _envm.app=null; return false; }
}
// The hook (one guarded line at each site): "study" | "drill" | "enroll" | "boot" (the first mastery arrival = the catch-up:
// whatever changed since the hash in HA_LS goes out). Returns false whenever the block is inert.
function envMirrorOn(why){
  try{
    if(!envmCfg()||!envmReady()) return false;
    envmSchedule(why); return true;
  }catch(e){ _envm.err=String((e&&e.message)||e); return false; }
}
// Not publishable yet: the units listener has not delivered, or the Envirothon unit's cards are still loading (envirothon.js).
function envmWaiting(){
  if(typeof _haUnitsReady!=="undefined"&&!_haUnitsReady) return true;
  if(typeof haLazyReady==="function"&&!haLazyReady("classes")) return true;   // 🪶 LAZYSPLIT: classes.js still loading — its parts of the summary (envSummary) must ride the first publish
  const u=envmUnit(); if(!u) return false;
  return !!(typeof envCardsInCode==="function"&&envCardsInCode(u))&&!(u.decks||[]).every(d=>!d||Array.isArray(d.cards));
}
// Anything to send? The summary's hash against the one HA_LS remembers for each mirrored kid (a sitting in another deck changes nothing).
function envmDirty(){
  let d=false;
  envmKids().forEach(kid=>{ if(d) return; try{ const prev=JSON.parse((typeof HA_LS!=="undefined"?HA_LS.getItem("ha_envm_"+envmSid(kid)):null)||"null"); if(!prev||prev.h!==envmHash(envSummary(kid))) d=true; }catch(e){ d=true; } });
  return d;
}
// Debounce: a change publishes now if the last publish is 60 s old, else once when the 60 s are up (one timer, however many saves).
function envmSchedule(why){
  _envm.why=why;
  if(_envm.timer||!envmDirty()) return;
  const wait=Math.max(0,_envm.lastAt+ENVM_MIN_MS-Date.now());
  if(!wait){ envmPublishAll(); return; }
  _envm.timer=setTimeout(()=>{ _envm.timer=null; try{ envmPublishAll(); }catch(e){} },wait);
}
// ONE update per kid whose summary changed; the hash in HA_LS says what was last sent from any device this browser is.
function envmPublishAll(){
  if(!envmReady()||!_envm.user||_envm.locked) return 0;
  if(typeof _dryRun==="function"&&_dryRun()) return 0;
  if(envmWaiting()){ if(!_envm.timer&&(++_envm.tries)<=ENVM_BOOT_TRIES) _envm.timer=setTimeout(()=>{ _envm.timer=null; try{ envmPublishAll(); }catch(e){} },3000); return 0; }   // boot: the units / cards are still coming — look again in 3 s
  _envm.tries=0;
  let n=0; envmKids().forEach(kid=>{ try{ if(envmPublishKid(kid)) n++; }catch(e){ _envm.err=String((e&&e.message)||e); } });
  if(n){ _envm.lastAt=Date.now(); _envm.lastPub=_envm.lastAt; }
  envmCardRefresh();
  return n;
}
function envmPublishKid(kid,force){
  const s=envSummary(kid), h=envmHash(s), sid=envmSid(kid), key="ha_envm_"+sid;
  let prev=null; try{ prev=JSON.parse((typeof HA_LS!=="undefined"?HA_LS.getItem(key):null)||"null"); }catch(e){}
  if(!force&&prev&&prev.h===h) return false;
  const meta={familyId:envmFamilyId(),kid:kid,name:(typeof cap==="function")?cap(kid):String(kid),at:s.at};
  const p=_envm.edb.ref("students/"+sid).update({summary:s,meta:meta});
  if(typeof cpWeekPub==="function") cpWeekPub(kid,sid,_envm.edb);   // 📊 CPWEEK: the last finished weeks' snapshots, students/<sid>/weeks/<YYYY-Www> (counts only; sent when they change)
  if(typeof cplntPickPub==="function") cplntPickPub(kid,sid,_envm.edb,s);   // 👩‍🏫 CPLINCOLNL3: his drillPick (up to 5 fronts due today) for the teacher's 🧠 Drill, sent when it changed
  try{ if(typeof HA_LS!=="undefined") HA_LS.setItem(key,JSON.stringify({h:h,at:s.at})); }catch(e){}
  if(p&&typeof p.catch==="function") p.catch(err=>{ _envm.err=String((err&&err.message)||err); try{ if(typeof HA_LS!=="undefined") HA_LS.removeItem(key); }catch(e){} envmCardRefresh(); });   // refused / offline: forget the hash so the next save resends
  return true;
}
// Signed in → the lock listener, the class id, the release listeners, then a publish. Signed out → listeners off.
function envmAuthChanged(){
  if(!_envm.edb) return;
  if(!_envm.user){ envmDetach(); envmCardRefresh(); return; }
  if(!_envm.subs.locked){ const r=_envm.edb.ref("release/locked"); const fn=s=>{ const v=s&&typeof s.val==="function"?s.val():null; const was=_envm.locked; _envm.locked=(v===true)||!!(v&&typeof v==="object"&&v.locked===true); if(was&&!_envm.locked) envmSchedule("unlock"); envmCardRefresh(); }; r.on("value",fn); _envm.subs.locked={r,fn}; }
  envmKids().forEach(kid=>{
    const cfg=envmCfg(); if(cfg.classId) _envm.classOf[kid]=String(cfg.classId);
    if(_envm.classOf[kid]) envmRelAttach(kid);
    else _envm.edb.ref("students/"+envmSid(kid)+"/class").once("value",s=>{ const v=s&&typeof s.val==="function"?s.val():null; if(v){ _envm.classOf[kid]=String(v); envmRelAttach(kid); } envmCardRefresh(); });
  });
  envmSchedule("signin"); envmCardRefresh();
}
function envmDetach(){ Object.keys(_envm.subs).forEach(k=>{ const s=_envm.subs[k]; try{ s.r.off("value",s.fn); }catch(e){} }); _envm.subs={}; if(_envm.timer){ try{ clearTimeout(_envm.timer); }catch(e){} _envm.timer=null; } }
function envmRelAttach(kid,_lz){
  if(!_lz&&typeof haLazyReady==="function"&&!haLazyReady("classes")){ const go=()=>envmRelAttach(kid,1); haLazyLoad("classes").then(go,go); return; }   // 🪶 LAZYSPLIT: the class parts below need classes.js; offline without it, the release listeners still attach
  const cid=_envm.classOf[kid]; if(!cid||!_envm.edb) return;
  [["all","release/"+cid+"/all"],["me","release/"+cid+"/students/"+envmSid(kid)]].forEach(pr=>{
    const sk=kid+"|"+pr[0]; if(_envm.subs[sk]) return;
    const r=_envm.edb.ref(pr[1]), fn=s=>{ try{ envmRelease(kid,s&&typeof s.val==="function"?s.val():null); }catch(e){ _envm.err=String((e&&e.message)||e); } };
    r.on("value",fn); _envm.subs[sk]={r,fn};
  });
  if(typeof envtFinalAttach==="function") envtFinalAttach(kid,cid,_envm.edb,_envm.subs,envmSid(kid));   // 📝 ENVTEST: the teacher's "Open the final" (release/<cid>/final/…)
  if(typeof cpsdAttach==="function") cpsdAttach(kid,cid,_envm.edb,_envm.subs,envmSid(kid));   // 📤 CPSEND: the scheduled send-outs (release/<cid>/scheduled), the class site only
  if(typeof cplnLoad==="function") cplnLoad(kid,cid,_envm.edb,envmSid(kid));   // 🌿 CPLINCOLN: his class settings, plan and override, read once (memory only)
  if(typeof cplntAttach==="function") cplntAttach(kid,cid,_envm.edb,_envm.subs,envmSid(kid));   // 👩‍🏫 CPLINCOLNL3: the teacher's drills for him (drills/<cid>/<sid>), graded into Howe once each
  if(typeof cplnpLoad==="function") cplnpLoad(kid,cid,_envm.edb,envmSid(kid));   // 🌿 CPLINCOLNPARITY: his class's card, trim and test layers, read once (memory only)
}
// A release record {<deckKey>|<station>: truthy}: clear each matching deck's hold once — the family database's one targeted removal.
function envmRelease(kid,rel){
  if(!envmCfg()||!rel||typeof rel!=="object") return 0;
  const u=envmUnit(); if(!u) return 0;
  if(typeof cpsdRelease==="function"){ const _n=cpsdRelease(kid,rel,u); if(_n!=null){ if(_n&&typeof renderAllSoon==="function") renderAllSoon(); return _n; } }   // 📤 CPSEND: the class site's apply (Key Concepts, cat_open); null off the site
  const M=(typeof masteryData!=="undefined"&&masteryData)||{}, st=M[kid+"_settings"], hold=(st&&st.cat_hold)||null; if(!hold) return 0;
  const open=[];
  Object.keys(rel).forEach(k=>{ if(!rel[k]) return; (u.decks||[]).forEach(d=>{ if(d&&d.key&&(d.key===k||d.station===k)&&hold[d.key]&&open.indexOf(d.key)<0) open.push(d.key); }); });
  open.forEach(dk=>{
    delete hold[dk];
    if(typeof db!=="undefined"&&db&&!(typeof _dryRun==="function"&&_dryRun())) db.ref("mastery/"+kid+"_settings/cat_hold/"+(typeof haKey==="function"?haKey(dk):dk)).remove();
    envmNotice("\u{1F33F} "+dk+" released by your teacher");
  });
  if(open.length){ envmSchedule("release"); if(typeof renderAllSoon==="function") renderAllSoon(); }
  return open.length;
}
function envmNotice(msg){ _envm.notices.unshift({at:Date.now(),msg:msg}); if(_envm.notices.length>10) _envm.notices.length=10; try{ console.log("[HA] ENVMIRROR",msg); }catch(e){} try{ if(typeof gwShowToast==="function") gwShowToast(msg); }catch(e){} }
// ── Settings ▸ 🌿 Envirothon (Mom only) ──
function envmEsc(v){ return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"); }
function envmWhen(ms){ try{ return new Date(ms).toLocaleString([],{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}); }catch(e){ return String(ms); } }
function envmStateLine(){
  if(!envmCfg()) return "not set up";
  if(_envm.locked) return "season closed — the teacher's project is locked; nothing is sent until it reopens";
  if(_envm.busy) return "signing in…";
  if(!_envm.user) return "not signed in on this device";
  return "signed in as "+String(_envm.user.email||_envm.user.uid||"")+(_envm.lastPub?" · last mirrored "+envmWhen(_envm.lastPub):" · nothing mirrored yet");
}
function envMirrorCardHtml(){
  if(!envmCfg()||typeof momHere!=="function"||!momHere()) return "";
  return '<div class="rules-wrap"><div class="rules-hdr">\u{1F33F} Envirothon</div>'+
    '<div class="rules-sub">Sends a summary of the Envirothon study (counts, accuracy, streak, weakest terms — never the cards) to the teacher\'s Envirothon project, and opens a station here when she sends it out. Sign in once on each device the study happens on.</div>'+
    '<div class="rules-card open"><div class="rules-card-body" id="envm-body">'+envmBodyHtml()+'</div></div></div>';
}
function envmBodyHtml(){
  const kids=envmKids();
  let h='<div class="rules-row"><div class="rules-label">Status</div><div style="font-size:12.5px;font-weight:700;color:'+(_envm.locked?'#b45309':(_envm.user?'#15803d':'#6b7280'))+'">'+envmEsc(envmStateLine())+'</div></div>';
  h+='<div class="rules-row"><div class="rules-label">Mirrored</div><div style="font-size:12px">'+(kids.length?kids.map(k=>envmEsc((typeof cap==="function")?cap(k):k)+' <span style="color:var(--muted)">('+envmEsc(envmSid(k))+')</span>').join(", "):'<span style="color:var(--muted)">nobody enrolled in the Envirothon unit yet</span>')+'</div></div>';
  if(!_envm.user){
    h+='<form onsubmit="envmSignIn(event)" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 0">'+
      '<input id="envm-e" type="email" autocomplete="username" placeholder="email" required style="flex:1;min-width:140px;padding:7px 9px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:\'DM Sans\',sans-serif">'+
      '<input id="envm-p" type="password" autocomplete="current-password" placeholder="password" required style="flex:1;min-width:120px;padding:7px 9px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:\'DM Sans\',sans-serif">'+
      '<button type="submit" style="padding:7px 14px;border-radius:9px;border:none;background:#15803d;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">\u{1F33F} Envirothon: sign in</button></form>';
  } else {
    h+='<div style="display:flex;gap:8px;padding:6px 0"><button onclick="envmSendNow()" style="padding:6px 12px;border-radius:9px;border:1.5px solid var(--border);background:#fff;color:#1f2937;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">Send now</button>'+
      '<button onclick="envmSignOut()" style="padding:6px 12px;border-radius:9px;border:1.5px solid #fecaca;background:#fff;color:#b91c1c;font-size:12px;font-weight:700;cursor:pointer;font-family:\'DM Sans\',sans-serif">Sign out</button></div>';
  }
  if(_envm.err) h+='<div style="font-size:11px;color:#b5394a;padding:2px 0">'+envmEsc(_envm.err)+'</div>';
  if(_envm.notices.length) h+='<div style="font-size:11px;color:var(--muted);padding:4px 0 0;line-height:1.5">'+_envm.notices.slice(0,3).map(n=>envmEsc(n.msg)+' <span style="opacity:.7">'+envmEsc(envmWhen(n.at))+'</span>').join("<br>")+'</div>';
  h+='<div style="font-size:11px;color:var(--muted);padding:6px 0 0;line-height:1.45">\u{1F512} The password goes to the Envirothon project only and is not kept anywhere in this app.</div>';
  return h;
}
function envmCardRefresh(){ try{ if(typeof document==="undefined") return; const el=document.getElementById("envm-body"); if(el) el.innerHTML=envmBodyHtml(); }catch(e){} }
function envmSignIn(ev){
  if(ev&&ev.preventDefault) ev.preventDefault();
  if(typeof momHere!=="function"||!momHere()||!envmReady()||!_envm.auth) return false;
  const e=((document.getElementById("envm-e")||{}).value||"").trim(), p=(document.getElementById("envm-p")||{}).value||"";
  if(!e||!p) return false;
  _envm.busy=true; _envm.err=""; envmCardRefresh();
  try{ _envm.auth.signInWithEmailAndPassword(e,p).then(()=>{ _envm.busy=false; envmCardRefresh(); }).catch(err=>{ _envm.busy=false; _envm.err=String((err&&err.message)||err); envmCardRefresh(); }); }
  catch(err){ _envm.busy=false; _envm.err=String((err&&err.message)||err); envmCardRefresh(); }
  return true;
}
function envmSignOut(){ if(typeof momHere!=="function"||!momHere()||!_envm.auth) return; try{ _envm.auth.signOut(); }catch(e){} }
function envmSendNow(){ if(typeof momHere!=="function"||!momHere()||!envmReady()||!_envm.user||_envm.locked) return 0; if(typeof _dryRun==="function"&&_dryRun()) return 0; let n=0; envmKids().forEach(kid=>{ try{ if(envmPublishKid(kid,true)) n++; }catch(e){ _envm.err=String((e&&e.message)||e); } }); if(n){ _envm.lastAt=Date.now(); _envm.lastPub=_envm.lastAt; } envmCardRefresh(); return n; }
// ENVMIRROR_END
// ENVSITE_START — 🌿 THE ENVIROTHON SITE: one page, one Firebase project, routed by login role (step 4 of PLAN_envirothon_2026-10-27.md;
// DESIGN_envirothon_console_2026-10-27.md ✅ DECISIONS, DESIGN_envirothon_micro_academy_2026-10-27.md ✅ DECISIONS + §2–§4,
// DESIGN_envirothon_code_protection_2026-10-27.md §3). Her words 2026-10-27/28: "I'm good with it all being on one page as long as
// I can somehow protect my product" · "can i see the page before i set up the blaze".
//   · THE ONE SWITCH — envEdition(): "envirothon" when the host's family-config.js says `edition:"envirothon"` (the Envirothon site's
//     own config; known before the first paint), or when the page runs as a DEMO (`?demo=1`, or `demo:true` in that config — no Firebase
//     at all), else "". The family instance's `settings/edition:"envirothon"` (the seed) is read once after connect and can only ADD the
//     lock (never remove it). Howe, DeWalt and Burris have neither, so every function in this block and in ENVCONSOLE returns at once:
//     no listener, no write, no element, no CSS — their boot is byte-identical (test_env_site.js).
//   · THE ROUTER — after the family sign-in, logins/<uid> = {role: kid|parent|teacher|admin, familyId, kid, cid} decides which part of
//     the page opens (admins/<uid>:true also counts as admin). kid → the study screen (the 🌿 session, check-ins, ID Flash, 🏋️ games,
//     Scores, the Star Store closed with its one line, ⭐ stars per finished sitting, the tips card); parent → read-only "How <kid> is
//     doing" (the SAME numbers the console shows — envSummary, the mirror's own function), the team board and the effort board as the kid
//     sees them, the who-drills note, the tips card; teacher / admin → the console (ENVCONSOLE). A kid or parent studies in the
//     FAMILY's own database instance (https://<projectId>-<familyId>.firebaseio.com, envsFamilyDbUrl): the one guarded line in initFb
//     points `db` there, so every one of the app's db.ref calls lands in that family's instance exactly as in Howe. The shared default
//     instance holds only the roster, logins, releases, scores, teacher cards and boards (envirothon/SITE_RULES.json).
//   · SIGN-IN CARD (every login): email + password (the app's own form), "Student code from your card" (the kid's short code →
//     a synthetic login k-<code>@<projectId>.kid with a password DERIVED from the code, envsKidPw; the code is never stored anywhere;
//     the password lives only in Auth), and the © + license line. LOCKED SEASON (release/locked, Adrienne only; AUTO after 2027-04-24 —
//     envsLockState) → the "season closed" card and nothing else loads; data is kept; an admin's {locked:false, at:<after that date>}
//     reopens it for the next season.
//   · WRITES from this block (live, never in demo or dry run): bank/<kid>/adjustments (ENVS_STARS stars per finished sitting, bankDirect);
//     the first signed-in boot's auto-enroll of the family's kid into the unit, every deck held (her 8.4: "a kid can start at school before
//     the parent ever opens the app"), through the app's own _ustApply/_ustWrite; settings/pin from the parent's ⚙️
//     panel (the app's own path; the 🎨 Color card went with CPGEAR 2026-10-28). Everything else here is a read or a screen.
//   · DEMO (`?demo=1`, `&role=kid|parent|teacher|admin`): a sample class in this block (invented names, no real student), a role switch
//     pinned at the top, every screen clickable, every write a no-op that shows "demo: would write <path>". Works from a double-clicked file.
const ENVS_TAB="envsite", ENVS_STARS=3, ENVS_AUTOLOCK="20270424", ENVS_SEASON="2026-27", ENVS_ROLES=["kid","parent","teacher","admin"];
const ENVS_OFF_TABS=["schedule","notebook","play","moms-plan","babysitter","supplies","history","pace","activities","grid","generate","chorePlan","kitchen","workbooks","eic","purchases","helpers","mastery","units","kids"];   // every door the micro doc lists as off, plus the app's own tabs: the site has ONE page
const ENVS_FULL_APP=["🗓 A daily schedule laid out for each kid, re-laid from now when the day slips","📓 Weekly notebooks and workbooks generated for each kid","🧹 Chores, laundry and routines with stars that buy things Mom sets up","🍽 Meals, the shopping list and the kitchen","👩 Mom's Day and Dad's Day","📚 Every unit you add, your own cards, Problem words, the Curriculum Builder"];
const ENVS_TIPS=[  // PLACEHOLDER — Adrienne's six lines + contact line (her 8.7: the card ships with placeholders until she writes them)
  "PLACEHOLDER tip 1 — two views: the student's screen is his; a parent's login sees how he is doing.",
  "PLACEHOLDER tip 2 — the kid's code card works on a school device or a phone; add the page to the home screen.",
  "PLACEHOLDER tip 3 — a little most days beats a lot once: the cards come back on their own schedule.",
  "PLACEHOLDER tip 4 — the teacher sends out each station as the class reaches it; a station starts with a short check-in.",
  "PLACEHOLDER tip 5 — ⭐ stars arrive after each finished sitting; what they are for is coming.",
  "PLACEHOLDER tip 6 — questions about the app go to the line below, questions about the class go to the teacher."];
const ENVS_CONTACT="PLACEHOLDER contact line — e.g. Adrienne · adrienne@example.com";
const _envs={demo:null,demoRole:"",role:"",uid:"",email:"",familyId:"",kid:"",sid:"",kids:[],kidNames:{},kidMode:"",kidSwap:true,newCard:null,cid:"",dbUrl:"",lockRaw:undefined,lock:null,view:"study",sub:{},dbEdition:"",writes:[],toastT:null,css:false,mirrorArmed:false,autoEnroll:"",err:"",boards:null,who:"",cls:null,gateDone:false,stars:0,bankDemo:0};
function envsQuery(){ try{ return (typeof location!=="undefined"&&location.search)||""; }catch(e){ return ""; } }
function envsFam(){ try{ return (typeof window!=="undefined"&&window.HA_FAMILY)||null; }catch(e){ return null; } }
function envsDemo(){
  if(_envs.demo===null){ const f=envsFam(); _envs.demo=/[?&]demo=1/.test(envsQuery())||!!(f&&f.demo===true);
    if(_envs.demo){ const m=/[?&]role=(kid|parent|teacher|admin|signin)/.exec(envsQuery()); _envs.demoRole=m?m[1]:"signin"; } }
  return _envs.demo;
}
// THE switch. "" for every family that is not the Envirothon site.
function envEdition(){ try{ if(envsDemo()) return "envirothon"; const f=envsFam(); if(f&&f.edition==="envirothon") return "envirothon"; if(_envs.dbEdition==="envirothon") return "envirothon"; }catch(e){} return ""; }
function envSiteOn(){ return envEdition()==="envirothon"; }
function envsEsc(v){ return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function envsJ(s){ return String(s==null?"":s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;"); }
function envsDayKey(ms){ return new Date(ms).toISOString().slice(0,10).replace(/-/g,""); }
function envsTodayKey(now){ return envsDayKey(now!=null?now:Date.now()); }
function envsKeyMs(k){ k=String(k||""); return Date.UTC(+k.slice(0,4),+k.slice(4,6)-1,+k.slice(6,8)); }
function envsDaysAgo(k,now){ if(!k) return null; return Math.round((envsKeyMs(envsTodayKey(now))-envsKeyMs(k))/86400000); }
function envsCfg(){ const f=envsFam(); return (f&&f.envirothon&&typeof f.envirothon==="object")?f.envirothon:{}; }
function envsProjectId(){ try{ return String((typeof FB_CFG!=="undefined"&&FB_CFG&&FB_CFG.projectId)||envsCfg().projectId||"envirothon"); }catch(e){ return "envirothon"; } }
function envsClassName(){ if(_envs.cls&&_envs.cls.name) return _envs.cls.name; const f=envsFam(); return (f&&(f.licensee||f.className))||envsCfg().className||"the Envirothon class"; }
function envsLicenseLine(){ return "\u00A9 2026 Howe Academy \u00B7 licensed to "+envsClassName()+" for the "+((typeof cpSeason==="function"&&cpSeason())||ENVS_SEASON)+" season \u00B7 not for redistribution"; }   // 🏫 CPCLASS: the class's season
// ── the master lock (release/locked on the shared instance). true | {locked, at, by} | nothing. Auto after 2027-04-24 (State) unless an
//    admin reopened it AFTER that date; her early lock is `locked:true` any day. Pure: (raw, todayKey) → {locked, why}.
function envsLockState(raw,todayKey,lockAt){
  todayKey=todayKey||envsTodayKey(); const AUTO=(typeof cpLockKey==="function"&&cpLockKey(lockAt))||ENVS_AUTOLOCK;   // 🏫 CPCLASS: the class's own lockAt, else the site's date
  if(raw===true) return {locked:true,why:"switch"};
  if(raw&&typeof raw==="object"){
    if(raw.locked===true) return {locked:true,why:"switch"};
    if(raw.locked===false&&raw.at&&envsDayKey(+raw.at)>AUTO) return {locked:false,why:"reopened"};
  }
  if(todayKey>AUTO) return {locked:true,why:"auto"};
  return {locked:false,why:""};
}
function envsAutoLockLabel(){ return (typeof cpLockLabel==="function"&&cpLockLabel())||"Apr 24, 2027"; }   // 🏫 CPCLASS: the class's lockAt
// ── stations and decks (ENV_DECKS / ENV_STAGES from ENVUNIT; kept in every build)
const ENVS_SHORT={general:"General",forestry:"Forestry",soils:"Soils",aquatics:"Aquatics",wildlife:"Wildlife",cei:"CEI"};
function envsStations(){
  if(typeof cpuStations==="function"){ const s=cpuStations(); if(s) return s; }   // 📦 CPUNIT: the class's sections, drawn from its units
  const D=(typeof ENV_DECKS!=="undefined"&&ENV_DECKS)||[], S=(typeof ENV_STAGES!=="undefined"&&ENV_STAGES)||[]; const out=[], seen={};
  D.forEach(d=>{ const id=d[3]; if(seen[id]) return; seen[id]=1; const st=S.find(x=>x[0]===d[2]);
    out.push({id,label:(st&&st[1])||id,short:ENVS_SHORT[id]||id,decks:D.filter(x=>x[3]===id).map(x=>({key:x[0],kind:x[4],n:x[5],mode:x[1]}))}); });
  return out;
}
function envsStation(id){ return envsStations().find(s=>s.id===id)||null; }
function envsStationOfDeck(key){ const s=envsStations().find(x=>x.decks.some(d=>d.key===key)); return s?s.id:null; }
function envsDeckShort(key){ const m=/\u00b7 (.+)$/.exec(String(key||"")); return m?m[1]:String(key||""); }
// ── one station's numbers from a summary (the mirror's envSummary record): the SAME function feeds the console grid, the student page and
//    the parent's page, so every screen agrees. pct = mastered / total over RELEASED decks (a held deck is not counted); null = not sent out.
function envsStationStat(summary,st){
  const out={id:st.id,total:0,mastered:0,learning:0,new:0,released:0,decks:st.decks.length,c14:0,m14:0,acc14:null,last:null,pre:null,post:null,grad:null,pct:null};
  const bd=(summary&&summary.byDeck)||{};
  st.decks.forEach(d=>{ const c=bd[d.key]; if(!c||c.held) return; out.released++; out.total+=c.total||0; out.mastered+=c.mastered||0; out.learning+=(c.learning||0)+(c.active||0); out.new+=(c.new||0)+(c.waiting||0);
    out.c14+=c.c14||0; out.m14+=c.m14||0; if(c.last&&(!out.last||c.last>out.last)) out.last=c.last; });
  if(out.released&&out.total) out.pct=Math.round(out.mastered/out.total*100); else if(out.released) out.pct=0;
  out.acc14=(out.c14+out.m14)?Math.round(out.c14/(out.c14+out.m14)*100):null;
  const t=(summary&&summary.tests&&summary.tests[st.id])||null;
  if(t){ out.pre=t.pre||null; out.post=(t.post&&t.post.best)||null; out.grad=t.graduated||null; }
  return out;
}
function envsPct(t){ return (t&&t.n)?Math.round((t.right||0)/t.n*100):null; }
// gain over the own pre-test, STAD-style improvement points: Σ stations max(0, post% − pre%); a station with no post yet gives 0.
function envsGain(summary){ let g=0; const T=(summary&&summary.tests)||{}; Object.keys(T).forEach(s=>{ const t=T[s]; const a=envsPct(t&&t.pre), b=envsPct(t&&t.post&&t.post.best); if(a!=null&&b!=null) g+=Math.max(0,b-a); }); return g; }
// effort = cards reviewed in the last 7 days + 3 × the study streak (study sittings only, her 8.9) — never accuracy, never a score
function envsEffort(summary,now){ const d=(summary&&summary.days)||{}; let r=0; Object.keys(d).forEach(k=>{ const ago=envsDaysAgo(k,now); if(ago!=null&&ago>=0&&ago<7) r+=(d[k]&&d[k].n)||0; }); const st=(summary&&summary.streak&&summary.streak.days)||0; return {reviews:r,streak:st,score:r+3*st}; }
// ── THE BOARDS (pure): students {sid:{meta,summary}} + teams {sid:"Team name"} → the public boards. No individual score anywhere:
//    team board = Σ members' gains; readiness bars per team per station = mean of members' station %; station-expert badge per team =
//    the member highest on that station (> 0); effort board = every student's effort (reviews + streak), ranked.
function envsBoardsCompute(students,teams,now){
  const stns=envsStations(), per={}; teams=teams||{};
  Object.keys(students||{}).forEach(sid=>{ const row=students[sid]||{}, s=row.summary||null; const name=(row.meta&&row.meta.name)||sid;
    const st={}; stns.forEach(x=>{ st[x.id]=envsStationStat(s,x).pct; });
    per[sid]={name,gain:envsGain(s),eff:envsEffort(s,now),st,team:String(teams[sid]||"").trim()}; });
  const T={};
  Object.keys(per).forEach(sid=>{ const t=per[sid].team||"No team yet"; const r=T[t]||(T[t]={name:t,members:[],gain:0,ready:{},badges:{}}); r.members.push(sid); r.gain+=per[sid].gain; });
  Object.keys(T).forEach(t=>{ const r=T[t]; r.members.sort((a,b)=>per[a].name.localeCompare(per[b].name)); r.memberNames=r.members.map(sid=>per[sid].name);
    stns.forEach(x=>{ const vals=r.members.map(sid=>per[sid].st[x.id]).filter(v=>v!=null); r.ready[x.id]=vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):null;
      let best=null; r.members.forEach(sid=>{ const v=per[sid].st[x.id]; if(v!=null&&v>0&&(best===null||v>per[best].st[x.id])) best=sid; });
      if(best) r.badges[x.id]={sid:best,name:per[best].name,pct:per[best].st[x.id]}; }); });
  const teamList=Object.keys(T).map(k=>T[k]).sort((a,b)=>b.gain-a.gain||a.name.localeCompare(b.name));
  const effort=Object.keys(per).map(sid=>({sid,name:per[sid].name,score:per[sid].eff.score,reviews:per[sid].eff.reviews,streak:per[sid].eff.streak})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
  if(typeof cpAheadBoards==="function") cpAheadBoards(students,teamList,effort,now);   // 🚀 CPAHEAD: + 2 effort per card learned ahead this week; each team’s gain stays, a 🚀 bonus is added and the teams rank on both
  return {at:(now!=null?now:Date.now()),teams:teamList,effort,stations:stns.map(s=>({id:s.id,short:s.short}))};
}
// the public boards as HTML; mySid → the effort board shows "you and the two nearest" only (kid / parent); null → the whole list (teacher)
function envsBoardsHtml(B,mySid){
  if(!B||!B.teams) return '<div class="envs-card" style="color:var(--muted)">No boards yet \u2014 the teacher opens Boards once and they appear here.</div>';
  const stns=B.stations||[]; let h='';
  h+='<div class="envs-card"><div class="envs-h2">\u{1F3C6} Team board \u00B7 gains over each member\u2019s own check-in</div>';
  h+='<div style="font-size:11.5px;color:var(--muted);margin-bottom:8px">A team\u2019s points are the sum of how much each member improved from their station check-in to their final \u2014 so every student adds points.'+((typeof cpAheadTeamNote==="function")?cpAheadTeamNote():'')+'</div>';   // 🚀 CPAHEAD: the bonus, in words
  (B.teams||[]).forEach((t,i)=>{ h+='<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid #f1efe9"><div style="font-size:18px;width:26px;text-align:center">'+(i===0?'\u{1F947}':i===1?'\u{1F948}':i===2?'\u{1F949}':'\u00B7')+'</div><div style="flex:1"><div style="font-weight:800">'+envsEsc(t.name)+'</div><div style="font-size:11px;color:var(--muted)">'+envsEsc((t.memberNames||[]).join(" \u00B7 "))+'</div>'+((typeof cpAheadTeamLine==="function")?cpAheadTeamLine(t):'')+'</div><div style="font-size:20px;font-weight:900;color:#14532d">'+((typeof cpAheadTeamPts==="function")?cpAheadTeamPts(t):t.gain)+'<span style="font-size:11px;font-weight:700;color:var(--muted)"> pts</span></div></div>'; });   // 🚀 CPAHEAD: gains + the 🚀 bonus, and the line that splits them
  h+='</div>';
  h+='<div class="envs-card"><div class="envs-h2">\u{1F4CA} Station readiness \u00B7 per team</div>';
  (B.teams||[]).forEach(t=>{ h+='<div style="padding:6px 0;border-top:1px solid #f1efe9"><div style="font-weight:800;font-size:13px;margin-bottom:4px">'+envsEsc(t.name)+'</div>';
    stns.forEach(s=>{ const v=t.ready&&t.ready[s.id]; h+='<div style="display:flex;align-items:center;gap:8px;font-size:11.5px;padding:1px 0"><div style="width:62px;color:var(--muted);font-weight:700">'+envsEsc(s.short)+'</div><div style="flex:1;height:8px;background:#eef2ee;border-radius:4px;overflow:hidden"><div style="width:'+(v==null?0:v)+'%;height:100%;background:'+(v==null?'#eef2ee':v>=80?'#15803d':v>=40?'#65a30d':'#f59e0b')+'"></div></div><div style="width:44px;text-align:right;font-weight:700">'+(v==null?'\u2013':v+'%')+'</div></div>'; });
    h+='</div>'; });
  h+='</div>';
  h+='<div class="envs-card"><div class="envs-h2">\u{1F396} Station experts \u00B7 per team</div>';
  (B.teams||[]).forEach(t=>{ const b=t.badges||{}; const parts=stns.filter(s=>b[s.id]).map(s=>'<span class="envs-chip">'+envsEsc(s.short)+': <b>'+envsEsc(b[s.id].name)+'</b></span>');
    h+='<div style="padding:6px 0;border-top:1px solid #f1efe9"><div style="font-weight:800;font-size:13px">'+envsEsc(t.name)+'</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">'+(parts.length?parts.join(""):'<span style="font-size:11.5px;color:var(--muted)">no station studied yet</span>')+'</div></div>'; });
  h+='</div>';
  let rows=B.effort||[];
  if(mySid){ const i=rows.findIndex(r=>r.sid===mySid); if(i>=0) rows=rows.slice(Math.max(0,i-1),i+2); else rows=[]; }
  h+='<div class="envs-card"><div class="envs-h2">\u{1F4AA} Effort this week'+(mySid?' \u00B7 you and the two nearest':'')+'</div><div style="font-size:11.5px;color:var(--muted);margin-bottom:6px">Cards reviewed in the last 7 days and the study streak \u2014 effort, not scores.'+((typeof cpAheadEffNote==="function")?cpAheadEffNote():'')+'</div>';   // 🚀 CPAHEAD: cards learned ahead count double
  if(!rows.length) h+='<div style="font-size:12px;color:var(--muted)">Nothing to show yet.</div>';
  rows.forEach(r=>{ const me=r.sid===mySid; h+='<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-top:1px solid #f1efe9;'+(me?'background:#f0fdf4;margin:0 -8px;padding-left:8px;padding-right:8px;border-radius:8px':'')+'"><div style="flex:1;font-weight:'+(me?'900':'700')+'">'+envsEsc(me?(r.name+' (you)'):r.name)+((typeof cpAheadBadge==="function")?cpAheadBadge(r):'')+'</div><div style="font-size:11.5px;color:var(--muted)">'+r.reviews+' cards \u00B7 '+r.streak+'-day streak'+((typeof cpAheadEffTxt==="function")?cpAheadEffTxt(r):'')+'</div><div style="font-weight:900;color:#14532d;width:34px;text-align:right">'+r.score+'</div></div>'; });   // 🚀 CPAHEAD: the 🚀 ahead badge and “🚀 N ahead ×2”
  h+='</div>';
  return h;
}
// ── kid codes: a short code on a printable card → a synthetic email + a DERIVED password. Deterministic, never stored (the card is the only copy;
//    the teacher's "New code" makes a new login). Alphabet without 0/O/1/I; 7 chars incl. the dash.
const ENVS_CODE_ALPHA="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function envsMakeCode(rnd){ rnd=rnd||Math.random; let s=""; for(let i=0;i<6;i++){ s+=ENVS_CODE_ALPHA[Math.floor(rnd()*ENVS_CODE_ALPHA.length)%ENVS_CODE_ALPHA.length]; if(i===2) s+="-"; } return s; }
function envsCodeNorm(c){ return String(c||"").toUpperCase().replace(/[^A-Z2-9]/g,"").replace(/^(.{3})(.+)$/,"$1-$2"); }
function envsCodeOk(c){ return /^[A-Z2-9]{3}-[A-Z2-9]{3}$/.test(envsCodeNorm(c)); }
function envsKidEmail(code,projectId){ return "k-"+envsCodeNorm(code).toLowerCase().replace("-","")+"@"+(projectId||envsProjectId())+".kid"; }
function envsKidPw(code,projectId){ return "K"+envsCodeNorm(code)+"#"+(projectId||envsProjectId()); }
// the family's own database instance in the project: <projectId>-<familyId>, or the pattern the host config gives ({fid} is replaced)
function envsFamilyDbUrl(fid){ const p=envsCfg().familyDbPattern; if(p) return String(p).replace("{fid}",fid); return "https://"+envsProjectId()+"-"+fid+".firebaseio.com"; }
// ── the one-line hooks' targets ──
// initFb: `db = envSiteDb() || firebase.database()` — a kid or parent studies in the family instance; everyone else (and every other family) keeps the default.
function envSiteDb(){ if(!envSiteOn()||envsDemo()||!_envs.dbUrl) return null; try{ return firebase.app().database(_envs.dbUrl); }catch(e){ _envs.err=String((e&&e.message)||e); return null; } }
// haAuthGate, first line: the demo never touches Firebase (works from a double-clicked file: no network, no scripts needed).
function envSiteDemoBoot(){
  if(!envSiteOn()||!envsDemo()) return false;
  if(!_envs.gateDone){ _envs.gateDone=true; try{ _haAuthStarted=true; }catch(e){} envsDemoStart(); }
  return true;
}
// haAuthGate's go(u): the signed-in user → logins/<uid> → role → the part. Returns false for every other family (boot continues as before).
function envSiteGate(user,cont){
  if(!envSiteOn()) return false;
  if(envsDemo()){ envSiteDemoBoot(); return true; }
  if(!user) return false;   // not signed in: the gate shows the card (ours, through envSiteAuthShow)
  if(_envs.gateDone) return true; _envs.gateDone=true;
  _envs.uid=user.uid||""; _envs.email=user.email||"";
  let sdb; try{ sdb=firebase.database(); }catch(e){ envsCard("error",{msg:String((e&&e.message)||e)}); return true; }
  const val=s=>(s&&typeof s.val==="function")?s.val():null;
  sdb.ref("release/locked").once("value").then(s=>{ _envs.lockRaw=val(s); return sdb.ref("logins/"+_envs.uid).once("value"); })
    .then(s=>{ const L=val(s); if(L&&L.role) return L; return sdb.ref("admins/"+_envs.uid).once("value").then(a=>val(a)===true?{role:"admin"}:null); })
    // CPTEACHERGATE (2026-11-09): + Teacher writes teachers/<uid> and no logins row (the logins rule wants a family and a kid, which a teacher has not) —
    // so a teacher record alone signs her in, to the first class it lists; her own record is readable under the teachers/$uid rule. Found on Brittany's setup.
    .then(L=>L||sdb.ref("teachers/"+_envs.uid).once("value").then(t=>{ const T=val(t), ks=Object.keys((T&&T.classes)||{}); return ks.length?{role:"teacher",cid:ks[0],name:String(T.name||"")}:null; }))
    .then(L=>{ if(!L){ envsCard("notset"); return; } envsApplyLogin(L); _envs.lock=envsLockState(_envs.lockRaw);
      if(_envs.lock.locked&&_envs.role!=="admin"){ envsCard("closed"); return; } envsEnter(cont); })
    .catch(e=>{ _envs.err=String((e&&e.message)||e); envsCard("error",{msg:_envs.err}); });
  return true;
}
function envsApplyLogin(L){
  L=L||{}; _envs.role=ENVS_ROLES.indexOf(L.role)>=0?L.role:"parent";
  _envs.familyId=String(L.familyId||"").replace(/[^a-z0-9_-]/gi,""); _envs.kid=String(L.kid||"").replace(/[^a-z0-9_-]/gi,""); _envs.cid=String(L.cid||L.classId||"");
  // CPSIBLINGS (2026-11-10): one parent login, several kids — logins/<uid>/kids/<kid>=true lists the others (her ask: "link both of them to the
  // same mom"). The kid she last looked at on this device opens first; the kid role is always its one kid.
  _envs.kids=[_envs.kid].concat(Object.keys((L.kids&&typeof L.kids==="object")?L.kids:{}).filter(k=>L.kids[k]===true)).map(String).filter((k,i,a)=>/^[a-z0-9_-]{1,32}$/.test(k)&&a.indexOf(k)===i);
  if(_envs.role==="parent"&&_envs.kids.length>1){ try{ const pk=(typeof HA_LS!=="undefined")?HA_LS.getItem("envs_kid_pick"):null; if(pk&&_envs.kids.indexOf(pk)>=0) _envs.kid=pk; }catch(e){} } else _envs.kids=_envs.kid?[_envs.kid]:[];
  envsModeApply(L);   // CPKIDMODE: a device left in a kid's view opens in it again (parent logins only)
  _envs.sid=(_envs.familyId&&_envs.kid)?_envs.familyId+"_"+_envs.kid:"";
  _envs.dbUrl=(_envs.role==="kid"||_envs.role==="parent")&&_envs.familyId?(L.dbUrl||envsFamilyDbUrl(_envs.familyId)):"";
}
// CPSIBLINGS: the parent taps another kid → remembered on this device, then a fresh boot (every listener on this page is keyed on the one sid)
function envsPickKid(kid){ if(_envs.role!=="parent"||_envs.kids.indexOf(kid)<0||kid===_envs.kid) return false; try{ if(typeof HA_LS!=="undefined") HA_LS.setItem("envs_kid_pick",kid); }catch(e){} try{ location.reload(); }catch(e){} return true; }
function envsKidTabsHtml(){
  if(_envs.role!=="parent"||_envs.kids.length<2) return "";
  return '<div class="envs-chips envs-kids" style="margin-top:6px">'+_envs.kids.map(k=>'<button class="'+(k===_envs.kid?'on':'')+'" style="border-left:5px solid '+envsEsc(envsKidColor(k))+'" onclick="envsPickKid(\''+envsEsc(k)+'\')">'+envsEsc(envsKidName(k))+'</button>').join("")+'</div>';
}
// CPSIBLINGS: 🎟 the parent makes (or replaces) a kid's code herself — her ask: "can the parent get a mirror link to have each kids code".
// A code is the kid's whole login, so it is still never stored: a new kid user is made, logins/<uidK> + students/<sid>/logins/kid|kidAt point
// at it (the rules let a parent do exactly that for her own kids), and the card shows once — print it or copy it now. An older code stops working.
function envsSecondary(){ const have=(firebase.apps||[]).filter(a=>a&&a.name==="envs-mk")[0]; return have||firebase.initializeApp(FB_CFG,"envs-mk"); }
function envsNewCodePaths(f){ const sid=f.familyId+"_"+f.kid, o={}; o["logins/"+f.uidKid]={role:"kid",familyId:f.familyId,kid:f.kid,cid:f.cid,name:f.name}; o["students/"+sid+"/logins/kid"]=f.uidKid; o["students/"+sid+"/logins/kidAt"]=f.now; return o; }
function envsParentNewCode(kid){
  if(_envs.role!=="parent"||_envs.kids.indexOf(kid)<0||_envs.busyCode) return false;
  const name=envsKidName(kid), code=envsMakeCode();
  if(envsDemo()){ _envs.newCard={name,code,kid,demo:true}; envsToast("demo: would make a new code for "+name); envsRe(); return true; }
  if(typeof _dryRun==="function"&&_dryRun()) return false;
  _envs.busyCode=kid; envsRe(); let sec, uidK;
  Promise.resolve().then(()=>{ sec=envsSecondary(); return sec.auth().createUserWithEmailAndPassword(envsKidEmail(code),envsKidPw(code)); }).then(c=>{ uidK=c.user.uid; return sec.auth().signOut(); })
    .then(()=>firebase.database().ref().update(envsNewCodePaths({familyId:_envs.familyId,kid,cid:_envs.cid,name,uidKid:uidK,now:Date.now()})))
    .then(()=>{ _envs.newCard={name,code,kid}; _envs.busyCode=""; envsToast("New code for "+name); envsRe(); })
    .catch(e=>{ _envs.busyCode=""; _envs.err=String((e&&e.message)||e); envsToast("Couldn’t make a code: "+_envs.err); try{ if(sec) sec.auth().signOut(); }catch(x){} envsRe(); });
  return true;
}
function envsCodesCardHtml(){
  if(_envs.role!=="parent"||!_envs.kids.length) return "";
  let h='<div class="envs-card"><div class="envs-h2">\u{1F39F} Student cards</div><div class="envs-muted" style="margin-bottom:6px">Each kid signs in with a code from a card. Make one here any time; it replaces that kid\u2019s older code, and it is shown once.</div><div class="envs-row">';
  h+=_envs.kids.map(k=>'<button class="envs-btn sec" '+(_envs.busyCode?'disabled':'')+' onclick="envsParentNewCode(\''+envsEsc(k)+'\')">'+(_envs.busyCode===k?'Making\u2026':'\u{1F39F} New card for '+envsEsc(envsKidName(k)))+'</button>').join("")+'</div>';
  const C=_envs.newCard;
  if(C) h+='<div id="envc-code-card" style="margin-top:10px;background:#fff;border:2px dashed #14532d;border-radius:14px;padding:14px;text-align:center"><div style="font-size:12px;color:#14532d;font-weight:800">\u{1F33F} Envirothon \u00B7 Howe Academy</div><div style="font-size:16px;font-weight:900;margin:4px 0">'+envsEsc(C.name)+'</div><div style="font-size:11px;color:#6b7280">Open the page, tap <b>Students</b>, type your code:</div><div style="font-size:30px;font-weight:900;letter-spacing:.12em;margin:6px 0;font-family:monospace">'+envsEsc(C.code)+'</div><div style="font-size:10.5px;color:#6b7280">'+envsEsc(typeof location!=="undefined"?String(location.origin+location.pathname).replace(/index\.html$/,""):"")+'</div></div>'+
    '<div class="envs-row" style="margin-top:8px"><button class="envs-btn sec" onclick="envcPrintCard()">\u{1F5A8} Print card</button><button class="envs-btn sec" onclick="_envs.newCard=null;envsRe()">Done</button><span class="envs-muted">Copy or print it now \u2014 it is not kept anywhere.'+(C.demo?' (demo)':'')+'</span></div>';
  return h+'</div>';
}
// into the part: the body classes, the one page, the mirror pointed at this project, then the app's own boot (kid / parent) or the console
function envsEnter(cont){
  envsCss(); try{ tab=ENVS_TAB; }catch(e){}
  try{ document.body.classList.add("env-site","env-role-"+_envs.role); }catch(e){}
  try{ if(_envs.kidMode) document.body.classList.add("env-kidmode"); }catch(e){}   // CPKIDMODE: a parent login in a kid's view (role stays parent)
  if(_envs.role==="kid"||_envs.role==="parent"){
    try{ const f=envsFam(); if(f&&!envsDemo()){ f.envirothon=Object.assign({},f.envirothon||{},{firebase:Object.assign({},FB_CFG),familyId:_envs.familyId,kids:(_envs.kids&&_envs.kids.length)?_envs.kids.slice():[_envs.kid]}); if(_envs.cid) f.envirothon.classId=_envs.cid; } }catch(e){}   // 🌿 ENVMIRROR publishes students/<sid>/summary to THIS project under this login · CPSIBLINGS: every kid on this login
    try{ if(typeof _envm!=="undefined"&&!envsDemo()){ _envm.app=firebase.app(); _envm.edb=firebase.database(); _envm.auth=firebase.auth(); _envm.user=firebase.auth().currentUser||null; } }catch(e){}
    try{ masteryKid=_envs.kid; }catch(e){}
    _envs.view="study";
    if(typeof cont==="function") cont(); else { try{ haAuthHide(); initFb(); renderAll(); haAuthWatch(); }catch(e){} }
    envsReadEdition(); envsReadShared();
    return;
  }
  _envs.view="grid";
  try{ haAuthHide(); }catch(e){}
  try{ if(typeof envConsoleStart==="function") envConsoleStart(); }catch(e){ _envs.err=String((e&&e.message)||e); }
  try{ renderAll(); }catch(e){}
  try{ haAuthWatch(); }catch(e){}
}
// after connect, the family instance's own edition record (can only add the lock) — one read
function envsReadEdition(){ try{ if(envsDemo()||typeof db==="undefined"||!db) return; db.ref("settings/edition").once("value",s=>{ const v=s&&typeof s.val==="function"?s.val():null; if(v==="envirothon"){ _envs.dbEdition=v; if(typeof haLazyLoad==="function"&&!haLazyReady("classes")) haLazyLoad("classes").catch(()=>{}); } }); }catch(e){} }   // 🪶 LAZYSPLIT: classes.js for the site (the next paint picks it up, as it picks up the flag)
// the shared instance's few reads a kid / parent needs: the class (name, teams), the boards, who drills — live listeners, repaint on arrival
function envsReadShared(){
  if(envsDemo()) return; let sdb; try{ sdb=firebase.database(); }catch(e){ return; }
  const val=s=>(s&&typeof s.val==="function")?s.val():null, re=()=>{ try{ if(typeof renderAllSoon==="function") renderAllSoon(); }catch(e){} };
  const go=cid=>{ if(!cid) return; _envs.cid=cid; sdb.ref("classes/"+cid).on("value",s=>{ _envs.cls=val(s); if(typeof cpClassIn==="function") cpClassIn(); re(); }); sdb.ref("boards/"+cid).on("value",s=>{ _envs.boards=val(s); re(); }); sdb.ref("settings/whoDrills/"+cid).on("value",s=>{ _envs.who=val(s)||""; re(); }); if(typeof envClsKidLoad==="function") envClsKidLoad(sdb,cid); };   // ⚙️ ENVCLASSSET: the class's settings + this student's, once · 🏫 CPCLASS: the class's lock date
  if(_envs.cid) go(_envs.cid); else if(_envs.sid) sdb.ref("students/"+_envs.sid+"/class").once("value",s=>go(val(s)));
  if(typeof cpdrListen==="function") cpdrListen(sdb,re);   // 🧠 CPDRILLPARENT: the parent's review switch (students/<sid>/review), live
  if(typeof cpdtListen==="function") cpdtListen(sdb,re);   // 🧠 CPDRILLTEACHER: the teacher's drills (drills/<cid>/<sid>), live; each applied once
  if(typeof cpCalListen==="function") cpCalListen(sdb,re);   // 📅 CPCAL: the family's own study days (students/<sid>/calendar), live
  if(typeof cpSecListen==="function") cpSecListen(sdb,re);   // 🎚 CPSECTIONS: the student's own section states (students/<sid>/sections), live
  if(typeof cpSpecListen==="function") cpSpecListen(sdb,re);   // 🏅 CPSPECIALIST: the student's specialist mark (students/<sid>/specialist), live
  if(typeof cpAheadListen==="function") cpAheadListen(sdb,re);   // 🚀 CPAHEAD: the student’s own early access (students/<sid>/ahead), live; a record from another device opens here too
  if(_envs.role==="parent"&&_envs.kids.length>1) _envs.kids.forEach(k=>sdb.ref("students/"+_envs.familyId+"_"+k+"/meta/name").once("value",s=>{ const n=val(s); if(n){ _envs.kidNames[k]=String(n).slice(0,40); re(); } }));   // CPSIBLINGS: the tabs' names
  sdb.ref("release/locked").on("value",s=>{ _envs.lockRaw=val(s); _envs.lock=envsLockState(_envs.lockRaw); if(_envs.lock.locked&&_envs.role!=="admin") envsCard("closed"); });
}
// showTab: the site has one page — every tap lands back on it (every door the micro doc lists as off is simply not reachable)
function envSiteTabGate(t){ if(!envSiteOn()||!_envs.role) return false; try{ tab=ENVS_TAB; }catch(e){} try{ renderAll(); }catch(e){} return true; }
function envsCss(){
  if(_envs.css||typeof document==="undefined") return; _envs.css=true;
  try{ const s=document.createElement("style"); s.id="envs-css"; s.textContent=
    'body.env-site #app-header,body.env-site #nav-tabs,body.env-site #sched-subtabs,body.env-site #day-tabs,body.env-site #kid-filter,body.env-site #week-strip,body.env-site #hq-back,body.env-site #md-back{display:none !important}'+
    'body.env-site #content{max-width:900px;margin:0 auto}.envs-wrap{font-family:\'DM Sans\',sans-serif;padding:0 12px 90px}'+
    '.envs-top{position:sticky;top:0;z-index:98;margin:0 -12px 10px;padding:10px 14px;color:#fff;display:flex;align-items:center;gap:10px;box-shadow:0 2px 8px rgba(0,0,0,.12)}'+
    '.envs-top .t{flex:1;font-weight:900;font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.envs-top .envs-brand{font-family:\'Fraunces\',serif;font-size:14px;font-weight:700;line-height:1.15;letter-spacing:.01em}.envs-top .envs-brand span{color:#a5b4fc}.envs-top button{min-height:40px;padding:0 12px;border-radius:12px;border:none;background:rgba(255,255,255,.18);color:#fff;font-weight:800;cursor:pointer;font-family:inherit;font-size:13px}'+
    '.envs-chips{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px}.envs-chips button{flex-shrink:0;min-height:40px;padding:0 14px;border-radius:999px;border:2px solid #d1d5db;background:#fff;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;color:#374151}.envs-chips button.on{background:#14532d;border-color:#14532d;color:#fff}'+
    '.envs-card{background:#fff;border:1.5px solid var(--border);border-radius:14px;padding:12px 14px;margin-bottom:12px}.envs-h2{font-weight:900;font-size:14px;margin-bottom:6px;color:#111827}.envs-chip{display:inline-block;padding:3px 9px;border-radius:999px;background:#f0fdf4;border:1px solid #bbf7d0;font-size:11.5px;color:#14532d}'+
    '.envs-btn{min-height:44px;padding:0 16px;border-radius:12px;border:none;background:#14532d;color:#fff;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit}.envs-btn.sec{background:#fff;color:#1f2937;border:1.5px solid var(--border)}.envs-btn.red{background:#fff;color:#b91c1c;border:1.5px solid #fecaca}.envs-btn:disabled{opacity:.5;cursor:default}'+
    '.envs-in{min-height:40px;padding:6px 10px;border:1.5px solid var(--border);border-radius:10px;font:inherit;font-size:14px;width:100%;box-sizing:border-box}.envs-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.envs-muted{color:var(--muted);font-size:11.5px}'+
    '.envs-demo{position:sticky;top:0;z-index:99;background:#fde68a;color:#1f2937;padding:8px 12px;margin:0 -12px 8px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:12.5px;font-weight:700}.envs-demo button{min-height:34px;padding:0 10px;border-radius:999px;border:1.5px solid #b45309;background:#fff;font-weight:800;cursor:pointer;font-family:inherit;font-size:12px;color:#92400e}.envs-demo button.on{background:#b45309;color:#fff}'+
    '.envs-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:100001;background:#111827;color:#fff;padding:10px 14px;border-radius:12px;font:600 12.5px \'DM Sans\',sans-serif;max-width:92vw;box-shadow:0 8px 24px rgba(0,0,0,.25)}'+
    '.envs-grid{width:100%;border-collapse:collapse;font-size:12px}.envs-grid th,.envs-grid td{padding:6px 6px;border-bottom:1px solid #f1efe9;text-align:left;white-space:nowrap}.envs-grid th{font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}.envs-grid td.c{text-align:center}'+
    'body.env-site .kc-study-bar{display:none}'+
    '.envs-mode{display:flex;gap:6px;flex-shrink:0}.envs-top .envs-mode button{padding:0 10px;white-space:nowrap}@media (max-width:480px){.envs-top .envs-mode button{padding:0 8px;font-size:12px}}.envs-swap{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:-4px 0 10px;font-size:12px;color:var(--muted);font-weight:700}.envs-swap button{min-height:32px;padding:0 12px;border-radius:999px;border:2px solid #d1d5db;background:#fff;font-weight:800;font-size:12px;cursor:pointer;font-family:inherit;color:#374151}.envs-swap button.on{background:#14532d;border-color:#14532d;color:#fff}';   // CPKIDMODE
    document.head.appendChild(s); }catch(e){}
}
// ── the cards that replace the app: season closed · login not set up · an error. Nothing else loads.
function envsCard(kind,x){
  x=x||{}; if(typeof document==="undefined") return;
  try{ haAuthHide(); }catch(e){} envsCss();
  let o=document.getElementById("envs-card"); if(!o){ o=document.createElement("div"); o.id="envs-card"; o.style.cssText="position:fixed;inset:0;z-index:100000;background:#f0fdf4;display:flex;align-items:center;justify-content:center;padding:20px;font-family:'DM Sans',system-ui,sans-serif"; document.body.appendChild(o); }
  let inner;
  if(kind==="closed") inner='<div style="font-size:40px">\u{1F512}</div><div style="font-weight:900;font-size:20px;margin:8px 0 4px">Season closed</div><div style="font-size:13px;color:#4b5563;line-height:1.5">The '+envsEsc((typeof cpSeason==="function"&&cpSeason())||ENVS_SEASON)+' '+envsEsc((typeof cpBrand==="function"&&_envs.cls)?cpBrand(_envs.cls).title:"Envirothon")+' season is closed'+(_envs.lock&&_envs.lock.why==="auto"?' (it closes by itself after '+envsAutoLockLabel()+')':'')+'. Everything is kept; nothing is deleted. Ask Adrienne if it should reopen.</div>';   // 🏫 CPCLASS: the class's season and title
  else if(kind==="notset") inner='<div style="font-size:40px">\u{1F331}</div><div style="font-weight:900;font-size:20px;margin:8px 0 4px">This login isn\u2019t set up yet</div><div style="font-size:13px;color:#4b5563;line-height:1.5">'+envsEsc(_envs.email||"This account")+' has no student, parent or teacher record here. Ask your teacher to add you from her roster.</div>';
  else inner='<div style="font-size:40px">\u26A0\uFE0F</div><div style="font-weight:900;font-size:20px;margin:8px 0 4px">Couldn\u2019t open</div><div style="font-size:13px;color:#4b5563;line-height:1.5">'+envsEsc(x.msg||_envs.err||"Try again in a minute.")+'</div>';
  o.innerHTML='<div style="background:#fff;border-radius:18px;padding:24px 22px;max-width:380px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.2)">'+inner+
    '<div style="margin-top:14px;display:flex;gap:8px;justify-content:center"><button onclick="envsSignOut()" class="envs-btn sec">Sign out</button><button onclick="location.reload()" class="envs-btn">\u21BB Try again</button></div>'+
    '<div style="margin-top:14px;font-size:10.5px;color:#6b7280;line-height:1.4">'+envsEsc(envsLicenseLine())+'</div></div>';
}
// ── the sign-in card (haAuthShow's first line): the app's own email + password form, the student-code field, the © line
function envSiteAuthShow(msg){
  if(!envSiteOn()||envsDemo()||typeof document==="undefined") return false;
  envsCss(); let o=document.getElementById("ha-auth");
  if(!o){ o=document.createElement("div"); o.id="ha-auth"; o.style.cssText="position:fixed;inset:0;z-index:100000;background:#0f2e1f;display:flex;align-items:center;justify-content:center;padding:20px;font-family:'DM Sans',system-ui,sans-serif;overflow:auto"; o.innerHTML=envsAuthHtml(); document.body.appendChild(o);
    setTimeout(function(){ const i=document.getElementById("ha-auth-e"); if(i) i.focus(); },50); }
  const m=document.getElementById("ha-auth-m"); if(m) m.textContent=msg||"";
  return true;
}
function envsAuthHtml(){
  return '<div style="background:#fff;border-radius:18px;padding:22px 20px;width:100%;max-width:360px;box-shadow:0 20px 60px rgba(0,0,0,.35)">'+
    '<div style="font-size:36px;text-align:center">\u{1F33F}</div><div style="font-weight:900;font-size:18px;text-align:center;margin:4px 0 2px">Envirothon \u00B7 Howe Academy</div>'+
    '<div style="font-size:12px;color:#64748b;text-align:center;margin-bottom:14px">'+envsEsc(envsClassName())+'</div>'+
    '<form onsubmit="return envsAuthSubmit(event)"><div style="font-size:11px;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Parents and teachers</div>'+
    '<input id="ha-auth-e" class="envs-in" type="email" autocomplete="username" placeholder="email" required style="margin-bottom:8px">'+
    '<input id="ha-auth-p" class="envs-in" type="password" autocomplete="current-password" placeholder="password" required style="margin-bottom:8px">'+
    '<button id="ha-auth-b" type="submit" class="envs-btn" style="width:100%">Sign in</button>'+
    '<div style="text-align:center;margin-top:8px"><a href="javascript:void(0)" onclick="envsForgot()" style="font-size:12px;color:#14532d">Forgot the password? Email me a reset link</a></div></form>'+
    '<div style="display:flex;align-items:center;gap:10px;margin:16px 0 12px;color:#9ca3af;font-size:11px"><div style="flex:1;height:1px;background:#e5e7eb"></div>or<div style="flex:1;height:1px;background:#e5e7eb"></div></div>'+
    '<form onsubmit="return envsKidSubmit(event)"><div style="font-size:11px;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Students</div>'+
    '<div style="display:flex;gap:8px"><input id="ha-auth-k" class="envs-in" type="text" autocomplete="off" autocapitalize="characters" placeholder="Student code from your card" maxlength="8" style="flex:1;letter-spacing:.08em;font-weight:800;text-transform:uppercase"><button id="ha-auth-kb" type="submit" class="envs-btn">Go</button></div></form>'+
    '<div id="ha-auth-m" style="min-height:16px;font-size:12px;color:#b5394a;text-align:center;margin-top:10px"></div>'+
    '<div style="margin-top:12px;font-size:10.5px;color:#6b7280;text-align:center;line-height:1.4">'+envsEsc(envsLicenseLine())+'</div></div>';
}
function envsAuthErr(err){ const code=String(err&&err.code||""); return /wrong-password|invalid-credential|user-not-found|invalid-login/.test(code)?"That email or password isn\u2019t right.":/too-many/.test(code)?"Too many tries \u2014 wait a minute.":/network/.test(code)?"No connection \u2014 try again.":(err&&err.message)||"Couldn\u2019t sign in."; }
function envsAuthSubmit(ev){
  if(ev&&ev.preventDefault) ev.preventDefault(); if(!envSiteOn()) return false;
  const e=((document.getElementById("ha-auth-e")||{}).value||"").trim(), p=(document.getElementById("ha-auth-p")||{}).value||"";
  const b=document.getElementById("ha-auth-b"); if(b){ b.disabled=true; b.textContent="Signing in\u2026"; } envSiteAuthShow("");
  firebase.auth().signInWithEmailAndPassword(e,p).then(function(){ try{ sessionStorage.setItem("ha_reload_why","envsite-signin"); }catch(x){} location.reload(); })
    .catch(function(err){ if(b){ b.disabled=false; b.textContent="Sign in"; } envSiteAuthShow(envsAuthErr(err)); });
  return false;
}
function envsKidSubmit(ev){
  if(ev&&ev.preventDefault) ev.preventDefault(); if(!envSiteOn()) return false;
  const raw=(document.getElementById("ha-auth-k")||{}).value||"", code=envsCodeNorm(raw);
  if(!envsCodeOk(code)){ envSiteAuthShow("A code looks like ABC-123 \u2014 check your card."); return false; }
  const b=document.getElementById("ha-auth-kb"); if(b){ b.disabled=true; b.textContent="\u2026"; } envSiteAuthShow("");
  firebase.auth().signInWithEmailAndPassword(envsKidEmail(code),envsKidPw(code)).then(function(){ try{ sessionStorage.setItem("ha_reload_why","envsite-kid"); }catch(x){} location.reload(); })
    .catch(function(err){ if(b){ b.disabled=false; b.textContent="Go"; } envSiteAuthShow(/wrong-password|invalid-credential|user-not-found|invalid-login/.test(String(err&&err.code||""))?"That code isn\u2019t one of ours \u2014 check your card or ask your teacher.":envsAuthErr(err)); });
  return false;
}
function envsForgot(){ if(!envSiteOn()) return; const e=((document.getElementById("ha-auth-e")||{}).value||"").trim(); if(!e){ envSiteAuthShow("Type your email first, then tap the link."); return; }
  try{ firebase.auth().sendPasswordResetEmail(e).then(function(){ envSiteAuthShow("Sent \u2014 check your email for the reset link."); }).catch(function(err){ envSiteAuthShow(envsAuthErr(err)); }); }catch(err){ envSiteAuthShow(envsAuthErr(err)); } }
function envsSignOut(){ if(envsDemo()){ envsToast("demo: would sign out"); return; } try{ if(typeof HA_LS!=="undefined") HA_LS.removeItem(ENVS_MODE_KEY); }catch(e){} try{ haSignOut(); }catch(e){ try{ location.reload(); }catch(x){} } }
// ── writes: demo → a toast and a record, never a write; dry run → nothing; live → the shared instance (the console's writes come through here too)
function envsWrite(path,val,op){
  op=op||"set"; const rec={op,path,val:(val===undefined?null:val)};
  if(typeof cpLockRefuse==="function"){ const lk=cpLockRefuse(path,val,op); if(lk) return Promise.reject(new Error(lk)); }   // 🔒 CPLOCKS: a teacher's write to a part Adrienne locked stops here (the rules refuse it too)
  if(envsDemo()){ _envs.writes.push(rec); envsToast("demo: would "+op+" "+path); return Promise.resolve(rec); }
  if(typeof _dryRun==="function"&&_dryRun()){ return Promise.resolve(rec); }
  try{ const r=firebase.database().ref(path); return op==="update"?r.update(val):op==="remove"?r.remove():r.set(val); }catch(e){ return Promise.reject(e); }
}
function envsToast(msg){
  if(typeof document==="undefined") return;
  try{ let t=document.getElementById("envs-toast"); if(!t){ t=document.createElement("div"); t.id="envs-toast"; t.className="envs-toast"; document.body.appendChild(t); } t.textContent=msg; t.style.display="block";
    if(_envs.toastT) clearTimeout(_envs.toastT); _envs.toastT=setTimeout(()=>{ try{ t.style.display="none"; }catch(e){} },2600); }catch(e){}
}
function envsRe(){ try{ renderAll(); }catch(e){} }
function envsView(v){ _envs.view=v; if(v==="games"){ try{ if(typeof gamesActive==="function"&&!gamesActive()){ if(typeof gamesOpen==="function") gamesOpen(); return; } }catch(e){} } envsRe(); try{ window.scrollTo(0,0); }catch(e){} }
// ── the page (the one line in _renderAllInner): false for every other family; true = #content is ours
function envSiteRender(c){
  if(!envSiteOn()) return false; if(typeof tab!=="undefined"&&tab!==ENVS_TAB) return false; if(!_envs.role&&!envsDemo()) return false;
  if(!c) return true;
  let body="";
  try{
    if(envsDemo()&&_envs.demoRole==="signin") body=envsDemoSigninHtml();
    else if(envsPageRole()==="kid") body=envsKidHtml();   // CPKIDMODE: a parent login in a kid's view gets the kid's page
    else if(_envs.role==="parent") body=envsParentHtml();
    else body=(typeof envConsoleHtml==="function")?envConsoleHtml():'<div class="envs-card">The console is not in this build.</div>';
  }catch(e){ body='<div class="envs-card" style="color:#b91c1c">Couldn\u2019t draw this screen: '+envsEsc((e&&e.message)||e)+'</div>'; try{ console.error("[HA] ENVSITE",e); }catch(x){} }
  c.innerHTML='<div class="envs-wrap">'+envsDemoBarHtml()+body+'</div>';
  if(!envsDemo()){ envsAutoEnroll(); envsArmMirror(); }
  return true;
}
// ── KID ──
function envsKidColor(kid){ try{ return (typeof KID_COLOR!=="undefined"&&KID_COLOR[kid])||"#14532d"; }catch(e){ return "#14532d"; } }
function envsKidName(kid){ try{ return (_envs.kidNames&&_envs.kidNames[kid])||(typeof KID_NAME!=="undefined"&&KID_NAME[kid])||(typeof cap==="function"?cap(kid):kid); }catch(e){ return kid; } }   // CPSIBLINGS: students/<sid>/meta/name first
function envsStarsOf(kid){ if(envsDemo()) return _envs.bankDemo; try{ return (typeof bankBalance==="function")?bankBalance(kid):0; }catch(e){ return 0; } }
function envsKidHtml(){
  const kid=_envs.kid, col=envsKidColor(kid), name=envsKidName(kid), v=_envs.view||"study";
  const mb=envsModeBtnsHtml();   // CPKIDMODE: 👩 Parent (+ Go to <brother or sister>) — a parent login in kid view only
  let h=(typeof cpTopHtml==="function")?cpTopHtml("kid",name,'<div style="font-weight:900">\u2B50 '+envsStarsOf(kid)+'</div>'+mb):'<div class="envs-top" style="background:'+col+'"><div class="t"><div class="envs-brand">Howe <span>Academy</span></div>\u{1F33F} '+envsEsc(name)+' \u00B7 Envirothon</div><div style="font-weight:900">\u2B50 '+envsStarsOf(kid)+'</div>'+mb+'<button onclick="envsView(\'settings\')" aria-label="Settings">\u2699\uFE0F</button></div>';   // 🏫 CPCLASS: the class's emoji, title and color
  const chips=[["study","\u{1F4DA} Study"],["games","\u{1F3AE} Games"],["scores","\u{1F4CA} Scores"],["boards","\u{1F3C6} Team"],["store","\u{1F6CD} Star Store"],["tips","\u{1F4A1} Tips"]];
  h+='<div class="envs-chips">'+chips.map(x=>'<button class="'+((v===x[0]||(x[0]==="games"&&v==="games"))?'on':'')+'" onclick="envsView(\''+x[0]+'\')">'+x[1]+'</button>').join("")+'</div>';
  if(v==="games") h+=envsGamesHtml(kid,col);
  else if(v==="scores") h+=envsScoresHtml(kid);
  else if(v==="boards") h+=envsBoardsHtml(_envs.boards,_envs.sid);
  else if(v==="store") h+=envsStoreHtml(kid);
  else if(v==="tips") h+=envsTipsHtml("kid");
  else if(v==="settings") h+=(typeof envsSettingsHtml==="function")?envsSettingsHtml():"";   // 🪶 LAZYSPLIT: CPCLASS (classes.js)
  else { if(typeof cpdtKidHtml==="function") h+=cpdtKidHtml(kid); h+=envsStudyHtml(kid); }   // 🧠 CPDRILLTEACHER: the teacher's drills applied first, then "drilled you in class" above the pile
  return h;
}
function envsStudyHtml(kid){
  try{ masteryKid=kid; }catch(e){}
  let body=""; try{ body=(typeof renderMastStudy==="function")?renderMastStudy({noCheckup:true}):""; }catch(e){ body='<div class="envs-card" style="color:var(--muted)">Couldn\u2019t load the study cards \u2014 try again ('+envsEsc((e&&e.message)||e)+')</div>'; }
  if(!body||/No study sessions yet/.test(body)) body='<div class="envs-card" style="text-align:center;padding:30px 14px"><div style="font-size:36px">\u{1F331}</div><div style="font-weight:900;font-size:16px;margin-top:6px">Your cards are on their way</div><div class="envs-muted" style="margin-top:4px">'+(_envs.autoEnroll==="working"?'Setting up your Envirothon deck now\u2026':'Your teacher sends out each station as the class reaches it. Check back after class.')+'</div></div>';
  if(typeof cpsdKidNote==="function") body=cpsdKidNote(kid)+body;   // 📤 CPSEND: 📅 what is coming, and when
  if(typeof cpWatchHtml==="function") body=cpWatchHtml("kid",kid)+body;   // 🧠 CPWATCH: the review cards waiting for the drill with Mom or Dad
  body=(typeof cpSkillStudyWrap==="function")?cpSkillStudyWrap(kid,body):body;   // 🧩 CPSKILL: a running skill sitting takes the page; else the 🧩 Skills door under the study start
  return '<div style="padding-top:4px">'+body+'</div>';
}
function envsGamesHtml(kid,col){
  try{ masteryKid=kid; }catch(e){}
  try{ if(typeof gamesActive==="function"&&!gamesActive()) mastView="games"; const sub=(typeof gamesSubHtml==="function")?gamesSubHtml(col):"", body=(typeof gamesBodyHtml==="function")?gamesBodyHtml(col):"";
    return '<div class="envs-card">'+(sub||'<div class="envs-muted">\u{1F3CB}\uFE0F Word workout \u2014 Match, Memory flip and Which one? open on your Envirothon decks once a few cards are on your ladder.</div>')+'</div><div>'+body+'</div>'; }
  catch(e){ return '<div class="envs-card" style="color:var(--muted)">Games open once a few cards are on your ladder.</div>'; }
}
function envsSummary(kid){ try{ return (typeof envSummary==="function")?envSummary(kid):null; }catch(e){ return null; } }
function envsWhen(k){ const a=envsDaysAgo(k); if(a==null) return "never"; if(a<=0) return "today"; if(a===1) return "yesterday"; return a+" days ago"; }
// station rows: mastered bar · in progress · check-in / final / 🎓 · accuracy (14 d) · last studied — the parent page and the console's student page draw these
function envsStationRowsHtml(summary,opts){
  opts=opts||{}; let h='';
  envsStations().forEach(st=>{ const s=envsStationStat(summary,st);
    h+='<div style="padding:8px 0;border-top:1px solid #f1efe9"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><div style="font-weight:800;flex:1;min-width:120px">'+envsEsc(st.label)+(s.grad?' \u{1F393}':'')+'</div>';
    if(!s.released) h+='<span class="envs-muted">\u{1F512} not sent out yet</span>';
    else h+='<span class="envs-muted">'+s.mastered+' mastered \u00B7 '+s.learning+' in progress \u00B7 '+s.new+' to come'+(s.acc14!=null?' \u00B7 '+s.acc14+'% right (14 d)':'')+' \u00B7 last '+envsWhen(s.last)+'</span>';
    h+='</div>';
    if(s.released) h+='<div style="height:10px;background:#eef2ee;border-radius:5px;overflow:hidden;margin-top:5px"><div style="width:'+(s.pct||0)+'%;height:100%;background:'+(s.pct>=80?'#15803d':'#65a30d')+'"></div></div>';
    const bits=[]; if(s.pre) bits.push('check-in '+s.pre.right+'/'+s.pre.n); if(s.post) bits.push('final '+s.post.right+'/'+s.post.n); if(s.grad) bits.push('\u{1F393} graduated'+(s.grad.date?' '+s.grad.date:''));
    if(bits.length) h+='<div style="font-size:11.5px;color:#0d9488;font-weight:700;margin-top:4px">\u{1F4DD} '+envsEsc(bits.join(" \u00B7 "))+'</div>';
    if(opts.kid&&typeof envtCoreLine==="function"){ const cl=envtCoreLine(opts.kid,st.id); if(cl) h+='<div class="envs-muted" style="margin-top:3px">\u{1F4DD} '+envsEsc(cl)+'</div>'; }   // 📝 ENVTEST: how far to the final (kid and parent; the console has no cards)
    if(s.released&&typeof cpSkillRowLine==="function"){ const sl=cpSkillRowLine(summary,st.id); if(sl) h+='<div class="envs-muted" style="margin-top:3px">\u{1F9E9} '+envsEsc(sl)+'</div>'; }   // 🧩 CPSKILL: "skills learned 0 of 1" (kid, parent and the console's student page)
    if(opts.weak&&summary&&summary.weak){ const w=[]; st.decks.forEach(d=>{ (summary.weak[d.key]||[]).forEach(r=>w.push(r)); }); w.sort((a,b)=>(b.m*2+b.d)-(a.m*2+a.d));
      if(w.length) h+='<div class="envs-muted" style="margin-top:3px">needs work: '+envsEsc(w.slice(0,4).map(r=>r.n+(r.m?' \u00D7'+r.m:'')).join(" \u00B7 "))+'</div>'; }
    h+='</div>'; });
  return h;
}
function envsStreakHtml(summary){
  const st=(summary&&summary.streak)||{days:0,last:null}, d=(summary&&summary.days)||{}; let dots='';
  for(let i=13;i>=0;i--){ const k=envsDayKey(Date.now()-i*86400000); const on=!!d[k]; dots+='<div title="'+k+'" style="width:14px;height:14px;border-radius:4px;background:'+(on?'#15803d':'#e5e7eb')+'"></div>'; }
  return '<div class="envs-card"><div class="envs-row"><div style="flex:1"><div class="envs-h2" style="margin:0">\u{1F525} '+st.days+'-day streak</div><div class="envs-muted">last study '+envsWhen(st.last)+' \u00B7 the last 14 days</div></div><div style="display:flex;gap:3px">'+dots+'</div></div></div>';
}
function envsScoresHtml(kid){
  const s=envsSummary(kid); let h=envsStreakHtml(s);
  h+='<div class="envs-card"><div class="envs-h2">\u{1F4CA} My stations</div>'+envsStationRowsHtml(s,{weak:true,kid})+'</div>';
  const days=Object.keys((s&&s.days)||{}).sort().reverse().slice(0,10);
  h+='<div class="envs-card"><div class="envs-h2">Study sittings</div>'+(days.length?days.map(k=>{ const e=s.days[k]; const pct=(e.c+e.m)?Math.round(e.c/(e.c+e.m)*100):null; return '<div style="display:flex;gap:8px;padding:5px 0;border-top:1px solid #f1efe9;font-size:12.5px"><div style="flex:1;font-weight:700">'+k.slice(0,4)+'-'+k.slice(4,6)+'-'+k.slice(6,8)+'</div><div>'+e.n+' cards</div><div style="width:60px;text-align:right;font-weight:800;color:'+(pct==null?'var(--muted)':pct>=80?'#15803d':'#b45309')+'">'+(pct==null?'\u2013':pct+'%')+'</div></div>'; }).join(""):'<div class="envs-muted">No sittings yet.</div>')+'</div>';
  return h;
}
function envsStoreHtml(kid){ return '<div class="envs-card" style="text-align:center;padding:28px 14px"><div style="font-size:36px">\u{1F6CD}</div><div style="font-weight:900;font-size:16px;margin-top:6px">Star Store \u00B7 closed here</div><div class="envs-muted" style="margin-top:6px">You have \u2B50 '+envsStarsOf(kid)+'. In the full Howe Academy, stars buy things Mom sets up \u2014 here they add up for now.</div></div>'; }
function envsTipsHtml(role){
  let h='<div class="envs-card" style="border-color:#bbf7d0;background:#f0fdf4"><div class="envs-h2">\u{1F4A1} From Adrienne</div><ol style="margin:0;padding-left:18px;font-size:13px;line-height:1.55">'+ENVS_TIPS.map(t=>'<li>'+envsEsc(t)+'</li>').join("")+'</ol><div style="font-size:12px;margin-top:8px;font-weight:700">'+envsEsc(ENVS_CONTACT)+'</div></div>';
  if(role==="parent") h+='<div class="envs-card" style="opacity:.75"><div class="envs-h2" style="color:#6b7280">What a full Howe Academy adds</div><ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:1.55;color:#6b7280">'+ENVS_FULL_APP.map(t=>'<li>'+envsEsc(t)+'</li>').join("")+'</ul><div class="envs-muted" style="margin-top:6px">Ask Adrienne.</div></div>';
  return h;
}
// ⇢ classes.js: CPGEAR
function envsSetPin(){ const v=((document.getElementById("envs-pin")||{}).value||"").trim(); if(!/^\d{4}$/.test(v)){ envsToast("A PIN is exactly 4 digits."); return; } if(envsDemo()){ envsToast("demo: would set settings/pin"); return; } try{ APP_PIN=v; HA_LS.setItem("ha_app_pin",v); if(db&&!_dryRun()) db.ref("settings/pin").set(v); envsToast("PIN saved"); }catch(e){ envsToast("Couldn\u2019t save: "+((e&&e.message)||e)); } }
// ⭐ stars per finished sitting (the one line in _mstSaveInner; her 8.5 "stars for a finished study sitting: yes, small fixed count")
function envSiteSittingDone(kid,done){
  if(!envSiteOn()||!(_envs.role==="kid"||_envs.role==="parent")||!kid||kid!==_envs.kid) return false;
  if(!done||!(done.total>0)) return false;
  if(typeof cpdtPickSend==="function") cpdtPickSend(kid);   // 🧠 CPDRILLTEACHER: a sitting moved cards, so today's drillPick may have changed
  if(envsDemo()){ _envs.bankDemo+=ENVS_STARS; envsToast("\u2B50 +"+ENVS_STARS+" for a finished sitting (demo: would write bank/"+kid+"/adjustments)"); return true; }
  if(typeof _dryRun==="function"&&_dryRun()) return false;
  try{ if(typeof bankDirect==="function"){ bankDirect(kid,ENVS_STARS,"\u{1F33F} Envirothon study sitting"); envsToast("\u2B50 +"+ENVS_STARS+" stars"); return true; } }catch(e){}
  return false;
}
// the first signed-in boot (kid or parent) enrolls the family's kid in the unit, every deck held — through the app's own enroll (every stage, so
// every station's cards sit in the bank ready for the teacher's send-out). Idempotent: unitStudies/<id>/enrolled/<kid> ends it.
function envsAutoEnroll(){
  if(typeof cpuAutoEnroll==="function") return cpuAutoEnroll();   // 📦 CPUNIT: every attached unit, one after another (NC Envirothon exactly as below)
  if(!envSiteOn()||envsDemo()||_envs.autoEnroll==="done"||_envs.autoEnroll==="working") return false;
  if(!(_envs.role==="kid"||_envs.role==="parent")||!_envs.kid) return false;
  if(typeof _haUnitsReady==="undefined"||!_haUnitsReady||typeof _haMastReady==="undefined"||!_haMastReady) return false;
  if(typeof db==="undefined"||!db||(typeof _dryRun==="function"&&_dryRun())) return false;
  if(typeof ENV_UNIT_ID==="undefined"||typeof STARTER_UNITS==="undefined"||typeof _ustApply!=="function"||typeof _ustWrite!=="function") return false;
  const kid=_envs.kid; let u=(typeof unitStudies!=="undefined"&&unitStudies)?unitStudies[ENV_UNIT_ID]:null;
  if(u&&u.enrolled&&u.enrolled[kid]){ _envs.autoEnroll="done"; return false; }
  _envs.autoEnroll="working";
  const enroll=()=>{
    u=unitStudies[ENV_UNIT_ID]; if(!u){ _envs.autoEnroll=""; return; }
    if(!(u.decks||[]).every(d=>!d||Array.isArray(d.cards))){ setTimeout(()=>{ _envs.autoEnroll=""; envsAutoEnroll(); },2500); return; }   // envirothon.js still loading
    try{
      (u.stages||[]).map(s=>s&&s.n).filter(n=>n!=null).forEach(n=>{ const w=_ustApply(u,kid,n,"","",""); if(w) _ustWrite(ENV_UNIT_ID,kid,w,{stage:n,knows:"",subject:"",map:"",ts:Date.now()}); });
      if(!u.enrolled) u.enrolled={}; u.enrolled[kid]=true; if(!u.kidStage) u.kidStage={}; if(!u.kidStage[kid]) u.kidStage[kid]={stage:0,ts:Date.now()};
      if(typeof envEnrollSession==="function") envEnrollSession(u,kid);
      if(typeof envMirrorOn==="function") envMirrorOn("enroll");
      _envs.autoEnroll="done"; envsToast("\u{1F33F} Your Envirothon deck is ready"); envsRe();
    }catch(e){ _envs.autoEnroll="failed"; _envs.err=String((e&&e.message)||e); try{ console.error("[HA] ENVSITE auto-enroll",e); }catch(x){} }
  };
  if(u){ enroll(); return true; }
  const mk=STARTER_UNITS[ENV_UNIT_ID]; if(!mk){ _envs.autoEnroll="failed"; return false; }
  const rec=mk(); rec.addedTs=Date.now();
  db.ref("unitStudies/"+ENV_UNIT_ID).transaction(cur=>cur?undefined:rec).then(r=>{ if(!unitStudies[ENV_UNIT_ID]) unitStudies[ENV_UNIT_ID]=(r&&r.snapshot&&typeof r.snapshot.val==="function"&&r.snapshot.val())||rec; if(typeof envHydrateAll==="function") envHydrateAll(); setTimeout(enroll,1500); }).catch(e=>{ _envs.autoEnroll="failed"; _envs.err=String((e&&e.message)||e); });
  return true;
}
// the mirror's listeners (release/<cid>/all, students/<sid>) attach once the unit is here — ENVMIRROR's own function, with this login's session
function envsArmMirror(){ if(_envs.mirrorArmed||envsDemo()||!(_envs.role==="kid"||_envs.role==="parent")) return; if(typeof _haUnitsReady==="undefined"||!_haUnitsReady) return; if(typeof envmAuthChanged!=="function"||typeof _envm==="undefined"||!_envm.edb) return; _envs.mirrorArmed=true; try{ if(!_envm.user) _envm.user=firebase.auth().currentUser||null; envmAuthChanged(); }catch(e){} }
// ── PARENT ──
function envsWhoNote(){ const w=_envs.who||"";
  if(typeof cpReviewWhoNote==="function"){ const t=cpReviewWhoNote(w); if(t) return t; }   // 🔁 CPREVIEW: the reviews are in the student's own 🌿 sitting — no PIN drill
  return w==="teacher"?"The teacher runs the drills in class \u2014 your part is the check-in on this page.":w==="parent"?"Your drills are on: open the parent view with your PIN to drill the cards together.":w==="both"?"Your drills are on, and the teacher drills in class too.":"Who drills (you, the teacher or both) is set by the teacher."; }
function envsParentHtml(){
  const kid=_envs.kid, name=envsKidName(kid), col=envsKidColor(kid), v=_envs.view==="study"?"home":(_envs.view||"home"), s=envsSummary(kid);
  const mb=envsModeBtnsHtml();   // CPKIDMODE: Go to <kid>, one per kid on this login
  let h=(typeof cpTopHtml==="function")?cpTopHtml("parent",name,mb):'<div class="envs-top" style="background:'+col+'"><div class="t"><div class="envs-brand">Howe <span>Academy</span></div>\u{1F33F} '+envsEsc(name)+'\u2019s Envirothon</div>'+mb+'<button onclick="envsView(\'settings\')" aria-label="Settings">\u2699\uFE0F</button></div>';   // 🏫 CPCLASS: the class's emoji, title and color
  h+=envsKidTabsHtml();   // CPSIBLINGS: one tab per kid on this login
  h+=envsKidSwapHtml();   // CPKIDMODE: kids can switch to each other without my password · On/Off
  const chips=[["home","\u{1F4C8} How "+name+" is doing"],["boards","\u{1F3C6} Team"],["tips","\u{1F4A1} Tips"]];
  h+='<div class="envs-chips">'+chips.map(x=>'<button class="'+(v===x[0]?'on':'')+'" onclick="envsView(\''+x[0]+'\')">'+envsEsc(x[1])+'</button>').join("")+'</div>';
  if(v==="pdrill"&&typeof cpdrDrillHtml==="function") h+=cpdrDrillHtml(kid);   // 🧠 CPDRILLPARENT: the parent's drill (🧠 Drill with Maya)
  else if(v==="boards") h+=envsBoardsHtml(_envs.boards,_envs.sid);
  else if(v==="tips") h+=envsTipsHtml("parent");
  else if(v==="settings") h+=(typeof envsSettingsHtml==="function")?envsSettingsHtml():"";   // 🪶 LAZYSPLIT: CPCLASS (classes.js)
  else { if(typeof cpdrCardHtml==="function") h+=cpdrCardHtml(kid); h+=envsStreakHtml(s); h+='<div class="envs-card"><div class="envs-h2">\u{1F4CA} Stations \u00B7 the same numbers the teacher sees</div>'+envsStationRowsHtml(s,{weak:true,kid})+'</div>';   // 🧠 CPDRILLPARENT: the review switch + 🧠 Drill, first on the page
    if(typeof cpWeekParentHtml==="function") h+=cpWeekParentHtml(kid);   // 📊 CPWEEK: This week, the same synopsis the teacher sees
    if(typeof cpCalParentHtml==="function") h+=cpCalParentHtml(kid);   // 📅 CPCAL: Our study days (the family's own, behind the class's switch) + the goals
    if(typeof cpPaceParentHtml==="function") h+=cpPaceParentHtml(kid);   // 📅 CPPACE: on pace for the goal
    h+='<div class="envs-card"><div class="envs-h2">\u{1F469}\u200D\u{1F3EB} Who drills</div><div style="font-size:13px">'+envsEsc(envsWhoNote())+'</div></div>';
    if(typeof cpFlagParentHtml==="function") h+=cpFlagParentHtml(kid);   // 🚩 CPFLAG: 🚩 Things you flagged, folded
    h+=envsCodesCardHtml();   // CPSIBLINGS: 🎟 Student cards — a new code for any kid on this login, shown once
    h+='<div class="envs-card" style="opacity:.8"><div class="envs-muted">Read-only: '+envsEsc(name)+' studies on the student login; this page shows how it is going. Class: '+envsEsc(envsClassName())+'.</div></div>'; }
  return h;
}
// ── DEMO ──
function envsDemoBarHtml(){
  if(!envsDemo()) return "";
  const r=_envs.demoRole; const btn=(k,l)=>'<button class="'+(r===k?'on':'')+'" onclick="envsDemoGo(\''+k+'\')">'+l+'</button>';
  return '<div class="envs-demo"><span>\u{1F9EA} Demo \u00B7 sample data, nothing is saved \u00B7 viewing as:</span>'+btn("signin","Sign-in")+btn("kid","Kid")+btn("parent","Parent")+btn("teacher","Teacher")+btn("admin","Adrienne")+'</div>';
}
function envsDemoGo(role){ if(!envsDemo()) return; _envs.demoRole=role; _envs.kidMode=""; envsParentClose(); _envs.role=role==="signin"?"kid":role; _envs.view=(role==="teacher"||role==="admin")?"grid":role==="parent"?"home":"study"; try{ if(typeof envcDemoRole==="function") envcDemoRole(role); }catch(e){} envsRe(); try{ window.scrollTo(0,0); }catch(e){} }
function envsDemoSigninHtml(){ return '<div style="background:#0f2e1f;border-radius:18px;padding:18px;display:flex;justify-content:center">'+envsAuthHtml().replace('onsubmit="return envsAuthSubmit(event)"','onsubmit="return envsDemoFake(event)"').replace('onsubmit="return envsKidSubmit(event)"','onsubmit="return envsDemoFake(event)"').replace('onclick="envsForgot()"','onclick="envsToast(\'demo: would send a password-reset email\')"')+'</div><div class="envs-muted" style="text-align:center;padding:10px">This is the first screen every family sees. In the demo, pick a role above instead of signing in.</div>'; }
function envsDemoFake(ev){ if(ev&&ev.preventDefault) ev.preventDefault(); envsToast("demo: would sign in \u2014 pick a role at the top instead"); return false; }
// the sample class: one class, eight invented students (no real names), varied progress, three teams. Dates are relative to today.
function envsDemoData(now){
  now=now!=null?now:Date.now(); const D=n=>envsDayKey(now-n*86400000), dash=k=>k.slice(0,4)+"-"+k.slice(4,6)+"-"+k.slice(6,8);
  const stns=envsStations(); const deckRow=(total,mastered,learning,held,c,m,last)=>({total,new:Math.max(0,total-mastered-learning),waiting:0,learning:Math.round(learning/2),active:learning-Math.round(learning/2),mastered,held,correct:c,miss:m,acc:(c+m)?Math.round(c/(c+m)*100):null,c14:Math.round(c/3),m14:Math.round(m/3),acc14:(c+m)?Math.round(c/(c+m)*100):null,last});
  const mk=(name,fid,kid,app,prof)=>{ const byDeck={}; stns.forEach(st=>st.decks.forEach(d=>{ const p=prof.st[st.id]; byDeck[d.key]=p?deckRow(d.n,Math.round(d.n*p.m),Math.round(d.n*p.l),false,p.c,p.x,D(prof.idle)):deckRow(d.n,0,0,true,0,0,null); }));
    const days={}; for(let i=prof.idle;i<prof.idle+prof.studyDays*2;i+=prof.every) days[D(i)]={n:prof.perDay,c:Math.round(prof.perDay*prof.acc),m:prof.perDay-Math.round(prof.perDay*prof.acc),secs:prof.perDay*18};
    const tests={}; Object.keys(prof.tests||{}).forEach(s=>{ const t=prof.tests[s]; const o={}; if(t.pre) o.pre={right:t.pre[0],n:t.pre[1],date:dash(D(prof.idle+20))}; if(t.post) o.post={best:{right:t.post[0],n:t.post[1],date:dash(D(prof.idle+1))}}; if(t.grad) o.graduated={date:dash(D(prof.idle+1)),right:t.post[0],n:t.post[1]}; tests[s]=o; });
    const weak={}; if(prof.weak) weak[prof.weak[0]]=prof.weak[1].map((n,i)=>({n,m:3-i,d:1,t:"daily"}));
    return {sid:fid+"_"+kid,meta:{familyId:fid,kid,name,at:now-prof.idle*86400000},class:"ms-science-2026",app,logins:{parent:"uid_p_"+kid,kid:app==="howe"?null:"uid_k_"+kid},summary:{unitVer:1,at:now-prof.idle*86400000,byDeck,byConcept:{},streak:{days:prof.idle<=1?prof.streak:0,last:D(prof.idle)},weak,days,tests}}; };
  const S=[
    mk("Maya R.","ramirez","maya","micro",{idle:0,streak:6,studyDays:7,every:1,perDay:18,acc:.9,st:{general:{m:.95,l:.05,c:60,x:5},forestry:{m:1,l:0,c:210,x:22},soils:{m:.35,l:.3,c:70,x:20},aquatics:{m:0,l:0,c:0,x:0}},tests:{forestry:{pre:[9,15],post:[14,15],grad:true},soils:{pre:[8,15]}},weak:["Soils and Land Use · Terms",["Soil horizon","Loam","Percolation"]]}),
    mk("Jonah T.","tran","jonah","micro",{idle:9,streak:0,studyDays:4,every:1,perDay:12,acc:.7,st:{general:{m:.6,l:.3,c:30,x:12},forestry:{m:.3,l:.4,c:60,x:28}},tests:{forestry:{pre:[7,15]}},weak:["Forestry · Terms",["Cambium","Dichotomous key","Crown class"]]}),
    mk("Priya S.","shah","priya","micro",{idle:1,streak:2,studyDays:2,every:1,perDay:10,acc:.8,st:{general:{m:.2,l:.4,c:12,x:3},forestry:{m:.05,l:.3,c:14,x:4}},tests:{forestry:{pre:[6,15]}}}),
    mk("Caleb W.","walker","caleb","micro",{idle:0,streak:4,studyDays:8,every:1,perDay:16,acc:.85,st:{general:{m:.9,l:.1,c:50,x:6},forestry:{m:.7,l:.2,c:150,x:30},soils:{m:.8,l:.2,c:140,x:18},aquatics:{m:.1,l:.3,c:20,x:6}},tests:{forestry:{pre:[10,15],post:[12,15]},soils:{pre:[9,15],post:[14,15],grad:true}}}),
    mk("Nora B.","bennett","nora","micro",{idle:2,streak:0,studyDays:6,every:2,perDay:14,acc:.75,st:{general:{m:.8,l:.2,c:40,x:10},forestry:{m:.55,l:.3,c:120,x:40},soils:{m:.2,l:.3,c:40,x:15}},tests:{forestry:{pre:[8,15],post:[11,15]},soils:{pre:[7,15]}},weak:["Forestry · ID",["Loblolly pine","Shortleaf pine","Sweetgum"]]}),
    mk("Theo K.","kim","theo","micro",{idle:3,streak:0,studyDays:3,every:1,perDay:8,acc:.65,st:{general:{m:.3,l:.3,c:16,x:9},forestry:{m:.15,l:.35,c:30,x:16}},tests:{}}),
    mk("Avery M.","morales","avery","micro",{idle:0,streak:11,studyDays:11,every:1,perDay:20,acc:.88,st:{general:{m:1,l:0,c:62,x:6},forestry:{m:.85,l:.1,c:220,x:30},soils:{m:.5,l:.3,c:90,x:14}},tests:{forestry:{pre:[11,15],post:[13,15]},soils:{pre:[10,15]}}}),
    mk("Eli P.","howe-demo","eli","howe",{idle:1,streak:3,studyDays:9,every:1,perDay:15,acc:.82,st:{general:{m:.9,l:.1,c:48,x:8},forestry:{m:.6,l:.3,c:130,x:28},soils:{m:.3,l:.4,c:50,x:12}},tests:{forestry:{pre:[9,15],post:[12,15]},soils:{pre:[8,15]}}})];
  const students={}; S.forEach(s=>{ students[s.sid]=s; });
  const teams={ramirez_maya:"Oaks",tran_jonah:"Pines",shah_priya:"Maples",walker_caleb:"Oaks",bennett_nora:"Pines",kim_theo:"Maples",morales_avery:"Pines","howe-demo_eli":"Oaks"};
  const cls={name:"MS Science 2026-27",teacher:"uid_teacher_demo",year:ENVS_SEASON,area:8,division:"ms",students:Object.fromEntries(Object.keys(students).map(k=>[k,true])),teams};
  const release={all:{forestry:{openedAt:now-40*86400000,by:"uid_teacher_demo"},soils:{openedAt:now-12*86400000,by:"uid_teacher_demo"},general:{openedAt:now-44*86400000,by:"uid_teacher_demo"}},students:{walker_caleb:{"Aquatic Ecology · Terms":{openedAt:now-3*86400000,by:"uid_teacher_demo"}},ramirez_maya:{aquatics:{openedAt:now-86400000,by:"uid_teacher_demo"}}}};   // 📝 Maya: Aquatics sent out yesterday, check-in not taken yet (her cards wait)
  const scores={ramirez_maya:{forestry:{test:22,testMax:25,testDate:dash(D(30)),presentation:5,presMax:5,by:"uid_teacher_demo",ts:now}},walker_caleb:{forestry:{test:19,testMax:25,testDate:dash(D(30)),by:"uid_teacher_demo",ts:now},soils:{test:23,testMax:25,testDate:dash(D(2)),by:"uid_teacher_demo",ts:now}},morales_avery:{forestry:{test:24,testMax:25,testDate:dash(D(30)),presentation:4,presMax:5,by:"uid_teacher_demo",ts:now}}};
  const cards={"Forestry · Terms":{c1:{name:"Mast year",def:"A year when trees produce an unusually large crop of seeds or nuts.",concept:"Forest Ecology",by:"uid_teacher_demo",ts:now-20*86400000},c2:{name:"Snag",def:"A standing dead tree, important as wildlife habitat.",concept:"Forest Ecology",by:"uid_teacher_demo",ts:now-20*86400000},c3:{name:"Duff",def:"The partly decomposed layer of leaves and needles on the forest floor.",concept:"Forest Ecology",by:"uid_teacher_demo",ts:now-19*86400000,retired:true}}};
  if(typeof cpAheadDemoSeed==="function") cpAheadDemoSeed(students,now);   // 🚀 CPAHEAD: Maya and Avery have learned cards ahead (the bonus and 🚀 on the boards)
  const boards=envsBoardsCompute(students,teams,now);
  return {cid:"ms-science-2026",cls,students,release,scores,cards,who:"both",teams,boards,lockRaw:{locked:false,at:now-60*86400000,by:"uid_admin_demo"},teachers:{uid_teacher_demo:{name:"Ms. Brittany",classes:{"ms-science-2026":true}}},admins:{uid_admin_demo:true}};
}
// the kid the demo studies as: Maya R. — a small in-memory Envirothon deck so the REAL study screen, games and scores run on it.
// 📝 The check-in rules (2026-10-28) on her: Forestry graduated; Soils check-in taken, the final still closed ("Final opens when every
// core card is learned · 2 of 4"); Aquatics sent out with the check-in NOT taken — its cards wait ("Take the check-in first — then the
// cards open"). The real check-in questions come from the demo file's inline HoweEnvirothon.tests (make_demo.js).
function envsDemoStart(){
  const data=envsDemoData(); _envs.demoData=data;
  const role=_envs.demoRole==="signin"?"kid":_envs.demoRole; _envs.role=role; _envs.view=(role==="teacher"||role==="admin")?"grid":role==="parent"?"home":"study";
  _envs.familyId="ramirez"; _envs.kid="maya"; _envs.sid="ramirez_maya"; _envs.cid=data.cid; _envs.cls=data.cls; _envs.boards=data.boards; _envs.who=data.who; _envs.email="parent@example.com"; _envs.lockRaw=data.lockRaw; _envs.lock=envsLockState(data.lockRaw); _envs.bankDemo=27;
  envsCss(); try{ tab=ENVS_TAB; document.body.classList.add("env-site","env-demo"); }catch(e){}
  try{ KID_NAME.maya="Maya"; KID_COLOR.maya="#2d6a4f"; }catch(e){}
  try{ _haMastReady=true; _haUnitsReady=true; }catch(e){}
  try{ envsDemoSeedKid(data); }catch(e){ try{ console.error("[HA] ENVSITE demo seed",e); }catch(x){} }
  try{ if(typeof cpFinalDemoSeed==="function") cpFinalDemoSeed(); }catch(e){}   // 📝 CPFINAL: Maya's Soils at 3 of 4 core cards learned
  try{ if(typeof envcDemoStart==="function") envcDemoStart(data); }catch(e){}
  try{ if(typeof cpWatchDemoSeed==="function") cpWatchDemoSeed(data); }catch(e){}   // 🧠 CPWATCH: Jonah's parent hasn't drilled for 4 study days
  try{ if(typeof cpMockDemoSeed==="function") cpMockDemoSeed(data); }catch(e){}   // ⏱️ CPMOCK: the sample class has Mock run on; two teams already ran a mock
  try{ haAuthHide(); }catch(e){}
  try{ if(typeof cpSkillDemoSeed==="function") cpSkillDemoSeed(data); }catch(e){}   // 🧩 CPSKILL: the sample skill (biotic index) + the classmates' skill counts
  try{ if(typeof cpGearDemoSeed==="function") cpGearDemoSeed(data); }catch(e){}   // 🧰 CPITEMGEAR: the unit's gear skills + demo drawings + the classmates' counts
  try{ if(typeof cpIdDemoSeed==="function") cpIdDemoSeed(data); }catch(e){}   // 🌲 CPITEMID: the unit's ID-by-part skills (trees by part, animal signs, stream bugs) + the classmates' counts
  try{ masteryKid="maya"; }catch(e){}
  try{ if(typeof cpBioticDemoSeed==="function") cpBioticDemoSeed(data); }catch(e){}   // 🪲 CPITEMBIOTIC: the unit's real biotic-index worksheet takes the sample's place
  try{ if(typeof cpLabelDemoSeed==="function") cpLabelDemoSeed(data); }catch(e){}   // 🏷 CPITEMLABEL: the unit's diagrams to label (soil profile, lake zones, groundwater, fish, tree layers) + the classmates' counts
  try{ if(typeof cpScaleDemoSeed==="function") cpScaleDemoSeed(data); }catch(e){}   // 📏 CPITEMSCALE: the unit's Biltmore stick (diameter and height) + the classmates' Forestry counts
  try{ if(typeof cpTriangleDemoSeed==="function") cpTriangleDemoSeed(data); }catch(e){}   // 📐 CPITEMTRIANGLE: the unit's texture triangle + the classmates' Soils counts
}
function envsDemoSeedKid(data){
  const kid="maya", DK="Forestry · Terms", DF="Forestry · Facts", DI="Forestry · ID", DS="Soils and Land Use · Terms", DA="Aquatic Ecology · Terms", now=Date.now();
  const cards=(k,rows)=>rows.map((r,i)=>({name:r[0],def:r[1],group:r[2],stage:1,order:i+1,core:r[3]!==false,_dk:k}));
  const terms=cards(DK,[["Cambium","The thin layer of living cells between the bark and the wood that produces new growth.","Tree Biology"],["Crown","The upper part of a tree: its branches and leaves.","Tree Biology"],["Silviculture","The practice of growing and tending forests to meet set goals.","Forest Management"],["Snag","A standing dead tree.","Forest Ecology"],["Dichotomous key","A tool that identifies a tree by a series of paired choices.","Measurement and Identification"],["DBH","Diameter at breast height: a tree's trunk diameter measured 4.5 feet above the ground.","Measurement and Identification"],["Xylem","The wood tissue that carries water up from the roots.","Tree Biology"],["Succession","The gradual change in a forest's species over time.","Forest Ecology"]]);
  const facts=cards(DF,[["How high above the ground is DBH measured?","4.5 feet","Measurement and Identification"],["Which layer of a tree carries sugars down from the leaves?","Phloem","Tree Biology"],["Which NC pine has needles in bundles of three, 6–9 inches long?","Loblolly pine","Measurement and Identification"],["A forest's canopy is formed by which trees?","The dominant and codominant trees","Forest Ecology"]]);
  const ids=cards(DI,[["Loblolly pine · needles","Needles in bundles of three, 6–9 inches.","Pines"],["Sweetgum · leaf","Star-shaped leaf with five points.","Hardwoods"],["White oak · leaf","Rounded lobes, no bristle tips.","Oaks"]]);
  const soils=cards(DS,[["Soil horizon","A layer of soil, roughly parallel to the surface, that differs from the layers above and below it.","Soil Formation"],["Loam","A soil with a balanced mix of sand, silt and clay.","Soil Properties"],["Parent material","The rock or sediment a soil forms from.","Soil Formation"],["Percolation","Water moving down through the soil.","Soil and Water"],["Humus","Dark, well-decayed organic matter in soil.","Soil Properties",false]]);
  const aqua=cards(DA,[["Watershed","The land area that drains into one stream, river or lake.","Watersheds"],["Riffle","A shallow, fast stretch of a stream where water runs over rocks.","Streams"],["Eutrophication","Too many nutrients in water, feeding algae that use up its oxygen.","Water Quality"]]);
  const decks=(typeof ENV_DECKS!=="undefined"?ENV_DECKS:[]).map(d=>({key:d[0],mode:d[1],introCap:3,groupBy:"group",flipFace:"name",bankOnly:true,stage:d[2],station:d[3],kind:d[4],n:d[5],cards:d[0]===DK?terms:d[0]===DF?facts:d[0]===DI?ids:d[0]===DS?soils:d[0]===DA?aqua:[]}));
  const stages=(typeof ENV_STAGES!=="undefined"?ENV_STAGES:[]).map(s=>({n:s[0],label:s[1],weeklyFrom:0}));
  unitStudies[(typeof ENV_UNIT_ID!=="undefined")?ENV_UNIT_ID:"nc_envirothon"]={id:"nc_envirothon",starter:"nc_envirothon",starterVer:1,title:"NC Envirothon",emoji:"\u{1F33F}",cardsInCode:false,enrolled:{[kid]:true},kidStage:{[kid]:{stage:1,ts:now}},stages,decks};
  const it=(id,subj,c,tier,status,extra)=>Object.assign({id,subject:subj,type:"envirothon",prompt:c.name,answer:c.def,status,tier,tally_dots:0,consecutive_correct:1,drop_count:0,cycle:1,next_due:0,review_mode:"flip"},extra||{});
  masteryData[kid]=[it("m_cambium",DK,terms[0],"weekly","active"),it("m_crown",DK,terms[1],"monthly","active"),it("m_silvi",DK,terms[2],"daily","introduction"),it("m_snag",DK,terms[3],"bi_weekly","active"),it("m_dbh_f",DF,facts[0],"weekly","active"),it("m_phloem",DF,facts[1],"daily","active"),it("m_lob",DI,ids[0],"weekly","active"),
    it("m_horizon",DS,soils[0],"bi_weekly","active"),it("m_loam",DS,soils[1],"monthly","active"),it("m_parent",DS,soils[2],"weekly","active"),it("m_humus",DS,soils[4],"daily","introduction")];   // Soils: 2 of 4 core learned (Percolation not started)
  const hold={}; decks.forEach(d=>{ if(["forestry","general","soils","aquatics"].indexOf(d.station)<0) hold[d.key]=true; });
  masteryData[kid+"_settings"]={cat_hold:hold,cat_modes:Object.fromEntries(decks.map(d=>[d.key,d.mode])),cat_intro_max:Object.fromEntries(decks.map(d=>[d.key,3])),definitions:{}};
  masteryData[kid+"_custom_items"]=terms.concat(facts,ids,soils,aqua).map(c=>({cat:c._dk,name:c.name,def:c.def}));
  masteryData[kid+"_sessions"]={envirothon:(typeof envSessionRecord==="function")?envSessionRecord(unitStudies.nc_envirothon):{name:"Envirothon",emoji:"\u{1F33F}",kind:"deck",decks:decks.map(d=>d.key),who:"solo",newPerDay:5,passes:2,order:"bank",pattern:["pick","ideas","type"]}};
  const dk=n=>envsDayKey(now-n*86400000);
  masteryData.studyLog={[kid]:{envirothon:{[dk(1)]:{date:dk(1),total:12,correct:10,miss:2,secs:220,items:[{id:"m_cambium",name:"Cambium",deck:DK,result:"c"},{id:"m_crown",name:"Crown",deck:DK,result:"c"},{id:"m_snag",name:"Snag",deck:DK,result:"m"},{id:"m_dbh_f",name:facts[0].name,deck:DF,result:"c"}]},[dk(2)]:{date:dk(2),total:10,correct:7,miss:3,secs:200,items:[{id:"m_cambium",name:"Cambium",deck:DK,result:"m"},{id:"m_lob",name:ids[0].name,deck:DI,result:"c"}]},[dk(3)]:{date:dk(3),total:8,correct:8,miss:0,secs:150,items:[{id:"m_crown",name:"Crown",deck:DK,result:"c"}]}}}};
  masteryData[kid+"_tests"]={forestry:{pre:{form:"2026",date:"2026-09-15",n:15,right:9,secs:900,ts:now-40*86400000},post:{t1:{right:14,n:15,ts:now-86400000},best:{right:14,n:15,date:"2026-10-27"}},graduated:{date:"2026-10-27",right:14,n:15}},soils:{pre:{form:"2026",date:"2026-10-13",n:15,right:8,secs:800,ts:now-14*86400000}}};
  try{ bank[kid]={adjustments:{d1:{amount:27,note:"\u{1F33F} Envirothon study sittings",ts:now}}}; }catch(e){}
  if(typeof cpCoreDemoSeed==="function") cpCoreDemoSeed(kid,DK);   // ⭐ CPCORE: two non-core cards ahead of the sample deck's core ones
}
// CPKIDMODE_START — 🧒 SHARED-DEVICE KID MODE (2026-11-10). Her decisions: the parent page gets "Go to <kid>" top right, one per kid on the
// login; a tap opens that kid's own page (the study screen, 🎮 Games, Scores… exactly what the kid's code opens) with the parent still signed in
// underneath, and the device remembers it (HA_LS envs_mode = "kid:<kid>"), so a reload or a reopened tab comes back as the kid. "👩 Parent" in
// kid view asks for the parent's password (Firebase reauthenticate — never stored, never logged) and only then clears the mode. With two or more
// kids, kid view also shows "Go to <the other>" without the password — on by default; the parent can turn it off on her page (logins/<uid>/kidSwap,
// absent = on). A VIEW on a parent login: _envs.role stays "parent" for every write and rule (flags, calendar, review records name the parent's
// login), _envs.kidMode = the kid. Real kid logins (role kid), teachers and admins never see any of it. Demo: switches in memory, no Firebase.
const ENVS_MODE_KEY="envs_mode";
// PURE: "kid:<kid>" ↔ kid ("" for anything else)
function envsModeFmt(kid){ kid=String(kid==null?"":kid); return /^[a-z0-9_-]{1,32}$/.test(kid)?"kid:"+kid:""; }
function envsModeParse(v){ const m=/^kid:([a-z0-9_-]{1,32})$/.exec(String(v==null?"":v)); return m?m[1]:""; }
// PURE: logins/<uid>/kidSwap → on? (absent = on; only an explicit false turns it off)
function envsKidSwapOn(v){ return v!==false; }
// the gate (envsApplyLogin): the device's mode, when it names one of this PARENT login's kids; anything else is ignored
function envsModeApply(L){
  _envs.kidMode=""; _envs.kidSwap=envsKidSwapOn(L&&L.kidSwap);
  if(_envs.role!=="parent") return "";
  let k=""; try{ k=envsModeParse((typeof HA_LS!=="undefined")?HA_LS.getItem(ENVS_MODE_KEY):null); }catch(e){}
  if(k&&_envs.kids.indexOf(k)>=0){ _envs.kid=k; _envs.kidMode=k; }
  return _envs.kidMode;
}
// the role the PAGE is drawn for: kid view on a parent login → "kid"; everything else its login's role
function envsPageRole(st){ st=st||_envs; return (st.role==="parent"&&st.kidMode)?"kid":st.role; }
function envsModeKids(st){ st=st||_envs; return (st.kids&&st.kids.length)?st.kids.slice():(st.kid?[st.kid]:[]); }
// PURE: the top-right buttons for an _envs state → [{go:kid}…, {parent:true}]. Parent page: Go to <each kid>. Kid view: 👩 Parent, plus
// Go to <each other kid> when the login has two or more and kidSwap is on. Any other role: none.
function envsModeBtns(st){
  st=st||_envs; if(st.role!=="parent") return [];
  const ks=envsModeKids(st);
  if(!st.kidMode) return ks.map(k=>({go:k}));
  const out=[]; if(envsKidSwapOn(st.kidSwap)&&ks.length>1) ks.forEach(k=>{ if(k!==st.kidMode) out.push({go:k}); });
  out.push({parent:true}); return out;
}
function envsModeBtnsHtml(){
  if(!envSiteOn()) return ""; const b=envsModeBtns(); if(!b.length) return "";
  return '<div class="envs-mode">'+b.map(x=>x.parent?'<button onclick="envsParentAsk()" aria-label="Back to the parent page">\u{1F469} Parent</button>':'<button onclick="envsGoKid(\''+envsEsc(x.go)+'\')">Go to '+envsEsc(envsKidName(x.go))+'</button>').join("")+'</div>';
}
// Go to <kid>: from the parent page, or kid → kid while kidSwap is on. Live: remembered on the device (+ the CPSIBLINGS pick), then a fresh
// boot (every listener is keyed on one sid). Demo: in memory.
function envsGoKid(kid){
  if(!envSiteOn()||_envs.role!=="parent"||envsModeKids().indexOf(kid)<0) return false;
  if(_envs.kidMode&&(kid===_envs.kidMode||!envsKidSwapOn(_envs.kidSwap))) return false;   // already there · or every switch goes through the password
  if(envsDemo()){ _envs.kidMode=kid; _envs.kid=kid; _envs.view="study"; envsRe(); try{ window.scrollTo(0,0); }catch(e){} return true; }
  try{ if(typeof HA_LS!=="undefined"){ HA_LS.setItem(ENVS_MODE_KEY,envsModeFmt(kid)); HA_LS.setItem("envs_kid_pick",kid); } }catch(e){}
  try{ sessionStorage.setItem("ha_reload_why","envsite-kidmode"); }catch(e){}
  try{ location.reload(); }catch(e){} return true;
}
// back to the parent page (only after the password): the device forgets the kid view
function envsLeaveKidMode(){
  envsParentClose();
  if(envsDemo()){ _envs.kidMode=""; _envs.view="home"; envsRe(); try{ window.scrollTo(0,0); }catch(e){} return true; }
  try{ if(typeof HA_LS!=="undefined") HA_LS.removeItem(ENVS_MODE_KEY); }catch(e){}
  try{ sessionStorage.setItem("ha_reload_why","envsite-kidmode"); }catch(e){}
  try{ location.reload(); }catch(e){} return true;
}
// PURE: a failed reauthenticate → the one line the kid-view prompt shows
function envsReauthMsg(err){ const c=String((err&&err.code)||""); return /too-many/.test(c)?"Too many tries — wait a minute.":/network/.test(c)?"No connection — try again.":"That’s not it"; }
// 👩 Parent: the password checked by Firebase against the signed-in parent (reauthenticateWithCredential). Resolves true → the parent page;
// false → stays in the kid's view with the toast. The password is only passed to Firebase — never kept, written or logged.
function envsParentCheck(pw){
  if(!envSiteOn()||_envs.role!=="parent"||!_envs.kidMode) return Promise.resolve(false);
  pw=String(pw==null?"":pw); if(!pw){ envsToast("That’s not it"); return Promise.resolve(false); }
  if(envsDemo()){ envsToast("demo: would check the parent’s password"); envsLeaveKidMode(); return Promise.resolve(true); }
  let u=null, cred=null;
  try{ u=firebase.auth().currentUser; if(u&&u.email&&typeof u.reauthenticateWithCredential==="function") cred=firebase.auth.EmailAuthProvider.credential(u.email,pw); }catch(e){ cred=null; }
  pw="";
  if(!cred){ envsToast("Couldn’t check the password — try again."); return Promise.resolve(false); }
  return Promise.resolve().then(()=>u.reauthenticateWithCredential(cred)).then(()=>{ envsLeaveKidMode(); return true; },e=>{ envsToast(envsReauthMsg(e)); return false; });
}
// the small in-app prompt: its own layer on <body> (a repaint of the page never wipes what is being typed)
function envsParentAsk(){
  if(!envSiteOn()||_envs.role!=="parent"||!_envs.kidMode||typeof document==="undefined") return false;
  envsCss(); let o=document.getElementById("envs-pw");
  if(!o){ o=document.createElement("div"); o.id="envs-pw"; o.style.cssText="position:fixed;inset:0;z-index:100000;background:rgba(15,46,31,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:'DM Sans',system-ui,sans-serif"; document.body.appendChild(o); }
  o.style.display="flex"; o.innerHTML=envsParentAskHtml(); _envs.pwOpen=true;
  setTimeout(function(){ const i=document.getElementById("envs-pw-in"); if(i) try{ i.focus(); }catch(e){} },50);
  return true;
}
function envsParentAskHtml(){
  return '<div style="background:#fff;border-radius:18px;padding:20px;width:100%;max-width:340px;box-shadow:0 20px 60px rgba(0,0,0,.3)">'+
    '<div style="font-weight:900;font-size:17px;margin-bottom:4px">\u{1F469} Back to the parent page</div><div class="envs-muted" style="margin-bottom:10px">Type the parent’s password.</div>'+
    '<form onsubmit="return envsParentSubmit(event)" autocomplete="off"><input id="envs-pw-in" class="envs-in" type="password" name="envs-parent-check" autocomplete="off" placeholder="password" style="margin-bottom:10px">'+
    '<div class="envs-row"><button type="button" class="envs-btn sec" onclick="envsParentClose()">Cancel</button><button id="envs-pw-b" type="submit" class="envs-btn" style="flex:1">Go to the parent page</button></div></form></div>';
}
function envsParentClose(){ _envs.pwOpen=false; try{ const o=(typeof document!=="undefined")?document.getElementById("envs-pw"):null; if(o){ o.innerHTML=""; o.style.display="none"; } }catch(e){} }
function envsParentSubmit(ev){
  if(ev&&ev.preventDefault) ev.preventDefault();
  const i=document.getElementById("envs-pw-in"), b=document.getElementById("envs-pw-b"), pw=(i&&i.value)||""; if(i) i.value=""; if(b) b.disabled=true;
  envsParentCheck(pw).then(ok=>{ if(!ok){ if(b) b.disabled=false; const j=document.getElementById("envs-pw-in"); if(j) try{ j.focus(); }catch(e){} } });
  return false;
}
// the parent page, under the kid tabs: "Kids can switch to each other without my password · On / Off" (two or more kids only)
function envsKidSwapHtml(){
  if(!envSiteOn()||_envs.role!=="parent"||_envs.kidMode||envsModeKids().length<2) return "";
  const on=envsKidSwapOn(_envs.kidSwap);
  return '<div class="envs-swap">Kids can switch to each other without my password · <button class="'+(on?'on':'')+'" aria-pressed="'+on+'" onclick="envsSetKidSwap(true)">On</button><button class="'+(on?'':'on')+'" aria-pressed="'+(!on)+'" onclick="envsSetKidSwap(false)">Off</button></div>';
}
// the switch → logins/<uid>/kidSwap (her own row; SITE_RULES CPKIDMODE). Demo: the write is shown, not made.
function envsSetKidSwap(on){
  on=!!on; if(!envSiteOn()||_envs.role!=="parent"||_envs.kidMode||envsKidSwapOn(_envs.kidSwap)===on) return false;
  if(!envsDemo()&&!_envs.uid) return false;
  const was=_envs.kidSwap; _envs.kidSwap=on; envsRe();
  envsWrite("logins/"+(_envs.uid||"uid_p_"+_envs.kid)+"/kidSwap",on)
    .then(()=>{ if(!envsDemo()) envsToast(on?"Kids can switch to each other without your password":"Every switch now asks for your password"); })
    .catch(e=>{ _envs.kidSwap=was; envsToast("Couldn’t save: "+((e&&e.message)||e)); envsRe(); });
  return true;
}
// CPKIDMODE_END
// ENVSITE_END
// ENVCONSOLE_START — 👩‍🏫 THE TEACHER'S PART of the Envirothon site (and Adrienne's admin part): DESIGN_envirothon_console_2026-10-27.md §5 as
// re-cut by its ✅ DECISIONS (her 8.3 the teacher creates both logins · 8.4 roster = first name + last initial · 8.5 station by default, each
// deck openable · 8.6 she edits and retires her own cards, Adrienne anything · 8.8 ranking only, no saved teams · the boards · who drills ·
// the master lock). Mobile-first: she may use a phone in class. INERT unless ENVSITE's envEdition() says "envirothon" and the login's role is
// teacher or admin — every function here returns at once otherwise.
//   · Reads (the shared instance): teachers/<uid> · classes/<cid> · ONE students/<sid> listener per student (rules are evaluated at the path
//     listened to) · release/<cid> · scores/<cid> · teacherCards/<cid> · settings/whoDrills/<cid> · release/locked; admin: classes, teachers.
//   · Writes, every one targeted, through envsWrite (demo → "would write" toast, dry run → nothing):
//       + Student: the parent user is CREATED on a SECONDARY named Firebase app ("envcreate") so the teacher's own session is never signed out,
//         then a password-reset email is sent (nobody types a password); the kid user = k-<code>@<projectId>.kid with the password derived
//         from the code (ENVSITE's envsKidPw; the code is printed once, never stored); then ONE multi-path update:
//         logins/<uidP>, logins/<uidK>, students/<sid>/{meta,class,app,logins}, classes/<cid>/students/<sid>. Nothing else (test_env_site.js).
//       send out: release/<cid>/all/<deckKey> (or students/<sid>/<deckKey>) = {openedAt, by}, one multi-path update per Send; Undo removes a key.
//       📝 open the final (her ask 2026-10-28): release/<cid>/final/all/<station> (or final/students/<sid>/<station>) = {date, ts, by} — the
//         same record Mom's early open saves; the family's app copies it to mastery/<kid>_tests/<station>/postOpen (ENVTEST envtFinalApply).
//         One set from the student page, one multi-path update from Send out. No Undo: once a kid's app has it, the final stays open.
//       scores/<cid>/<sid>/<station> · teacherCards/<cid>/<deckKey>/<id> (own: add / edit / retire) · classes/<cid>/teams/<sid> (a name she types)
//       · boards/<cid> (the public boards, recomputed when she opens Boards) · settings/whoDrills/<cid> · admin only: release/locked, teachers/<uid>.
const ENVC_APP="envcreate";
const _envc={sdb:null,cid:"",classes:{},cls:null,students:{},release:null,scores:{},cards:{},who:"",teachers:{},subs:{},view:"grid",sel:null,send:{station:"",decks:null,to:"class",picked:{}},edit:null,err:"",busy:"",newLogin:null,boardsHash:"",lockRaw:undefined,demo:null};
function envcOn(){ return typeof envSiteOn==="function"&&envSiteOn()&&(_envs.role==="teacher"||_envs.role==="admin"); }
function envcAdmin(){ return envcOn()&&_envs.role==="admin"; }
function envcEsc(v){ return envsEsc(v); } function envcJ(s){ return envsJ(s); }
function envcVal(s){ return (s&&typeof s.val==="function")?s.val():null; }
function envcRe(){ try{ renderAll(); }catch(e){} }   // a tap paints now; a listener arrival combines (envcSub)
function envcSub(key,path,fn){ if(_envc.subs[key]||!_envc.sdb) return; const r=_envc.sdb.ref(path), f=s=>{ try{ fn(envcVal(s)); }catch(e){ _envc.err=String((e&&e.message)||e); } try{ if(typeof renderAllSoon==="function") renderAllSoon(); else renderAll(); }catch(e){} }; r.on("value",f); _envc.subs[key]={r,f}; }
function envcUnsub(key){ const s=_envc.subs[key]; if(!s) return; try{ s.r.off("value",s.f); }catch(e){} delete _envc.subs[key]; }
// ── live start: the teacher's class (or every class for Adrienne), then the listeners
function envConsoleStart(){
  if(!envcOn()||envsDemo()) return false;
  try{ _envc.sdb=firebase.database(); }catch(e){ _envc.err=String((e&&e.message)||e); return false; }
  envcSub("locked","release/locked",v=>{ _envc.lockRaw=v; _envs.lockRaw=v; _envs.lock=envsLockState(v); });
  if(typeof envClsConsoleStart==="function") envClsConsoleStart();   // ⚙️ ENVCLASSSET: Adrienne's locks (settings/locks)
  if(envcAdmin()){ envcSub("classes","classes",v=>{ _envc.classes=v||{}; if(!_envc.cid){ const k=Object.keys(_envc.classes)[0]; if(k) envcPickClass(k); } }); envcSub("teachers","teachers",v=>{ _envc.teachers=v||{}; }); }
  else { _envc.sdb.ref("teachers/"+_envs.uid).once("value",s=>{ const t=envcVal(s)||{}; const ks=Object.keys(t.classes||{}); _envc.classes={}; ks.forEach(k=>{ _envc.classes[k]={name:k}; }); if(ks.length) envcPickClass(_envs.cid&&ks.indexOf(_envs.cid)>=0?_envs.cid:ks[0]); else { _envc.err="No class is set up for this teacher yet — ask Adrienne."; envcRe(); } }); }
  return true;
}
function envcPickClass(cid){
  if(!cid) return; if(_envc.cid&&_envc.cid!==cid){ Object.keys(_envc.subs).forEach(k=>{ if(k!=="locked"&&k!=="locks"&&k!=="classes"&&k!=="teachers") envcUnsub(k); }); _envc.students={}; _envc.cls=null; _envc.release=null; _envc.scores={}; _envc.cards={}; _envc.sel=null; }
  _envc.cid=cid; _envs.cid=cid; if(envsDemo()) { envcRe(); return; }
  envcSub("cls","classes/"+cid,v=>{ _envc.cls=v; _envs.cls=v; envcSyncStudents(); if(typeof cpClassIn==="function") cpClassIn(); });   // 🏫 CPCLASS: the class's lock date
  envcSub("rel","release/"+cid,v=>{ _envc.release=v||{}; });
  envcSub("sc","scores/"+cid,v=>{ _envc.scores=v||{}; });
  envcSub("tc","teacherCards/"+cid,v=>{ _envc.cards=v||{}; });
  envcSub("who","settings/whoDrills/"+cid,v=>{ _envc.who=v||""; _envs.who=_envc.who; });
}
// one listener per student in the class; a student removed from the class loses hers
function envcSyncStudents(){
  const want=Object.keys((_envc.cls&&_envc.cls.students)||{});
  want.forEach(sid=>envcSub("st:"+sid,"students/"+sid,v=>{ _envc.students[sid]=v||{}; }));
  Object.keys(_envc.subs).filter(k=>k.indexOf("st:")===0).forEach(k=>{ const sid=k.slice(3); if(want.indexOf(sid)<0){ envcUnsub(k); delete _envc.students[sid]; } });
}
function envcDemoStart(data){ _envc.demo=data; _envc.cid=data.cid; _envc.classes={[data.cid]:data.cls}; _envc.cls=data.cls; _envc.students=data.students; _envc.release=data.release; _envc.scores=data.scores; _envc.cards=data.cards; _envc.who=data.who; _envc.teachers=data.teachers; _envc.lockRaw=data.lockRaw; _envc.view="grid"; _envs.uid=_envs.role==="admin"?"uid_admin_demo":"uid_teacher_demo"; if(typeof envClsDemoStart==="function") envClsDemoStart(data); if(typeof cpDemoStart==="function") cpDemoStart(data); if(typeof cpuDemoStart==="function") cpuDemoStart(data); }   // 🏫 CPCLASS: the sample class's look · 📦 CPUNIT: its unit attached and published
function envcDemoRole(role){ if(_envc.demo){ _envs.uid=role==="admin"?"uid_admin_demo":"uid_teacher_demo"; _envs.email=role==="admin"?"adrienne@example.com":"teacher@example.com"; } }
function envcWrite(path,val,op){ if(!envcOn()) return Promise.reject(new Error("not the console")); return envsWrite(path,val,op).then(r=>{ if(!envsDemo()) envsToast("Saved"); return r; }).catch(e=>{ _envc.err=String((e&&e.message)||e); envsToast("Couldn’t save: "+_envc.err); envcRe(); throw e; }); }
function envcMulti(obj,label){ if(!envcOn()) return Promise.reject(new Error("not the console")); if(envsDemo()){ _envs.writes.push({op:"update",path:"/",val:obj}); envsToast("demo: would write "+Object.keys(obj).join(", ")); return Promise.resolve(obj); } if(typeof _dryRun==="function"&&_dryRun()) return Promise.resolve(obj); return _envc.sdb.ref().update(obj).then(()=>{ envsToast(label||"Saved"); return obj; }).catch(e=>{ _envc.err=String((e&&e.message)||e); envsToast("Couldn’t save: "+_envc.err); envcRe(); throw e; }); }
function envcStudents(){ const ids=Object.keys((_envc.cls&&_envc.cls.students)||{}); return ids.map(sid=>Object.assign({sid},_envc.students[sid]||{})).sort((a,b)=>String((a.meta&&a.meta.name)||a.sid).localeCompare(String((b.meta&&b.meta.name)||b.sid))); }
function envcName(s){ return (s&&s.meta&&s.meta.name)||(s&&s.sid)||"?"; }
function envcApp(s){ return (s&&s.app)||((s&&s.meta&&s.meta.familyId==="howe")?"howe":"micro"); }
function envcView(v,sel){ _envc.view=v; _envc.sel=sel||null; _envc.edit=null; envcRe(); try{ window.scrollTo(0,0); }catch(e){} }
function envcReleasedKeys(sid){ const R=_envc.release||{}, out={}; Object.keys(R.all||{}).forEach(k=>{ if(R.all[k]) out[k]=1; }); Object.keys((R.students&&R.students[sid])||{}).forEach(k=>{ if(R.students[sid][k]) out[k]=1; }); return out; }
function envcStationOpen(sid,st){ const k=envcReleasedKeys(sid); if(k[st.id]) return "all"; const n=st.decks.filter(d=>k[d.key]).length; return n===st.decks.length?"all":n?"some":""; }
// 📝 the final: the record that opened it for this student (whole class first), or null; the stations that have one (not General)
function envcFinalRec(sid,station){ const F=((_envc.release||{}).final)||{}; return ((F.all||{})[station])||((((F.students||{})[sid])||{})[station])||null; }
function envcFinalStations(){ return envsStations().filter(st=>st.id!=="general"); }
function envcToday(now){ const d=new Date(now); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
// PURE: the multi-path update "Open the final" writes — whole class → final/all/<station>; picked students → final/students/<sid>/<station>
function envcFinalUpdate(cid,station,targets,by,now){ const o={}, rec={date:envcToday(now),ts:now,by};
  if(!cid||!station) return o; if(!targets||!targets.length) o["release/"+cid+"/final/all/"+station]=rec; else targets.forEach(sid=>{ o["release/"+cid+"/final/students/"+sid+"/"+station]=rec; });
  return o; }
function envcFinalMem(o){ _envc.release=_envc.release||{}; const F=_envc.release.final=_envc.release.final||{}, mine={};
  Object.keys(o).forEach(p=>{ const a=p.split("/"); if(a[3]==="all"){ F.all=F.all||{}; F.all[a[4]]=o[p]; mine[a[4]]=o[p]; } else { F.students=F.students||{}; F.students[a[4]]=F.students[a[4]]||{}; F.students[a[4]][a[5]]=o[p]; if(a[4]===_envs.sid) mine[a[5]]=o[p]; } });
  // demo only: the open reaches the demo's own kid at once (live, her family's app reads it back — ENVTEST envtFinalAttach)
  if(envsDemo()&&_envs.kid&&Object.keys(mine).length&&typeof envtFinalApply==="function") envtFinalApply(_envs.kid,mine); }
function envcFinalFor(sid,station){ if(!envcOn()||!sid||!envsStation(station)||station==="general") return; const o=envcFinalUpdate(_envc.cid,station,[sid],_envs.uid,Date.now()), path=Object.keys(o)[0];
  envcWrite(path,o[path]).then(()=>{ if(envsDemo()) envcFinalMem(o); envcRe(); }).catch(()=>{}); }
function envcFinalOut(){ if(!envcOn()) return; const sd=_envc.send, st=envsStation(sd.station); if(!st||st.id==="general") return; const targets=sd.to==="pick"?Object.keys(sd.picked).filter(k=>sd.picked[k]):null; if(sd.to==="pick"&&!targets.length){ envsToast("Pick at least one student."); return; }
  const o=envcFinalUpdate(_envc.cid,st.id,targets,_envs.uid,Date.now());
  envcMulti(o,"Final opened \u00B7 "+st.label).then(()=>{ if(envsDemo()) envcFinalMem(o); envcRe(); }).catch(()=>{}); }
// ── the page
function envConsoleHtml(){
  if(!envcOn()) return "";
  const v=_envc.view, cls=_envc.cls, admin=envcAdmin();
  let h=(typeof cpTopHtml==="function")?cpTopHtml(admin?"admin":"teacher"):'<div class="envs-top" style="background:#14532d"><div class="t"><div class="envs-brand">Howe <span>Academy</span></div>\u{1F33F} '+envcEsc((cls&&cls.name)||"Envirothon")+(admin?' · Adrienne':'')+'</div><div class="envs-muted" style="color:#d1fae5">'+envcStudents().length+' students</div><button onclick="envcView(\'settings\')" aria-label="Settings">⚙️</button></div>';   // 🏫 CPCLASS: the class's emoji, title and color
  const chips=[["grid","\u{1F4CB} Class"],["roster","\u{1F465} Roster"],["send","\u{1F4E4} Send out"],["strong","\u{1F4AA} Who is strong where"],["cards","\u{1F0CF} Teacher cards"],["boards","\u{1F3C6} Boards"],["who","\u{1F469}‍\u{1F3EB} Who drills"],["classset","\u2699\uFE0F Class settings"]]; if(admin) chips.push(["admin","\u{1F511} Admin"]);
  if(typeof cpPaceChips==="function") cpPaceChips(chips);   // 📅 CPPACE: 📅 Pace beside 📋 Class
  if(typeof cpSetupHtml==="function") chips.splice(chips.findIndex(x=>x[0]==="classset"),0,["setup","\u{1F3EB} Class setup"]);   // 🏫 CPCLASS
  if(admin&&typeof cpuUnitsHtml==="function") chips.splice(chips.findIndex(x=>x[0]==="admin"),0,["units","\u{1F4E6} Units"]);   // 📦 CPUNIT
  if(typeof cpdtChips==="function") cpdtChips(chips);   // 🧠 CPDRILLTEACHER: 🧠 Drill right after 📋 Class
  if(typeof cpmkChips==="function") cpmkChips(chips);   // ⏱️ CPMOCK: ⏱️ Mock before 🏆 Boards, while the class has Mock run on
  if(typeof cpcsChips==="function") cpcsChips(chips);   // 📚 CPCARDSSEE: 📚 Cards before 🃏 Teacher cards
  if(typeof cpceChips==="function") cpceChips(chips);   // 📚 CPCARDSEDIT: 🃏 Teacher cards moved into 📚 Cards (the old chip comes out)
  if(typeof cpctChips==="function") cpctChips(chips);   // 📝 CPTESTS: 📝 Tests right after 📚 Cards
  if(typeof cpmChips==="function") cpmChips(chips);   // ⚠️ CPMISSED: ⚠️ Most missed right after 📝 Tests
  if(typeof cpwkChips==="function") cpwkChips(chips);   // 📊 CPWEEK: 📊 Weekly right after ⚠️ Most missed
  if(typeof cptpChips==="function") cptpChips(chips);   // 🏅 CPTEAMPICK: 🏅 Team picks right after 📊 Weekly (only with the class's 🏆 Teams feature)
  if(typeof cpflChips==="function") cpflChips(chips);   // 🚩 CPFLAG: 🚩 Flags (with the open count) before 👥 Roster
  h+='<div class="envs-chips">'+chips.map(x=>'<button class="'+((v===x[0]||(v==="student"&&x[0]==="grid"))?'on':'')+'" onclick="envcView(\''+x[0]+'\')">'+x[1]+'</button>').join("")+'</div>';
  if(_envc.err) h+='<div class="envs-card" style="border-color:#fecaca;color:#b91c1c;font-size:12.5px">'+envcEsc(_envc.err)+' <a href="javascript:void(0)" onclick="_envc.err=\'\';envcRe()" style="color:#b91c1c">dismiss</a></div>';
  if(_envs.lock&&_envs.lock.locked) h+='<div class="envs-card" style="border-color:#fcd34d;background:#fffbeb;font-size:12.5px">\u{1F512} The season is closed for teachers and families; you see this because you are the admin.</div>';
  // CPFIRSTCLASS: a brand-new site has no class yet, and + Class lives on the 🔑 Admin view — so the admin's Admin view draws without one,
  // and the waiting card tells the admin where to go instead of "Loading…" forever (first live sign-in on howe-envirothon, 2026-11-08)
  if(!cls&&!envsDemo()&&!(admin&&v==="admin")) return h+'<div class="envs-card envs-muted">'+((admin&&_envc.classes&&!Object.keys(_envc.classes).length)?'No class yet — open \u{1F511} Admin and add the first one with + Class.':'Loading the class…')+'</div>';
  if(typeof cpLockBarHtml==="function") h+=cpLockBarHtml(v);   // 🔒 CPLOCKS: Adrienne's lock switch, or the teacher's "🔒 Set by …" line, right before Cards, Tests, Pace, Units, Class setup
  if(v==="student"&&_envc.sel) h+=envcStudentHtml(_envc.sel);
  else if(v==="pace"&&typeof cpPaceHtml==="function") h+=cpPaceHtml();   // 📅 CPPACE: the pace target
  else if(v==="tdrill"&&typeof cpdtHtml==="function") h+=cpdtHtml();   // 🧠 CPDRILLTEACHER: the teacher's drill (pick a student, ✓ / ✗, next student)
  else if(v==="cpmock"&&typeof cpmkHtml==="function") h+=cpmkHtml();   // ⏱️ CPMOCK: the timed team mock (start it for a team) and the results by team
  else if(v==="roster") h+=envcRosterHtml();
  else if(v==="send") h+=envcSendHtml();
  else if(v==="strong") h+=envcStrongHtml();
  else if(v==="cpcards"&&typeof cpcsHtml==="function") h+=cpcsHtml();   // 📚 CPCARDSSEE
  else if(v==="cptests"&&typeof cpctHtml==="function") h+=cpctHtml();   // 📝 CPTESTS
  else if(v==="cpmissed"&&typeof cpmHtml==="function") h+=cpmHtml();   // ⚠️ CPMISSED: the most missed questions and cards, the struggle, the review list
  else if(v==="cpweek"&&typeof cpwkHtml==="function") h+=cpwkHtml();   // 📊 CPWEEK: the weekly study summary, a synopsis per student, 🖨 print
  else if(v==="cpteams"&&typeof cptpHtml==="function") h+=cptpHtml();   // 🏅 CPTEAMPICK: the criteria side by side, weights, 🙋 attendance — a ranking only
  else if(v==="cpflags"&&typeof cpflHtml==="function") h+=cpflHtml();   // 🚩 CPFLAG: the teacher's (and Adrienne's) flags
  else if(v==="cards") h+=envcCardsHtml();
  else if(v==="boards") h+=envcBoardsHtml();
  else if(v==="who") h+=envcWhoHtml();
  else if(v==="setup"&&typeof cpSetupHtml==="function") h+=cpSetupHtml();   // 🏫 CPCLASS
  else if(v==="classset"&&typeof envClsPanelHtml==="function") h+=envClsPanelHtml();   // ⚙️ ENVCLASSSET
  else if(v==="units"&&admin&&typeof cpuUnitsHtml==="function") h+=cpuUnitsHtml();   // 📦 CPUNIT
  else if(v==="admin"&&admin) h+=envcAdminHtml();
  else if(v==="settings") h+=(typeof envsSettingsHtml==="function")?envsSettingsHtml():"";   // 🪶 LAZYSPLIT: CPCLASS (classes.js)
  else h+=envcGridHtml();
  return h;
}
// §5.1 the class grid: students × stations; cell = % mastered of the station's released decks · accuracy (14 d); – = not sent out; ⚠ = no study in 7 days
function envcGridHtml(){
  const stns=envsStations(), S=envcStudents();
  let h='<div class="envs-card" style="padding:8px 6px;overflow-x:auto"><table class="envs-grid"><thead><tr><th>Student</th>'+stns.map(s=>'<th class="c">'+((typeof cpSecHeadHtml==="function")?cpSecHeadHtml(s):envcEsc(s.short))+'</th>').join("")+'<th class="c">streak</th><th>last</th></tr>';   // 🎚 CPSECTIONS: each section's name opens its On · Review only · Off panel
  h+='<tr><th></th>'+stns.map(s=>{ const o=envcStationOpen("",s); return '<th class="c" style="font-weight:600">'+(o==="all"?'● open':o==="some"?'◐ part':'○')+'</th>'; }).join("")+'<th></th><th></th></tr></thead><tbody>';
  if(!S.length) h+='<tr><td colspan="'+(stns.length+3)+'" class="envs-muted">No students yet — add them on the Roster.</td></tr>';
  S.forEach(s=>{ const sm=s.summary||null, ago=envsDaysAgo(sm&&sm.streak&&sm.streak.last);
    h+='<tr><td><a href="javascript:void(0)" onclick="envcView(\'student\',\''+envcJ(s.sid)+'\')" style="font-weight:800;color:#14532d">'+envcEsc(envcName(s))+'</a>'+(envcApp(s)==="howe"?' <span class="envs-chip" style="font-size:10px">Howe app</span>':'')+(ago!=null&&ago>7?' <span title="no study in '+ago+' days">⚠</span>':'')+((typeof cpPaceGridChip==="function")?cpPaceGridChip(s):'')+((typeof cpWatchGridChip==="function")?cpWatchGridChip(s):'')+((typeof cpAheadGridChip==="function")?cpAheadGridChip(s):'')+'</td>';   // 📅 CPPACE: on pace under the name · 🧠 CPWATCH: ⚠ when the parent's drill isn't run · 🚀 CPAHEAD: studying ahead / cards learned ahead this week
    stns.forEach(st=>{ const x=envsStationStat(sm,st); const open=envcStationOpen(s.sid,st); let cell;
      if(!x.released&&!open) cell='<span class="envs-muted">–</span>'; else if(!x.released) cell='<span class="envs-muted" title="sent out, nothing studied yet">0%</span>'; else cell='<b>'+x.pct+'%</b>'+(x.acc14!=null?' <span class="envs-muted">·'+x.acc14+'%</span>':'');
      if(x.grad) cell+=' \u{1F393}'; else if(x.post) cell+=' <span class="envs-muted" title="final">\u{1F4DD}</span>';
      if(typeof cpSecCellTag==="function") cell+=cpSecCellTag(s.sid,st.id);   // 🎚 CPSECTIONS: ↻ review only · ⏸ paused
      if(typeof cpSpecCellTag==="function") cell+=cpSpecCellTag(s.sid,st.id);   // 🏅 CPSPECIALIST: 🏅 in the student's specialist column
      h+='<td class="c">'+cell+'</td>'; });
    h+='<td class="c">'+((sm&&sm.streak&&sm.streak.days)||0)+' d</td><td>'+envcEsc(envsWhen(sm&&sm.streak&&sm.streak.last))+'</td></tr>'; });
  h+='</tbody></table></div><div class="envs-muted" style="padding:0 4px">cell = % mastered of the station’s released decks · % right in the last 14 days · \u{1F4DD} final taken · \u{1F393} graduated · – not sent out · ⚠ no study in 7 days. Tap a name for the student page.</div>';
  if(typeof cpSecGridHtml==="function") h+=cpSecGridHtml();   // 🎚 CPSECTIONS: a tapped section's On · Review only · Off for everyone or picked students
  return h;
}
// §5.2 the student page: concept rows + weakest + pre/post + the teacher's scores + open a station for this student
function envcStudentHtml(sid){
  const s=Object.assign({sid},_envc.students[sid]||{}), sm=s.summary||null, stns=envsStations(), cid=_envc.cid;
  let h='<div class="envs-card"><div class="envs-row"><button class="envs-btn sec" onclick="envcView(\'grid\')">← class</button><div style="flex:1"><div class="envs-h2" style="margin:0">'+envcEsc(envcName(s))+(envcApp(s)==="howe"?' · Howe Academy app':'')+'</div><div class="envs-muted">'+(sm?'content v'+(sm.unitVer||1)+' · streak '+((sm.streak&&sm.streak.days)||0)+' d · '+Object.keys(sm.days||{}).filter(k=>envsDaysAgo(k)<30).length+' study days this month · last mirrored '+envcEsc(envsWhen(sm.at?envsDayKey(sm.at):null)):'no study mirrored yet')+'</div></div></div></div>';
  if(typeof cpWatchStudentHtml==="function") h+=cpWatchStudentHtml(sid);   // 🧠 CPWATCH: ⚠ the parent's drill not run, with Leave it
  if(typeof cpMoveBackStudentHtml==="function") h+=cpMoveBackStudentHtml(sid);   // ↩ CPMOVEBACK: the teacher moves the reviews back (or lets the parent choose again)
  h+='<div class="envs-card"><div class="envs-h2">Stations</div>'+envsStationRowsHtml(sm,{weak:true})+'</div>';
  if(typeof cpSecStudentHtml==="function") h+=cpSecStudentHtml(sid);   // 🎚 CPSECTIONS: On · Review only · Off per section
  if(typeof cpSpecStudentHtml==="function") h+=cpSpecStudentHtml(sid);   // 🏅 CPSPECIALIST: the 🏅 Specialist card
  if(typeof cpAheadStudentHtml==="function") h+=cpAheadStudentHtml(sid);   // 🚀 CPAHEAD: 🚀 Getting ahead — sections studied early, cards learned ahead, this student’s switch
  if(typeof cpdtStudentHtml==="function") h+=cpdtStudentHtml(sid);   // 🧠 CPDRILLTEACHER: 🧠 Drill this student now
  const held=stns.filter(st=>envcStationOpen(sid,st)!=="all");
  h+='<div class="envs-card"><div class="envs-h2">\u{1F4DD} The final for '+envcEsc(envcName(s))+'</div><div class="envs-row">'+envcFinalStations().map(st=>{ const t=(sm&&sm.tests&&sm.tests[st.id])||{}, f=envcFinalRec(sid,st.id);
    if(t.graduated) return '<span class="envs-chip">'+envcEsc(st.short)+' \u{1F393}</span>'; if(f) return '<span class="envs-chip">'+envcEsc(st.short)+' \u00B7 final open'+(f.date?' '+envcEsc(f.date):'')+'</span>';
    return '<button class="envs-btn sec" onclick="envcFinalFor(\''+envcJ(sid)+'\',\''+st.id+'\')">\u{1F4DD} Open the final \u00B7 '+envcEsc(st.short)+'</button>'; }).join("")+'</div><div class="envs-muted" style="margin-top:4px">'+envcEsc((typeof cpFinalOpensText==="function"&&cpFinalOpensText(""))||"It opens on its own once every core card is learned")+'; this opens it now. Writes release/'+envcEsc(cid)+'/final/students/'+envcEsc(sid)+'/&lt;station&gt;. The whole class opens from Send out.</div></div>';   // 📝 CPFINAL: the class's share (cpFinalOpensText)
  if(typeof cprStudentHtml==="function") h+=cprStudentHtml(sid);   // 📊 CPRESULTS: 📝 Answers, the check-in and the final side by side
  if(held.length) h+='<div class="envs-card"><div class="envs-h2">Open a station for '+envcEsc(envcName(s))+' only</div><div class="envs-row">'+held.map(st=>'<button class="envs-btn sec" onclick="envcOpenFor(\''+envcJ(sid)+'\',\''+st.id+'\')">\u{1F513} '+envcEsc(st.short)+'</button>').join("")+'</div><div class="envs-muted" style="margin-top:4px">Writes release/'+envcEsc(cid)+'/students/'+envcEsc(sid)+'/&lt;station&gt;. The whole class opens from Send out.</div></div>';
  if(_envc.newLogin&&_envc.newLogin.sid&&_envc.newLogin.sid.split("_")[0]===(s.meta&&s.meta.familyId)) h+=envcCodeCardHtml(_envc.newLogin);   // CPSIBLINGS: the new sibling's card, shown once
  h+=envcSiblingHtml(sid);   // CPSIBLINGS: + A brother or sister (same parent login)
  if(typeof envClsStudentHtml==="function") h+=envClsStudentHtml(sid);   // ⚙️ ENVCLASSSET: this student's own settings
  if(typeof cpCalStudentHtml==="function") h+=cpCalStudentHtml(sid);   // 📅 CPCAL: this student's study days
  const SC=(_envc.scores&&_envc.scores[sid])||{};
  h+='<div class="envs-card"><div class="envs-h2">Your in-class scores</div><div class="envs-muted" style="margin-bottom:6px">Next to the app’s numbers: the station test and presentation you graded.</div>';
  stns.filter(st=>st.id!=="general").forEach(st=>{ const r=SC[st.id]||{}; const ed=_envc.edit&&_envc.edit.kind==="score"&&_envc.edit.sid===sid&&_envc.edit.st===st.id;
    h+='<div style="padding:6px 0;border-top:1px solid #f1efe9"><div class="envs-row"><div style="font-weight:800;width:90px">'+envcEsc(st.short)+'</div>';
    if(ed) h+='<input id="envc-sc-t" class="envs-in" style="width:64px" inputmode="numeric" placeholder="test" value="'+envcEsc(r.test!=null?r.test:"")+'"><span>/</span><input id="envc-sc-tm" class="envs-in" style="width:56px" inputmode="numeric" placeholder="of" value="'+envcEsc(r.testMax!=null?r.testMax:25)+'"><input id="envc-sc-d" class="envs-in" style="width:140px" type="date" value="'+envcEsc(r.testDate||"")+'"><input id="envc-sc-p" class="envs-in" style="width:64px" inputmode="numeric" placeholder="pres." value="'+envcEsc(r.presentation!=null?r.presentation:"")+'"><span>/</span><input id="envc-sc-pm" class="envs-in" style="width:56px" inputmode="numeric" value="'+envcEsc(r.presMax!=null?r.presMax:5)+'"><input id="envc-sc-n" class="envs-in" style="flex:1;min-width:120px" placeholder="note" value="'+envcEsc(r.note||"")+'"><button class="envs-btn" onclick="envcScoreSave(\''+envcJ(sid)+'\',\''+st.id+'\')">Save</button><button class="envs-btn sec" onclick="_envc.edit=null;envcRe()">Cancel</button>';
    else h+='<div style="flex:1;font-size:12.5px">'+(r.test!=null?'test '+r.test+'/'+(r.testMax||25)+(r.testDate?' ('+envcEsc(r.testDate)+')':''):'<span class="envs-muted">no test yet</span>')+(r.presentation!=null?' · presentation '+r.presentation+'/'+(r.presMax||5):'')+(r.note?' · '+envcEsc(r.note):'')+'</div><button class="envs-btn sec" onclick="_envc.edit={kind:\'score\',sid:\''+envcJ(sid)+'\',st:\''+st.id+'\'};envcRe()">edit</button>';
    h+='</div></div>'; });
  h+='</div>';
  return h;
}
function envcOpenFor(sid,station){ if(!envcOn()) return; const rec={openedAt:Date.now(),by:_envs.uid}; envcWrite("release/"+_envc.cid+"/students/"+sid+"/"+station,rec).then(()=>{ if(envsDemo()){ _envc.release=_envc.release||{}; _envc.release.students=_envc.release.students||{}; _envc.release.students[sid]=Object.assign({},_envc.release.students[sid]||{},{[station]:rec}); envcRe(); } }).catch(()=>{}); }
function envcScoreSave(sid,station){ if(!envcOn()) return; const g=id=>((document.getElementById(id)||{}).value||"").trim(), num=v=>v===""?null:(isNaN(+v)?null:+v);
  const rec={test:num(g("envc-sc-t")),testMax:num(g("envc-sc-tm"))||25,testDate:g("envc-sc-d")||null,presentation:num(g("envc-sc-p")),presMax:num(g("envc-sc-pm"))||5,note:g("envc-sc-n")||null,by:_envs.uid,ts:Date.now()};
  Object.keys(rec).forEach(k=>{ if(rec[k]===null) delete rec[k]; });
  envcWrite("scores/"+_envc.cid+"/"+sid+"/"+station,rec).then(()=>{ if(envsDemo()){ _envc.scores[sid]=Object.assign({},_envc.scores[sid]||{},{[station]:rec}); } _envc.edit=null; envcRe(); }).catch(()=>{}); }
// §5.6 roster + the two logins per family
function envcRosterHtml(){
  const S=envcStudents(); let h='<div class="envs-card" style="padding:8px 6px;overflow-x:auto"><table class="envs-grid"><thead><tr><th>Student</th><th>app</th><th>parent login</th><th>student login</th><th>progress</th><th>team</th><th></th></tr></thead><tbody>';
  if(!S.length) h+='<tr><td colspan="7" class="envs-muted">Nobody yet.</td></tr>';
  S.forEach(s=>{ const L=s.logins||{}, howe=envcApp(s)==="howe"; const miss=[]; if(!howe&&!L.parent) miss.push("parent login"); if(!howe&&!L.kid) miss.push("student code"); if(!s.summary) miss.push("nothing mirrored yet");
    h+='<tr><td><a href="javascript:void(0)" onclick="envcView(\'student\',\''+envcJ(s.sid)+'\')" style="font-weight:800;color:#14532d">'+envcEsc(envcName(s))+'</a><div class="envs-muted">'+envcEsc(s.sid)+'</div></td><td>'+(howe?'<span class="envs-chip">Howe app</span>':'micro')+'</td><td>'+(howe?'<span class="envs-muted">family’s own</span>':L.parent?'✓':'<span style="color:#b45309">✗ missing</span>')+'</td><td>'+(howe?'<span class="envs-muted">family’s own</span>':L.kid?'✓ <button class="envs-btn sec" style="min-height:30px;padding:0 8px;font-size:11px" onclick="envcNewCode(\''+envcJ(s.sid)+'\')">new code</button>':'<span style="color:#b45309">✗ missing</span>')+'</td><td>'+(s.summary?'✓ '+envcEsc(envsWhen(envsDayKey(s.summary.at||0))):'<span class="envs-muted">–</span>')+'</td><td>'+envcEsc((_envc.cls&&_envc.cls.teams&&_envc.cls.teams[s.sid])||"")+'</td><td>'+(miss.length?'<span class="envs-muted">'+envcEsc(miss.join(", "))+'</span>':'')+'</td></tr>'; });
  h+='</tbody></table></div>';
  if(_envc.newLogin) h+=envcCodeCardHtml(_envc.newLogin);
  h+='<div class="envs-card"><div class="envs-h2">+ Student</div><div class="envs-muted" style="margin-bottom:8px">First name and last initial only (the roster never shows an email). The parent gets an email to set their own password; the student gets a code on a card.</div>'+
    '<div class="envs-row"><input id="envc-first" class="envs-in" style="flex:2;min-width:120px" placeholder="First name" autocapitalize="words"><input id="envc-last" class="envs-in" style="width:70px" placeholder="L." maxlength="2"><input id="envc-email" class="envs-in" style="flex:3;min-width:180px" type="email" placeholder="Parent’s email" autocomplete="off"><button class="envs-btn" onclick="envcAddStudent()" '+(_envc.busy?'disabled':'')+'>'+(_envc.busy?envcEsc(_envc.busy):'Add')+'</button></div></div>';
  h+='<div class="envs-card"><div class="envs-h2">+ A student who already has Howe Academy at home</div><div class="envs-muted" style="margin-bottom:8px">Adrienne gives you the student id (it looks like <b>family_kid</b>); the family’s own app mirrors the study here, no login needed.</div><div class="envs-row"><input id="envc-howe-sid" class="envs-in" style="flex:1;min-width:160px" placeholder="student id from Adrienne"><input id="envc-howe-name" class="envs-in" style="flex:1;min-width:120px" placeholder="First name L."><button class="envs-btn sec" onclick="envcAddHowe()">Add</button></div></div>';
  return h;
}
function envcSlug(s){ return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"").slice(0,16); }
// PURE: the record set "+ Student" writes, and nothing else
function envcAddStudentPaths(f){
  const cid=f.cid, fid=f.familyId, kid=f.kid, sid=fid+"_"+kid, now=f.now||Date.now(), o={};
  o["logins/"+f.uidParent]={role:"parent",familyId:fid,kid,cid,name:f.name};
  o["logins/"+f.uidKid]={role:"kid",familyId:fid,kid,cid,name:f.name};
  o["students/"+sid+"/meta"]={familyId:fid,kid,name:f.name,at:now};
  o["students/"+sid+"/class"]=cid; o["students/"+sid+"/app"]="micro";
  o["students/"+sid+"/logins"]={parent:f.uidParent,kid:f.uidKid,parentAt:now,kidAt:now};
  o["classes/"+cid+"/students/"+sid]=true;
  return o;
}
// CPSIBLINGS (2026-11-10) PURE: + Sibling writes a kid under the SAME family and the SAME parent login as an existing student (no new parent
// user, no email): the kid's login row, the parent's kids list (every kid of the family, the new one included), the student record, the class seat.
function envcAddSiblingPaths(f){
  const cid=f.cid, fid=f.familyId, kid=f.kid, sid=fid+"_"+kid, now=f.now||Date.now(), o={};
  o["logins/"+f.uidKid]={role:"kid",familyId:fid,kid,cid,name:f.name};
  (f.kids||[]).concat([kid]).filter((k,i,a)=>k&&a.indexOf(k)===i).forEach(k=>{ o["logins/"+f.uidParent+"/kids/"+k]=true; });
  o["students/"+sid+"/meta"]={familyId:fid,kid,name:f.name,at:now};
  o["students/"+sid+"/class"]=cid; o["students/"+sid+"/app"]="micro";
  o["students/"+sid+"/logins"]={parent:f.uidParent,kid:f.uidKid,parentAt:now,kidAt:now};
  o["classes/"+cid+"/students/"+sid]=true;
  return o;
}
function envcSiblingHtml(sid){
  const s=_envc.students[sid]; if(!s||!s.meta||envcApp(s)==="howe"||!(s.logins&&s.logins.parent)) return "";
  const fid=s.meta.familyId, sibs=Object.keys(_envc.students).filter(x=>x!==sid&&x.indexOf(fid+"_")===0).map(x=>envcName(Object.assign({sid:x},_envc.students[x])));
  return '<div class="envs-card"><div class="envs-h2">\u{1F467} + A brother or sister</div><div class="envs-muted" style="margin-bottom:6px">Same parent login as '+envcEsc(envcName(Object.assign({sid},s)))+': the parent sees both kids on one page and can make each one\u2019s card there.'+(sibs.length?' Already here: '+envcEsc(sibs.join(", "))+'.':'')+'</div>'+
    '<div class="envs-row"><input id="envc-sib-first" class="envs-in" style="flex:2;min-width:120px" placeholder="First name" autocapitalize="words"><button class="envs-btn" '+(_envc.busy?'disabled':'')+' onclick="envcAddSibling(\''+envcJ(sid)+'\')">'+(_envc.busy||'+ Sibling')+'</button></div></div>';
}
function envcAddSibling(sid){
  if(!envcOn()||_envc.busy) return; const s=_envc.students[sid]; if(!s||!s.meta||!(s.logins&&s.logins.parent)) return;
  const g=id=>((document.getElementById(id)||{}).value||"").trim(), first=g("envc-sib-first"); if(!first){ envsToast("First name, please."); return; }
  const fid=s.meta.familyId, last=String(s.meta.name||"").trim().split(" ").pop()||"", kid=envcSlug(first), name=first.charAt(0).toUpperCase()+first.slice(1)+(last?" "+last:""), code=envsMakeCode();
  if(!kid){ envsToast("That name needs a letter or two."); return; } if(_envc.students[fid+"_"+kid]){ envsToast(name+" is already on the roster."); return; }
  const kids=Object.keys(_envc.students).filter(x=>x.indexOf(fid+"_")===0).map(x=>x.slice(fid.length+1));
  const base={cid:_envc.cid,familyId:fid,kid,name,kids,uidParent:s.logins.parent,now:Date.now()};
  if(envsDemo()){ const o=envcAddSiblingPaths(Object.assign({uidKid:"uid_k_new"},base)); envcMulti(o).then(()=>{ const nsid=fid+"_"+kid; _envc.newLogin={name,code,sid:nsid,demo:true}; _envc.students[nsid]={meta:o["students/"+nsid+"/meta"],class:_envc.cid,app:"micro",logins:o["students/"+nsid+"/logins"]}; if(_envc.cls&&_envc.cls.students) _envc.cls.students[nsid]=true; envcRe(); }); return; }
  _envc.busy="Creating\u2026"; envcRe(); let sec, uidK;
  Promise.resolve().then(()=>{ sec=envcSecondary(); return sec.auth().createUserWithEmailAndPassword(envsKidEmail(code),envsKidPw(code)); }).then(c=>{ uidK=c.user.uid; return sec.auth().signOut(); })
    .then(()=>envcMulti(envcAddSiblingPaths(Object.assign({uidKid:uidK},base)),"Added "+name))
    .then(()=>{ _envc.newLogin={name,code,sid:fid+"_"+kid}; _envc.busy=""; envcRe(); })
    .catch(e=>{ _envc.busy=""; _envc.err=String((e&&e.message)||e); try{ if(sec) sec.auth().signOut(); }catch(x){} envcRe(); });
}
function envcSecondary(){ const have=(firebase.apps||[]).filter(a=>a&&a.name===ENVC_APP)[0]; return have||firebase.initializeApp(FB_CFG,ENVC_APP); }
function envcRandomPw(){ let s=""; const A="abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; for(let i=0;i<24;i++) s+=A[Math.floor(Math.random()*A.length)]; return s; }
function envcAddStudent(){
  if(!envcOn()||_envc.busy) return; const g=id=>((document.getElementById(id)||{}).value||"").trim();
  const first=g("envc-first"), last=g("envc-last").replace(/[^A-Za-z]/g,"").slice(0,1).toUpperCase(), email=g("envc-email").toLowerCase();
  if(!first||!last){ envsToast("First name and last initial, please."); return; } if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ envsToast("That email doesn’t look right."); return; }
  const name=first.charAt(0).toUpperCase()+first.slice(1)+" "+last+".", kid=envcSlug(first), code=envsMakeCode();
  let fid=envcSlug(first)+"-"+last.toLowerCase(); const taken=Object.keys(_envc.students).some(s=>s.indexOf(fid+"_")===0); if(taken) fid+=String(Date.now()).slice(-3);
  const base={cid:_envc.cid,familyId:fid,kid,name,now:Date.now()};
  if(envsDemo()){ const o=envcAddStudentPaths(Object.assign({uidParent:"uid_p_new",uidKid:"uid_k_new"},base)); envcMulti(o).then(()=>{ _envc.newLogin={name,code,email,sid:fid+"_"+kid,demo:true}; const sid=fid+"_"+kid; _envc.students[sid]={meta:o["students/"+sid+"/meta"],class:_envc.cid,app:"micro",logins:o["students/"+sid+"/logins"]}; _envc.cls.students[sid]=true; envcRe(); }); return; }
  _envc.busy="Creating…"; envcRe();
  let sec, uidP, uidK;
  Promise.resolve().then(()=>{ sec=envcSecondary(); return sec.auth().createUserWithEmailAndPassword(email,envcRandomPw()); })
    .then(c=>{ uidP=c.user.uid; return sec.auth().sendPasswordResetEmail(email); }).then(()=>sec.auth().signOut())
    .then(()=>sec.auth().createUserWithEmailAndPassword(envsKidEmail(code),envsKidPw(code))).then(c=>{ uidK=c.user.uid; return sec.auth().signOut(); })
    .then(()=>envcMulti(envcAddStudentPaths(Object.assign({uidParent:uidP,uidKid:uidK},base)),"Added "+name))
    .then(()=>{ _envc.newLogin={name,code,email,sid:fid+"_"+kid}; _envc.busy=""; envcRe(); })
    .catch(e=>{ _envc.busy=""; _envc.err=(e&&e.code==="auth/email-already-in-use")?"That parent email already has a login here — ask Adrienne to attach it.":String((e&&e.message)||e); try{ if(sec) sec.auth().signOut(); }catch(x){} envcRe(); });
}
// a new student code = a new kid user + a new logins row; the old login simply stops being the one on the card
function envcNewCode(sid){
  if(!envcOn()) return; const s=_envc.students[sid]; if(!s||!s.meta) return; const code=envsMakeCode(), rec={role:"kid",familyId:s.meta.familyId,kid:s.meta.kid,cid:_envc.cid,name:s.meta.name};
  if(envsDemo()){ envcMulti({["logins/uid_k_new"]:rec,["students/"+sid+"/logins/kid"]:"uid_k_new",["students/"+sid+"/logins/kidAt"]:Date.now()}).then(()=>{ _envc.newLogin={name:s.meta.name,code,sid,demo:true}; envcRe(); }); return; }
  _envc.busy="New code…"; envcRe(); let sec,uidK;
  Promise.resolve().then(()=>{ sec=envcSecondary(); return sec.auth().createUserWithEmailAndPassword(envsKidEmail(code),envsKidPw(code)); }).then(c=>{ uidK=c.user.uid; return sec.auth().signOut(); })
    .then(()=>envcMulti({["logins/"+uidK]:rec,["students/"+sid+"/logins/kid"]:uidK,["students/"+sid+"/logins/kidAt"]:Date.now()},"New code made"))
    .then(()=>{ _envc.newLogin={name:s.meta.name,code,sid}; _envc.busy=""; envcRe(); }).catch(e=>{ _envc.busy=""; _envc.err=String((e&&e.message)||e); envcRe(); });
}
function envcAddHowe(){ if(!envcOn()) return; const g=id=>((document.getElementById(id)||{}).value||"").trim(); const sid=g("envc-howe-sid").toLowerCase(), name=g("envc-howe-name"); if(!/^[a-z0-9-]+_[a-z0-9-]+$/.test(sid)){ envsToast("A student id looks like family_kid."); return; }
  // CPHOWEMETA (2026-11-09): meta is validated as a whole (familyId, kid, name, at) — the old meta/name alone was refused by the rules; the family's app rewrites meta at its first sign-in
  const fid=sid.split("_")[0], kid=sid.split("_")[1];
  const o={["classes/"+_envc.cid+"/students/"+sid]:true,["students/"+sid+"/class"]:_envc.cid,["students/"+sid+"/app"]:"howe",["students/"+sid+"/meta"]:{familyId:fid,kid,name:(name||kid).slice(0,40),at:Date.now()}};
  envcMulti(o,"Added").then(()=>{ if(envsDemo()){ _envc.students[sid]={meta:{name:name||sid,familyId:sid.split("_")[0],kid:sid.split("_")[1]},class:_envc.cid,app:"howe"}; _envc.cls.students[sid]=true; envcRe(); } }).catch(()=>{}); }
function envcCodeCardHtml(L){
  return '<div class="envs-card" style="border-color:#86efac;background:#f0fdf4"><div class="envs-row"><div style="flex:1"><div class="envs-h2" style="margin:0">\u{1F39F} '+envcEsc(L.name)+'’s card</div><div class="envs-muted">'+(L.email?'A password-reset email went to '+envcEsc(L.email)+'. ':'')+'Print or copy the code now — it is not kept anywhere.'+(L.demo?' (demo)':'')+'</div></div><button class="envs-btn sec" onclick="envcPrintCard()">\u{1F5A8} Print card</button><button class="envs-btn sec" onclick="_envc.newLogin=null;envcRe()">Done</button></div>'+
    '<div id="envc-code-card" style="margin-top:10px;background:#fff;border:2px dashed #14532d;border-radius:14px;padding:14px;text-align:center"><div style="font-size:12px;color:#14532d;font-weight:800">\u{1F33F} Envirothon · Howe Academy</div><div style="font-size:16px;font-weight:900;margin:4px 0">'+envcEsc(L.name)+'</div><div style="font-size:11px;color:#6b7280">Open the page, tap <b>Students</b>, type your code:</div><div style="font-size:30px;font-weight:900;letter-spacing:.12em;margin:6px 0;font-family:monospace">'+envcEsc(L.code)+'</div><div style="font-size:10.5px;color:#6b7280">'+envcEsc(typeof location!=="undefined"?String(location.origin+location.pathname).replace(/index\.html$/,""):"")+'</div></div></div>';
}
function envcPrintCard(){ try{ const el=document.getElementById("envc-code-card"); if(!el) return; const w=window.open("","_blank","width=420,height=320"); if(!w) return; w.document.write('<html><head><title>Student card</title></head><body style="font-family:DM Sans,system-ui,sans-serif;padding:20px">'+el.outerHTML+'<script>setTimeout(function(){window.print();},200);<\/script></body></html>'); w.document.close(); }catch(e){} }
// §5.3 send out: a station by default, each deck on its own, whole class or picked students, undo
function envcSendHtml(){
  if(typeof cpsdSendHtml==="function"){ const _c=cpsdSendHtml(); if(_c!=null) return _c; }   // 📤 CPSEND: the folded tree (sections → decks + Key Concepts, a state and 📤 on each), the final, 📋 Sent / Scheduled
  const stns=envsStations(), S=envcStudents(), sd=_envc.send; const st=stns.find(x=>x.id===sd.station)||null;
  let h='<div class="envs-card"><div class="envs-h2">Send out a station</div><div class="envs-chips" style="padding-bottom:4px">'+stns.map(x=>'<button class="'+(sd.station===x.id?'on':'')+'" onclick="envcSendPick(\''+x.id+'\')">'+envcEsc(x.short)+'</button>').join("")+'</div>';
  if(st){ const decks=sd.decks||{}; h+='<div class="envs-muted" style="margin:6px 0 4px">decks:</div><div class="envs-row">'+st.decks.map(d=>'<label style="display:flex;gap:6px;align-items:center;font-size:13px;min-height:40px"><input type="checkbox" '+(decks[d.key]!==false?'checked':'')+' onchange="envcSendDeck(\''+envcJ(d.key)+'\',this.checked)"> '+envcEsc(envsDeckShort(d.key))+' <span class="envs-muted">('+d.n+')</span></label>').join("")+'</div>';
    h+='<div class="envs-muted" style="margin:8px 0 4px">to:</div><div class="envs-row"><label style="font-size:13px;min-height:40px;display:flex;align-items:center;gap:6px"><input type="radio" name="envc-to" '+(sd.to==="class"?'checked':'')+' onchange="_envc.send.to=\'class\';envcRe()"> whole class</label><label style="font-size:13px;min-height:40px;display:flex;align-items:center;gap:6px"><input type="radio" name="envc-to" '+(sd.to==="pick"?'checked':'')+' onchange="_envc.send.to=\'pick\';envcRe()"> pick students</label></div>';
    if(sd.to==="pick") h+='<div class="envs-row">'+S.map(s=>'<label style="display:flex;gap:6px;align-items:center;font-size:12.5px;min-height:36px"><input type="checkbox" '+(sd.picked[s.sid]?'checked':'')+' onchange="_envc.send.picked[\''+envcJ(s.sid)+'\']=this.checked"> '+envcEsc(envcName(s))+'</label>').join("")+'</div>';
    h+='<div style="margin-top:10px"><button class="envs-btn" onclick="envcSendOut()">\u{1F4E4} Send out now</button></div>';
    if(st.id!=="general"){ const fa=envcFinalRec("",st.id); h+='<div style="margin-top:10px;padding-top:8px;border-top:1px solid #f1efe9">'+(fa?'<div class="envs-muted">\u{1F4DD} The '+envcEsc(st.short)+' final is open for the whole class'+(fa.date?' since '+envcEsc(fa.date):'')+'.</div>':'<button class="envs-btn sec" onclick="envcFinalOut()">\u{1F4DD} Open the final \u00B7 '+envcEsc(st.short)+'</button><div class="envs-muted" style="margin-top:4px">To the same students as above. '+envcEsc((typeof cpFinalOpensText==="function"&&cpFinalOpensText(st.id))||"It opens on its own once a student has learned every core card")+'; this opens it now.</div>')+'</div>'; } }   // 📝 CPFINAL: the section's share (cpFinalOpensText)
  else h+='<div class="envs-muted">Pick a station.</div>';
  h+='</div>';
  const R=_envc.release||{}; const rows=[];
  Object.keys(R.all||{}).forEach(k=>{ if(R.all[k]) rows.push({k,who:"whole class",path:"release/"+_envc.cid+"/all/"+k,at:R.all[k].openedAt}); });
  Object.keys(R.students||{}).forEach(sid=>Object.keys(R.students[sid]||{}).forEach(k=>{ if(R.students[sid][k]) rows.push({k,who:envcName(Object.assign({sid},_envc.students[sid]||{})),path:"release/"+_envc.cid+"/students/"+sid+"/"+k,at:R.students[sid][k].openedAt}); }));
  rows.sort((a,b)=>(b.at||0)-(a.at||0));
  h+='<div class="envs-card"><div class="envs-h2">Sent</div>'+(rows.length?rows.map(r=>{ const st=envsStation(r.k); return '<div class="envs-row" style="padding:5px 0;border-top:1px solid #f1efe9;font-size:12.5px"><div style="flex:1"><b>'+envcEsc(st?st.label+" (whole station)":r.k)+'</b> · '+envcEsc(r.who)+'<div class="envs-muted">'+(r.at?new Date(r.at).toLocaleDateString():'')+'</div></div><button class="envs-btn sec" style="min-height:34px" onclick="envcUndo(\''+envcJ(r.path)+'\')">Undo</button></div>'; }).join(""):'<div class="envs-muted">Nothing sent out yet.</div>')+'<div class="envs-muted" style="margin-top:6px">Undo stops future opens only — cards a student already has stay (append-only on the kid’s side).</div></div>';
  return h;
}
// ENVSENDTOGGLE (her ask 2026-10-28: "if I click general again, it minimizes and goes back up to like its original spot … it can stay open and
// switch if I go through the different ones"): tapping the open station closes it; tapping another one switches to it, as before.
function envcSendPick(id){ if(_envc.send.station===id){ _envc.send.station=""; _envc.send.decks={}; envcRe(); return; } _envc.send.station=id; _envc.send.decks={}; envcRe(); }
function envcSendDeck(key,on){ _envc.send.decks=_envc.send.decks||{}; _envc.send.decks[key]=!!on; }
// PURE: the multi-path update one Send writes (deck keys under all/ or students/<sid>/)
function envcSendOutUpdate(cid,st,deckOn,targets,by,now){
  const o={}, rec={openedAt:now,by}; const decks=st.decks.filter(d=>!deckOn||deckOn[d.key]!==false);
  if(!decks.length) return o;
  const allDecks=decks.length===st.decks.length;
  const put=prefix=>{ if(allDecks) o[prefix+"/"+st.id]=rec; else decks.forEach(d=>{ o[prefix+"/"+d.key]=rec; }); };
  if(!targets||!targets.length) put("release/"+cid+"/all"); else targets.forEach(sid=>put("release/"+cid+"/students/"+sid));
  return o;
}
function envcSendOut(){ if(!envcOn()) return; const sd=_envc.send, st=envsStation(sd.station); if(!st) return; const targets=sd.to==="pick"?Object.keys(sd.picked).filter(k=>sd.picked[k]):null; if(sd.to==="pick"&&!targets.length){ envsToast("Pick at least one student."); return; }
  const o=envcSendOutUpdate(_envc.cid,st,sd.decks,targets,_envs.uid,Date.now()); if(!Object.keys(o).length){ envsToast("Tick at least one deck."); return; }
  envcMulti(o,"Sent out "+st.label).then(()=>{ if(envsDemo()){ _envc.release=_envc.release||{all:{},students:{}}; Object.keys(o).forEach(p=>{ const parts=p.split("/"); if(parts[2]==="all"){ _envc.release.all=_envc.release.all||{}; _envc.release.all[parts.slice(3).join("/")]=o[p]; } else { _envc.release.students=_envc.release.students||{}; _envc.release.students[parts[3]]=_envc.release.students[parts[3]]||{}; _envc.release.students[parts[3]][parts.slice(4).join("/")]=o[p]; } }); } _envc.send={station:"",decks:null,to:"class",picked:{}}; envcRe(); }).catch(()=>{}); }
function envcUndo(path){ if(!envcOn()) return; envcWrite(path,null,"remove").then(()=>{ if(envsDemo()){ const parts=path.split("/"); if(parts[2]==="all") delete _envc.release.all[parts.slice(3).join("/")]; else if(_envc.release.students&&_envc.release.students[parts[3]]) delete _envc.release.students[parts[3]][parts.slice(4).join("/")]; envcRe(); } }).catch(()=>{}); }
// §5.4 who is strong where — ranking only (her 8.8): app mastery · app accuracy (14 d) · in-class test · presentation, each 0–100, mean of what exists
function envcStrongRank(S,st){
  return S.map(s=>{ const x=envsStationStat(s.summary||null,st), sc=((_envc.scores||{})[s.sid]||{})[st.id]||{}; const parts=[]; if(x.pct!=null) parts.push(x.pct); if(x.acc14!=null) parts.push(x.acc14); const t=(sc.test!=null&&sc.testMax)?Math.round(sc.test/sc.testMax*100):null; if(t!=null) parts.push(t); const p=(sc.presentation!=null&&sc.presMax)?Math.round(sc.presentation/sc.presMax*100):null; if(p!=null) parts.push(p);
    return {sid:s.sid,name:envcName(s),mastery:x.pct,acc:x.acc14,test:t,pres:p,score:parts.length?Math.round(parts.reduce((a,b)=>a+b,0)/parts.length):null}; }).filter(r=>r.score!=null).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
}
function envcStrongHtml(){
  const S=envcStudents(); let h='<div class="envs-card"><div class="envs-h2">Who is strong where</div><div class="envs-muted">Per station, ranked by the plain mean of what exists: app mastery · app accuracy (14 d) · your test · your presentation. Tests are answered as a team — put the strongest student on each station. (Teams are not saved here; name them on Boards.)</div></div>';
  if(typeof cpSpecStrongBarHtml==="function") h+=cpSpecStrongBarHtml();   // 🏅 CPSPECIALIST: the last Make specialist, with Undo
  envsStations().filter(st=>st.id!=="general").forEach(st=>{ const rows=envcStrongRank(S,st);
    h+='<div class="envs-card"><div class="envs-h2">'+envcEsc(st.label)+'</div>'+(rows.length?'<table class="envs-grid"><thead><tr><th>#</th><th>student</th><th class="c">mastery</th><th class="c">acc 14 d</th><th class="c">test</th><th class="c">pres.</th><th class="c">score</th></tr></thead><tbody>'+rows.slice(0,5).map((r,i)=>'<tr><td>'+(i+1)+'</td><td style="font-weight:800">'+envcEsc(r.name)+((typeof cpSpecStrongBtn==="function")?cpSpecStrongBtn(r.sid,st.id):'')+'</td><td class="c">'+(r.mastery!=null?r.mastery+'%':'–')+'</td><td class="c">'+(r.acc!=null?r.acc+'%':'–')+'</td><td class="c">'+(r.test!=null?r.test+'%':'–')+'</td><td class="c">'+(r.pres!=null?r.pres+'%':'–')+'</td><td class="c"><b>'+r.score+'</b></td></tr>').join("")+'</tbody></table>':'<div class="envs-muted">nothing yet</div>')+'</div>'; });   // 🏅 CPSPECIALIST: 🏅 Make specialist beside each ranked student (typeof cpSpecStrongBtn==="function")
  return h;
}
// §5.5 teacher cards: add · edit own · retire own (admin: retire any). A card is {name, def, concept, by, ts, retired?}
function envcCardsHtml(){
  const stns=envsStations(), ed=_envc.edit&&_envc.edit.kind==="card"?_envc.edit:null, nc=_envc.edit&&_envc.edit.kind==="newcard"?_envc.edit:{deck:stns[1]?stns[1].decks[0].key:""};
  const deckOpts=stns.map(st=>st.decks.filter(d=>d.kind==="terms"||d.kind==="facts").map(d=>'<option value="'+envcEsc(d.key)+'" '+(nc.deck===d.key?'selected':'')+'>'+envcEsc(d.key)+'</option>').join("")).join("");
  let h='<div class="envs-card"><div class="envs-h2">+ Teacher card</div><div class="envs-muted" style="margin-bottom:6px">A term and its definition, into one of the unit’s decks. It reaches every student in the class through their app; a student who already has the deck gets it in the next sitting.</div>'+
    '<select id="envc-nc-deck" class="envs-in" style="margin-bottom:6px" onchange="_envc.edit={kind:\'newcard\',deck:this.value}">'+deckOpts+'</select>'+
    '<input id="envc-nc-concept" class="envs-in" style="margin-bottom:6px" placeholder="Key Concept (e.g. Forest Ecology)"><input id="envc-nc-name" class="envs-in" style="margin-bottom:6px" placeholder="Term" maxlength="120"><textarea id="envc-nc-def" class="envs-in" rows="2" placeholder="Definition" maxlength="400" style="margin-bottom:6px"></textarea><button class="envs-btn" onclick="envcCardAdd()">Add card</button></div>';
  const C=_envc.cards||{}; const rows=[]; Object.keys(C).forEach(dk=>Object.keys(C[dk]||{}).forEach(id=>rows.push(Object.assign({dk,id},C[dk][id])))); rows.sort((a,b)=>(b.ts||0)-(a.ts||0));
  h+='<div class="envs-card"><div class="envs-h2">Cards in this class ('+rows.length+')</div>';
  if(!rows.length) h+='<div class="envs-muted">None yet.</div>';
  rows.forEach(r=>{ const mine=r.by===_envs.uid, can=mine||envcAdmin(); const editing=ed&&ed.dk===r.dk&&ed.id===r.id;
    h+='<div style="padding:7px 0;border-top:1px solid #f1efe9;'+(r.retired?'opacity:.55':'')+'">';
    if(editing) h+='<input id="envc-ec-name" class="envs-in" style="margin-bottom:4px" value="'+envcEsc(r.name)+'" maxlength="120"><textarea id="envc-ec-def" class="envs-in" rows="2" maxlength="400">'+envcEsc(r.def)+'</textarea><div class="envs-row" style="margin-top:4px"><button class="envs-btn" onclick="envcCardSave(\''+envcJ(r.dk)+'\',\''+envcJ(r.id)+'\')">Save</button><button class="envs-btn sec" onclick="_envc.edit=null;envcRe()">Cancel</button></div>';
    else h+='<div class="envs-row"><div style="flex:1;font-size:13px"><b>'+envcEsc(r.name)+'</b> — '+envcEsc(r.def)+'<div class="envs-muted">'+envcEsc(r.dk)+(r.concept?' · '+envcEsc(r.concept):'')+' · '+(r.ts?new Date(r.ts).toLocaleDateString():'')+(mine?' · yours':'')+(r.retired?' · <b>retired</b>':'')+(r.edited?' · edited':'')+'</div></div>'+(can&&!r.retired?'<button class="envs-btn sec" style="min-height:34px" onclick="_envc.edit={kind:\'card\',dk:\''+envcJ(r.dk)+'\',id:\''+envcJ(r.id)+'\'};envcRe()">✏️</button><button class="envs-btn red" style="min-height:34px" onclick="envcCardRetire(\''+envcJ(r.dk)+'\',\''+envcJ(r.id)+'\')">retire</button>':'')+'</div>';
    h+='</div>'; });
  h+='</div>';
  return h;
}
function envcCardAdd(){ if(!envcOn()) return; const g=id=>((document.getElementById(id)||{}).value||"").trim(); const dk=g("envc-nc-deck"), name=g("envc-nc-name"), def=g("envc-nc-def"), concept=g("envc-nc-concept");
  if(!dk||!name||!def){ envsToast("Deck, term and definition, please."); return; } if(/[.#$\[\]\/]/.test(name)){ envsToast("A term can’t contain . # $ [ ] or /"); return; }
  const dup=Object.values((_envc.cards||{})[dk]||{}).some(c=>c&&!c.retired&&String(c.name).toLowerCase()===name.toLowerCase()); if(dup){ envsToast("That term is already in this deck."); return; }
  const id="tc"+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36), rec={name,def,by:_envs.uid,ts:Date.now()}; if(concept) rec.concept=concept;
  envcWrite("teacherCards/"+_envc.cid+"/"+dk+"/"+id,rec).then(()=>{ if(envsDemo()){ _envc.cards[dk]=_envc.cards[dk]||{}; _envc.cards[dk][id]=rec; } _envc.edit=null; envcRe(); }).catch(()=>{}); }
function envcCardSave(dk,id){ if(!envcOn()) return; const g=x=>((document.getElementById(x)||{}).value||"").trim(); const name=g("envc-ec-name"), def=g("envc-ec-def"); if(!name||!def) return; const cur=((_envc.cards||{})[dk]||{})[id]; if(!cur||(cur.by!==_envs.uid&&!envcAdmin())) return;
  const upd={name,def,edited:Date.now()}; envcWrite("teacherCards/"+_envc.cid+"/"+dk+"/"+id,upd,"update").then(()=>{ if(envsDemo()) Object.assign(_envc.cards[dk][id],upd); _envc.edit=null; envcRe(); }).catch(()=>{}); }
function envcCardRetire(dk,id){ if(!envcOn()) return; const cur=((_envc.cards||{})[dk]||{})[id]; if(!cur||(cur.by!==_envs.uid&&!envcAdmin())) return; envcWrite("teacherCards/"+_envc.cid+"/"+dk+"/"+id+"/retired",true).then(()=>{ if(envsDemo()) _envc.cards[dk][id].retired=true; envcRe(); }).catch(()=>{}); }
// boards: team names (a text box per student → classes/<cid>/teams/<sid>), then the public boards, published to boards/<cid> for kids and parents
function envcBoards(){ const students={}; envcStudents().forEach(s=>{ students[s.sid]={meta:s.meta,summary:s.summary}; }); return envsBoardsCompute(students,(_envc.cls&&_envc.cls.teams)||{}); }
function envcBoardsHtml(){
  const S=envcStudents(), teams=(_envc.cls&&_envc.cls.teams)||{};
  let h='<div class="envs-card"><div class="envs-h2">Teams</div><div class="envs-muted" style="margin-bottom:6px">Type a team name next to each student (a student may be on more than one team later; one here). The boards below are what students and parents see — no individual score anywhere.</div>';
  S.forEach(s=>{ h+='<div class="envs-row" style="padding:3px 0"><div style="flex:1;font-weight:700;font-size:13px">'+envcEsc(envcName(s))+'</div><input class="envs-in" style="width:150px" placeholder="team" value="'+envcEsc(teams[s.sid]||"")+'" onchange="envcTeamSet(\''+envcJ(s.sid)+'\',this.value)"></div>'; });
  h+='</div>';
  const B=envcBoards(); envcBoardsPublish(B);
  h+='<div class="envs-row" style="margin-bottom:8px"><div class="envs-muted" style="flex:1">Published for the class as boards/'+envcEsc(_envc.cid)+' whenever you open this page.</div><button class="envs-btn sec" onclick="envcBoardsPublish(null,true)">↻ Publish now</button></div>';
  h+=envsBoardsHtml(B,null);
  h+='<div class="envs-card"><div class="envs-h2">Full ranking (teachers only)</div><table class="envs-grid"><thead><tr><th>#</th><th>student</th><th class="c">gain</th><th class="c">effort</th></tr></thead><tbody>'+S.map(s=>({name:envcName(s),gain:envsGain(s.summary),eff:envsEffort(s.summary).score})).sort((a,b)=>b.gain-a.gain||b.eff-a.eff).map((r,i)=>'<tr><td>'+(i+1)+'</td><td style="font-weight:800">'+envcEsc(r.name)+'</td><td class="c">'+r.gain+'</td><td class="c">'+r.eff+'</td></tr>').join("")+'</tbody></table></div>';
  return h;
}
function envcTeamSet(sid,name){ if(!envcOn()) return; name=String(name||"").trim().slice(0,30); envcWrite("classes/"+_envc.cid+"/teams/"+sid,name||null,name?"set":"remove").then(()=>{ if(envsDemo()){ _envc.cls.teams=_envc.cls.teams||{}; if(name) _envc.cls.teams[sid]=name; else delete _envc.cls.teams[sid]; } _envc.boardsHash=""; envcRe(); }).catch(()=>{}); }
function envcBoardsPublish(B,force){ if(!envcOn()) return; B=B||envcBoards(); const h=JSON.stringify(Object.assign({},B,{at:0})); if(!force&&h===_envc.boardsHash) return; _envc.boardsHash=h; if(envsDemo()){ _envs.boards=B; if(force) envsToast("demo: would write boards/"+_envc.cid); return; } envsWrite("boards/"+_envc.cid,B).then(()=>{ if(force) envsToast("Boards published"); }).catch(()=>{}); }
// who drills — per class: parent / teacher / both (teacher drills themselves come in a later step; this is the switch)
function envcWhoHtml(){ const w=_envc.who||"parent"; const b=(k,l,d)=>'<button class="envs-btn '+(w===k?'':'sec')+'" onclick="envcWhoSet(\''+k+'\')">'+l+'</button><div class="envs-muted" style="margin:2px 0 8px">'+d+'</div>';
  return '<div class="envs-card"><div class="envs-h2">Who drills the cards</div><div class="envs-muted" style="margin-bottom:8px">Per class. Parents drill at home under their own login (the app’s drill). Teacher drills from this console — 3–5 cards per student in front of you — come in a later step; the switch is here now so families see the right note.</div>'+b("parent","\u{1F468}‍\u{1F469}‍\u{1F467} Parents","Each family drills at home.")+b("teacher","\u{1F469}‍\u{1F3EB} Teacher","You drill in class; parents only watch the progress page.")+b("both","\u{1F91D} Both","Parents at home, you in class.")+'<div class="envs-muted">Saved at settings/whoDrills/'+envcEsc(_envc.cid)+' · now: <b>'+envcEsc(w)+'</b></div></div>'; }
function envcWhoSet(v){ if(!envcOn()||["parent","teacher","both"].indexOf(v)<0) return; envcWrite("settings/whoDrills/"+_envc.cid,v).then(()=>{ _envc.who=v; _envs.who=v; envcRe(); }).catch(()=>{}); }
// ── Adrienne: the master lock, every class, teachers, the families view (§5.7)
function envcAdminHtml(){
  if(!envcAdmin()) return ""; const lk=envsLockState(_envc.lockRaw);
  let h='<div class="envs-card" style="border-color:#fcd34d"><div class="envs-h2">\u{1F512} Master lock</div><div style="font-size:13px;margin-bottom:6px">Now: <b>'+(lk.locked?'CLOSED':'open')+'</b>'+(lk.why==="auto"?' (closed by itself after '+envsAutoLockLabel()+')':lk.why==="reopened"?' (reopened for the next season)':'')+'. The season closes by itself after <b>'+envsAutoLockLabel()+'</b> (State). Closed = teacher and every family land on the “season closed” card; everything is kept.</div><div class="envs-row">'+(lk.locked?'<button class="envs-btn" onclick="envcLock(false)">Reopen the season</button>':'<button class="envs-btn red" onclick="envcLock(true)">Close the season now</button>')+'</div><div class="envs-muted" style="margin-top:4px">release/locked = '+envcEsc(JSON.stringify(_envc.lockRaw===undefined?null:_envc.lockRaw))+'</div></div>';
  const cls=Object.keys(_envc.classes||{});
  h+=(typeof cpAdminClassHtml==="function")?cpAdminClassHtml():'<div class="envs-card"><div class="envs-h2">Classes</div><div class="envs-chips" style="padding-bottom:0">'+cls.map(c=>'<button class="'+(_envc.cid===c?'on':'')+'" onclick="envcPickClass(\''+envcJ(c)+'\')">'+envcEsc((_envc.classes[c]&&_envc.classes[c].name)||c)+'</button>').join("")+'</div><div class="envs-row" style="margin-top:8px"><input id="envc-cls-id" class="envs-in" style="width:170px" placeholder="class id (ms-science-2026)"><input id="envc-cls-name" class="envs-in" style="flex:1;min-width:140px" placeholder="Class name"><input id="envc-cls-teacher" class="envs-in" style="flex:1;min-width:160px" placeholder="teacher uid"><button class="envs-btn sec" onclick="envcClassAdd()">+ Class</button></div></div>';   // 🏫 CPCLASS: + Class gains title, season, start, a goal date, the lock date
  h+='<div class="envs-card"><div class="envs-h2">Teachers</div>'+Object.keys(_envc.teachers||{}).map(u=>'<div style="font-size:12.5px;padding:3px 0">'+envcEsc((_envc.teachers[u]&&_envc.teachers[u].name)||"?")+' <span class="envs-muted">'+envcEsc(u)+' · '+envcEsc(Object.keys((_envc.teachers[u]&&_envc.teachers[u].classes)||{}).join(", "))+'</span></div>').join("")+'<div class="envs-row" style="margin-top:8px"><input id="envc-t-uid" class="envs-in" style="flex:1;min-width:160px" placeholder="uid (from Authentication, after you created the user)"><input id="envc-t-name" class="envs-in" style="width:140px" placeholder="Name"><button class="envs-btn sec" onclick="envcTeacherAdd()">+ Teacher</button></div><div class="envs-muted" style="margin-top:4px">Writes teachers/&lt;uid&gt; = {name, classes:{'+envcEsc(_envc.cid)+':true}} and classes/'+envcEsc(_envc.cid)+'/teacher.</div></div>';
  const S=envcStudents();
  h+='<div class="envs-card" style="padding:8px 6px;overflow-x:auto"><div class="envs-h2" style="padding:0 6px">Families · '+envcEsc(_envc.cid)+'</div><table class="envs-grid"><thead><tr><th>student</th><th>family id</th><th>app</th><th>parent uid</th><th>student uid</th><th>last mirror</th><th>instance</th></tr></thead><tbody>'+
    S.map(s=>{ const L=s.logins||{}; const fid=(s.meta&&s.meta.familyId)||s.sid.split("_")[0]; return '<tr><td style="font-weight:800">'+envcEsc(envcName(s))+'</td><td>'+envcEsc(fid)+'</td><td>'+envcEsc(envcApp(s))+'</td><td style="font-family:monospace;font-size:10.5px">'+envcEsc(L.parent||"–")+'</td><td style="font-family:monospace;font-size:10.5px">'+envcEsc(L.kid||"–")+'</td><td>'+envcEsc(s.summary?envsWhen(envsDayKey(s.summary.at||0)):"never")+'</td><td>'+(envcApp(s)==="howe"?'<span class="envs-muted">their own project</span>':'<button class="envs-btn sec" style="min-height:30px;font-size:11px" onclick="envcSeedShow(\''+envcJ(s.sid)+'\')">seed JSON</button>')+'</td></tr>'; }).join("")+'</tbody></table>';
  if(_envc.seedFor){ const s=Object.assign({sid:_envc.seedFor},_envc.students[_envc.seedFor]||{}); h+='<div style="padding:8px 6px"><div class="envs-muted">Realtime Database → create instance <b>'+envcEsc(envsProjectId()+"-"+((s.meta&&s.meta.familyId)||""))+'</b>, paste envirothon/SITE_RULES.json §family, then Import JSON:</div><textarea class="envs-in" rows="8" readonly style="font-family:monospace;font-size:11px">'+envcEsc(JSON.stringify(envcSeedJson(s),null,1))+'</textarea></div>'; }
  h+='</div>';
  return h;
}
// PURE: the family instance's seed (what Adrienne imports once per family): the two logins allowed, the one-kid roster, the pages, the edition
function envcSeedJson(s){ const L=s.logins||{}, m=s.meta||{}, fid=m.familyId||String(s.sid||"").split("_")[0], kid=m.kid||String(s.sid||"").split("_")[1]||"kid", first=String(m.name||kid).split(" ")[0];
  const allowed={}; if(L.parent) allowed[L.parent]=true; if(L.kid) allowed[L.kid]=true;
  return {allowed,settings:{edition:"envirothon",family:[{id:kid,name:first,color:"#2d6a4f",badge:"#dcfce7",schoolAge:true}],pages:{notebook:false,mastery:true,units:true,play:false,"moms-plan":false,kids:true,purchases:false,workbooks:false,eic:false,helpers:false},pin:String(1000+Math.floor(Math.random()*9000)),envirothon:{classId:s.class||_envc.cid||"",sid:fid+"_"+kid,kid,unit:"nc_envirothon"}}}; }
function envcSeedShow(sid){ _envc.seedFor=_envc.seedFor===sid?null:sid; envcRe(); }
function envcLock(on){ if(!envcAdmin()) return; const rec={locked:!!on,at:Date.now(),by:_envs.uid}; envcWrite("release/locked",rec).then(()=>{ _envc.lockRaw=rec; _envs.lockRaw=rec; _envs.lock=envsLockState(rec); envcRe(); }).catch(()=>{}); }
function envcClassAdd(){ if(!envcAdmin()) return; if(typeof cpClassAdd==="function"){ cpClassAdd(); return; } const g=id=>((document.getElementById(id)||{}).value||"").trim(); const cid=g("envc-cls-id").toLowerCase().replace(/[^a-z0-9-]/g,""), name=g("envc-cls-name"), t=g("envc-cls-teacher"); if(!cid||!name){ envsToast("Class id and name, please."); return; }   // 🏫 CPCLASS: the new form
  const rec={name,year:ENVS_SEASON,area:8,division:"ms",students:{}}; if(t) rec.teacher=t; const o={["classes/"+cid]:rec}; if(t) o["teachers/"+t+"/classes/"+cid]=true;
  envcMulti(o,"Class made").then(()=>{ if(envsDemo()){ _envc.classes[cid]=rec; } envcPickClass(cid); }).catch(()=>{}); }
function envcTeacherAdd(){ if(!envcAdmin()) return; const g=id=>((document.getElementById(id)||{}).value||"").trim(); const uid=g("envc-t-uid"), name=g("envc-t-name"); if(!uid||!name||!_envc.cid){ envsToast("The uid, a name and a class, please."); return; }
  envcMulti({["teachers/"+uid+"/name"]:name,["teachers/"+uid+"/classes/"+_envc.cid]:true,["classes/"+_envc.cid+"/teacher"]:uid},"Teacher added").then(()=>{ if(envsDemo()){ _envc.teachers[uid]={name,classes:{[_envc.cid]:true}}; _envc.cls.teacher=uid; envcRe(); } }).catch(()=>{}); }
// ENVCONSOLE_END
// ENVCLASSSET_START — ⚙️ CLASS SETTINGS on the Envirothon site: the teacher sets how her class studies (her words 2026-10-28: "the teacher
// should be able to have the controls to edit how many can be each day how they will be learned how many times in which level all of
// these type settings that are in drills" · "are we going to have those settings for her to tweak and change and set up?" · "can i see
// that in the demo"). Howe's own session editor (mhqSessValidate) and drill rules (Mastery ▸ Drill Rules) are the model for what each
// setting means and its allowed range. INERT unless ENVSITE's envEdition() says "envirothon": every function returns at once otherwise.
//   · THE PANEL (ENVCONSOLE's "⚙️ Class settings" chip, teacher + admin): up front — New cards a day · Cards a sitting · How cards are
//     learned (the pattern: Pick it / Key ideas / Type it / Flip, ticked + ordered) · Passes · Decks introducing at once; the "Advanced"
//     fold — when a card mixes into review / hands off to the drill (tier pickers), the drill ladder (right in a row to move up, per
//     level, what a miss does), the drill's limits (new per deck, learning cap, overdue cap) and each deck's mode + new-at-once. Each row:
//     the plain meaning in one line, Howe's range, the value now. "Reset to default" per section.
//     Cards a sitting (maxCards) is up front although the ask didn't name it: the 🌿 session caps a day's learning + new cards at it
//     (12), so New cards a day = 20 could never give 20 without it.
//   · PER STUDENT: the student page's "⚙️ Settings for this student" — the same rows, each showing "class: 20" until it is overridden;
//     clearing an override falls back to the class.
//   · ADRIENNE'S LOCKS: settings/locks/<name> = true (admin only). A locked setting shows to the teacher greyed, "🔒 set by Adrienne",
//     and her save is refused (here and in the rules); only the admin changes it, for the class and for any student.
//   · DATA (the shared instance; every save ONE targeted update through envsWrite — demo: "would write" toast, dry run: nothing):
//       classes/<cid>/settings/{study:{…}, drill:{…}}   only the values she set (a cleared value = the default)
//       students/<sid>/settings/{study:{…}, drill:{…}}  overrides only. NOT classes/<cid>/students/<sid>/settings: that node is the
//         roster flag `true` — the first override would turn it into an object and clearing the last one would delete the student
//         from the class. students/<sid> is the student's own row (the console already listens to it; the family's login reads it).
//       settings/locks/<name> = true | null
//   · HOW IT REACHES A KID: on a kid's or parent's boot (ENVSITE envsReadShared → envClsKidLoad) ONE once each of
//     classes/<cid>/settings and students/<sid>/settings; envClassOverlay() lays defaults ← class ← student over the 🌿 session record
//     (mstSessions, envtHandOffAt) and over the drill settings (mastDrillSettings, mastGetCatMode) IN MEMORY — a new object, never a
//     write into the kid's own records. Every other family, every other kid and every other session gets back the very object it passed.
//     A Howe kid in a class (the mirror) keeps Mom's settings: the overlay runs only under the site's edition.
//   · DEMO: the sample class starts at the defaults (5 a day …); one sample student (Jonah T.) has an override; a change applies at once,
//     so the Kid view's 🌿 start reads the class plan ("up to 20 new cards today") and the next sitting uses the new steps.
const ENVCS_LADDER=["every_other_day","weekly","bi_weekly","monthly","graduated"];
const ENVCS_TIER_LBL={daily:"Daily",every_other_day:"Every other day",every_third_day:"Every 3rd day",weekly:"Weekly",bi_weekly:"Every 2 weeks",monthly:"Monthly",learned:"Learned",graduated:"Graduated"};
const ENVCS_STEPS=[["pick","\u{1F3AF} Pick it","choose the right answer from a few"],["ideas","\u{1F9E9} Key ideas","say it in your own words, check the key ideas"],["type","⌨️ Type it","type the answer"],["rec","\u{1F504} Flip","see the card, turn it over, say if you knew it"]];
const ENVCS_MODES=[["flash","⚡ Flash"],["flip","\u{1F504} Flip"],["quiz","\u{1F4DD} Quiz"]];
const ENVCS_SECTS=[["front","How the class studies","study"],["moves","When cards move on","study"],["ladder","The drill ladder","drill"],["limits","The drill’s limits","drill"],["decks","Each deck","drill"]];
const ENVCS_FIELDS=[
  {name:"newPerDay",part:"study",sect:"front",kind:"int",min:0,max:50,def:5,label:"New cards a day",means:"Cards a student meets for the first time each study day."},
  {name:"maxCards",part:"study",sect:"front",kind:"int",min:0,max:60,def:12,zero:"no limit",label:"Cards a sitting",means:"Most cards in a day’s sitting, new + still learning (0 = no limit). Reviews always come too. Keep it at or above New cards a day."},
  {name:"pattern",part:"study",sect:"front",kind:"pattern",def:["pick","ideas","type"],label:"How cards are learned",means:"The steps a new card goes through, one per learning day, in this order."},
  {name:"passes",part:"study",sect:"front",kind:"int",min:1,max:5,def:2,label:"Passes per sitting",means:"How many times each learning card comes round in one sitting."},
  {name:"focusDecks",part:"study",sect:"front",kind:"int",min:0,max:20,def:2,zero:"every open deck",label:"Decks introducing at once",means:"How many decks hand out new cards at the same time (0 = every open deck)."},
  {name:"mixInAt",part:"study",sect:"moves",kind:"tier",def:"weekly",label:"Mixes into review at",means:"The level where a card stops coming in the \u{1F33F} sitting and moves to review."},
  {name:"handOffAt",part:"study",sect:"moves",kind:"tier",def:"bi_weekly",label:"Hands off to the drill at",means:"The level where a card goes to the drill — and counts as learned for the final."},
  {name:"miss_drop",part:"drill",sect:"ladder",kind:"choice",opts:[["reset","⇣ Back to the first level"],["one","↓ Down one level"]],def:"reset",label:"What a miss does",means:"Where a card goes after a wrong answer."},
  {name:"max_intro_per_cat",part:"drill",sect:"limits",kind:"int",min:1,max:10,def:3,label:"New per deck in a drill",means:"How many cards of one deck may be new at once in the drill."},
  {name:"max_learn_per_drill",part:"drill",sect:"limits",kind:"int",min:0,max:40,def:0,zero:"no limit",label:"Learning cards per drill",means:"Most learning cards in one drill, every deck together (0 = no limit). Reviews are never cut."},
  {name:"max_overdue_per_drill",part:"drill",sect:"limits",kind:"int",min:0,max:60,def:0,zero:"all of them",label:"Overdue reviews per drill",means:"After missed days, how many overdue reviews come in one drill, oldest first (0 = all of them)."},
  {name:"cat_modes",part:"drill",sect:"decks",kind:"deckmode",def:{},label:"How each deck shows in the drill",means:"Flash (say it), Flip (turn the card over) or Quiz (write it)."},
  {name:"cat_intro_max",part:"drill",sect:"decks",kind:"deckint",min:1,max:10,def:{},label:"New at once, per deck",means:"A different number for one deck (blank = New per deck in a drill)."}];
const _envcs={locks:{},kcls:null,kstu:null,loaded:false,asked:"",adv:false,stuOpen:"",stuAdv:false};
function envClsOn(){ return typeof envSiteOn==="function"&&envSiteOn(); }
function envClsField(name){ return ENVCS_FIELDS.find(f=>f.name===name)||null; }
function envClsDecks(){ return ((typeof ENV_DECKS!=="undefined"&&ENV_DECKS)||[]).map(d=>({key:d[0],mode:d[1],station:d[3]})); }
function envClsTiers(){ return ENVCS_LADDER.slice(); }
function envClsTierLbl(t){ return ENVCS_TIER_LBL[t]||String(t||""); }
// the default a setting falls back to: the 🌿 session record's own value (ENVUNIT's ENV_SESSION), the drill's stock default, each deck's own mode
function envClsDef(f){ if(!f) return null;
  { const d=(typeof cpSeatsDef==="function")?cpSeatsDef(f):undefined; if(d!==undefined) return d; }   // 🪑 CPSEATS: Cards a sitting defaults to Auto
  if(f.part==="study"&&typeof ENV_SESSION!=="undefined"&&ENV_SESSION&&ENV_SESSION[f.name]!=null) return Array.isArray(ENV_SESSION[f.name])?ENV_SESSION[f.name].slice():ENV_SESSION[f.name];
  if(f.kind==="deckmode"){ const o={}; envClsDecks().forEach(d=>{ o[d.key]=d.mode; }); return o; }
  return (f.def&&typeof f.def==="object")?(Array.isArray(f.def)?f.def.slice():Object.assign({},f.def)):f.def; }
// PURE: is this value allowed? → {ok, v, error}. Howe's ranges; a map setting checks one key (a deck of the unit, a level that can climb).
function envClsCheck(name,v,key){
  if(typeof cpSeatsCheck==="function"){ const c=cpSeatsCheck(name,v); if(c) return c; }   // 🪑 CPSEATS: Cards a sitting is Auto or 0–200
  const f=envClsField(name); if(!f) return {ok:false,error:"Unknown setting"};
  const intOk=x=>{ const n=(typeof x==="number")?x:(String(x==null?"":x).trim()===""?NaN:Number(x)); return (Number.isInteger(n)&&n>=f.min&&n<=f.max)?n:null; };
  const rng=f.label+" must be a whole number "+f.min+"–"+f.max;
  if(f.kind==="int"){ const n=intOk(v); return n==null?{ok:false,error:rng}:{ok:true,v:n}; }
  if(f.kind==="tiermap"){ if(envClsTiers().slice(0,-1).indexOf(key)<0) return {ok:false,error:"Unknown level"}; const n=intOk(v); return n==null?{ok:false,error:rng}:{ok:true,v:n}; }
  if(f.kind==="deckint"){ if(!envClsDecks().some(d=>d.key===key)) return {ok:false,error:"Unknown deck"}; const n=intOk(v); return n==null?{ok:false,error:rng}:{ok:true,v:n}; }
  if(f.kind==="deckmode"){ if(!envClsDecks().some(d=>d.key===key)) return {ok:false,error:"Unknown deck"}; return ENVCS_MODES.some(m=>m[0]===v)?{ok:true,v}:{ok:false,error:"A deck shows as Flash, Flip or Quiz"}; }
  if(f.kind==="tier") return envClsTiers().indexOf(v)>=0?{ok:true,v}:{ok:false,error:"Pick a level"};
  if(f.kind==="choice") return f.opts.some(o=>o[0]===v)?{ok:true,v}:{ok:false,error:"Pick one"};
  if(f.kind==="pattern"){ const arr=Array.isArray(v)?v:(v&&typeof v==="object")?Object.keys(v).sort((a,b)=>a-b).map(k=>v[k]):null; if(!arr) return {ok:false,error:"Tick at least one step"};
    const out=[]; arr.forEach(s=>{ if(ENVCS_STEPS.some(x=>x[0]===s)&&out.indexOf(s)<0) out.push(s); }); return out.length?{ok:true,v:out}:{ok:false,error:"Tick at least one step"}; }
  return {ok:false,error:"Unknown setting"};
}
// PURE: hand-off must sit above mix-in (Howe's own rule, "Hand-off must be above mix-in")
function envClsTierOrderOk(mix,hand){ const L=envClsTiers(); return L.indexOf(hand)>L.indexOf(mix); }
// PURE: rec (the kid's own 🌿 session record or drill settings) with each layer laid over it (class, then the student) → a NEW object, or
// rec itself when nothing applies. Invalid values are skipped; a mix-in / hand-off pair out of order falls back to rec's own.
function envClsMerge(part,rec,layers){
  const out=Object.assign({},rec||{}); let changed=false, introFromLayer=false; const fs=ENVCS_FIELDS.filter(f=>f.part===part);
  (layers||[]).forEach(L=>{ const src=(L&&L[part])||{};
    fs.forEach(f=>{ const v=src[f.name]; if(v==null) return;
      if(f.kind==="tiermap"||f.kind==="deckint"||f.kind==="deckmode"){ if(typeof v!=="object") return; const m=Object.assign({},out[f.name]||{}); let any=false;
        Object.keys(v).forEach(k=>{ const c=envClsCheck(f.name,v[k],k); if(c.ok){ m[k]=c.v; any=true; } }); if(any){ out[f.name]=m; changed=true; } return; }
      const c=envClsCheck(f.name,v); if(!c.ok) return; out[f.name]=c.v; changed=true; if(f.name==="max_intro_per_cat") introFromLayer=true; }); });
  if(!changed) return rec;
  // "New per deck in a drill" set by the class: the enroll gave every Envirothon deck its own cat_intro_max (3), which would hide it —
  // those per-deck numbers step aside (memory only) unless a layer set one for that deck.
  if(part==="drill"&&introFromLayer&&out.cat_intro_max){ const m=Object.assign({},out.cat_intro_max), mine={}; (layers||[]).forEach(L=>{ Object.keys(((L&&L.drill)||{}).cat_intro_max||{}).forEach(k=>{ mine[k]=1; }); });
    envClsDecks().forEach(d=>{ if(!mine[d.key]) delete m[d.key]; }); out.cat_intro_max=m; }
  if(part==="study"&&!envClsTierOrderOk(out.mixInAt||"weekly",out.handOffAt||"bi_weekly")){ out.mixInAt=rec.mixInAt; out.handOffAt=rec.handOffAt; if(out.mixInAt===undefined) delete out.mixInAt; if(out.handOffAt===undefined) delete out.handOffAt; }
  if(Array.isArray(out.pattern)) out.pattern=out.pattern.slice();
  return out;
}
// ── the kid's side ──
// ENVSITE envsReadShared → once the class is known: ONE once each (the class's settings, this student's overrides); repaint on arrival
function envClsKidLoad(sdb,cid){
  if(typeof cpceKidLoad==="function") cpceKidLoad(sdb,cid);   // 📚 CPCARDSEDIT: the class's card layer, once
  if(typeof cpctKidLoad==="function") cpctKidLoad(sdb,cid);   // 📝 CPTESTS: the class's test layer, once (before the settings, whose arrival repaints)
  if(typeof cpphKidLoad==="function") cpphKidLoad(sdb,cid);   // 🖼 CPPHOTOS: the class's and the unit's photo layers, once
  if(typeof cptrKidLoad==="function") cptrKidLoad(sdb,cid);   // ✂️ CPTRIM: Adrienne's unit trims, once (site kid / parent only)
  if(typeof cpflKidLoad==="function") cpflKidLoad(sdb,cid);   // 🚩 CPFLAG: this family's own flags, live (one query: by = this sid)
  if(!envClsOn()||envsDemo()||!sdb||!cid||!_envs.sid||_envcs.asked===cid) return false; _envcs.asked=cid;
  const val=s=>(s&&typeof s.val==="function")?s.val():null; let n=0;
  const done=()=>{ if(++n<2) return; _envcs.loaded=true; try{ if(typeof renderAllSoon==="function") renderAllSoon(); }catch(e){} };
  sdb.ref("classes/"+cid+"/settings").once("value",s=>{ _envcs.kcls=val(s)||{}; done(); },()=>{ _envcs.kcls={}; done(); });
  sdb.ref("students/"+_envs.sid+"/settings").once("value",s=>{ _envcs.kstu=val(s)||{}; done(); },()=>{ _envcs.kstu={}; done(); });
  return true;
}
// [class, student] — the demo reads the console's own in-memory class (so a change applies at once), live reads what the boot loaded
function envClsLayers(){
  if(envsDemo()){ const c=(_envc.cls&&_envc.cls.settings)||{}, s=(((_envc.students||{})[_envs.sid])||{}).settings||{}; return [c,s]; }
  return _envcs.loaded?[_envcs.kcls||{},_envcs.kstu||{}]:null;
}
// THE overlay (one guarded line each in mstSessions, envtHandOffAt, mastDrillSettings, mastGetCatMode): rec back untouched unless this is
// the site's own kid (kid / parent login, or the demo's kid) and the class or the student has a value.
function envClassOverlay(part,kid,rec){
  try{
    { const _l=(typeof cplnOverlay==="function")?cplnOverlay(part,kid,rec):undefined; if(_l!==undefined) return _l; }   // 🌿 CPLINCOLN: Lincoln's 🌿 session + his 15 decks follow his class (a mirrored kid; undefined for anyone else)
    if(!envClsOn()||!rec||!kid||kid!==_envs.kid) return rec;
    if(!envsDemo()&&!(_envs.role==="kid"||_envs.role==="parent")) return rec;
    let L=envClsLayers(); if(!L) return rec;
    if(part==="study"&&typeof cpCalOptLayers==="function") L=cpCalOptLayers(_envs.sid,L);   // 🎯 CPCALOPTIONS: the family's picked New cards a day, between the class's and the teacher's own
    if(part==="study"&&typeof cpSeatsStudy==="function") return cpSeatsStudy(kid,envClsMerge(part,rec,L),L);   // 🪑 CPSEATS: Auto seats = New cards a day × Days a card is learned, in memory
    return envClsMerge(part,rec,L);
  }catch(e){ return rec; }
}
// the 🌿 start's one line (renderMastStudy, right above the session header): what the class set, read off the session as the sitting will use it
function envClsStartHtml(kid,session){
  if(!envClsOn()||!session||typeof ENV_SESSION_SID==="undefined"||session.sid!==ENV_SESSION_SID||kid!==_envs.kid) return "";
  const steps=(Array.isArray(session.pattern)?session.pattern:[]).map(s=>{ const x=ENVCS_STEPS.find(y=>y[0]===s); return x?x[1]:s; }).join(" → ");
  return '<div style="margin:0 0 10px;padding:8px 12px;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;font-size:13px;color:#14532d;font-weight:700;font-family:\'DM Sans\',sans-serif">⚙️ Your class plan: up to '+(session.newPerDay|0)+' new card'+((session.newPerDay|0)===1?'':'s')+' today'+(steps?' · '+envsEsc(steps):'')+((typeof cpSpecStartNote==="function")?cpSpecStartNote(kid):'')+((typeof cpSecStartNote==="function")?cpSecStartNote(kid):'')+'</div>';   // 🎚 CPSECTIONS: " · Soils: review only" · 🏅 CPSPECIALIST: " · 🏅 Forestry specialist"
}
// ── the console's side ──
function envClsConsoleStart(){ if(!envcOn()||envsDemo()) return false; envcSub("locks","settings/locks",v=>{ _envcs.locks=v||{}; }); return true; }
function envClsDemoStart(data){ _envcs.locks={}; _envcs.adv=false; _envcs.stuOpen=""; const j=data&&data.students&&data.students.tran_jonah; if(j) j.settings={study:{newPerDay:3}}; }   // one sample override: "class: 5" shows on the others
function envClsLocked(name){ return !!(_envcs.locks&&_envcs.locks[name]===true); }
function envClsCanEdit(name){ return envcOn()&&(envcAdmin()||!envClsLocked(name)); }
function envClsPart(scope,part){ const S=scope==="class"?((_envc.cls&&_envc.cls.settings)||{}):((((_envc.students||{})[scope])||{}).settings||{}); return S[part]||{}; }
function envClsClassVal(name){ const f=envClsField(name); const v=envClsPart("class",f.part)[name]; if(v==null) return envClsDef(f); if(f.kind==="deckmode"||f.kind==="deckint"||f.kind==="tiermap") return Object.assign({},envClsDef(f)||{},v); if(f.kind==="pattern"){ const c=envClsCheck(name,v); return c.ok?c.v:envClsDef(f); } return v; }
function envClsEff(scope,name){ const f=envClsField(name), cv=envClsClassVal(name); if(scope==="class") return cv; const o=envClsPart(scope,f.part)[name]; if(o==null) return cv;
  if(typeof cv==="object"&&!Array.isArray(cv)) return Object.assign({},cv,o); if(f.kind==="pattern"){ const c=envClsCheck(name,o); return c.ok?c.v:cv; } return o; }
function envClsBase(scope,part){ return scope==="class"?"classes/"+_envc.cid+"/settings/"+part:"students/"+scope+"/settings/"+part; }
// apply a saved update to the console's memory (demo: this IS the state; live: the listener confirms it a moment later)
function envClsMem(scope,part,upd){
  let host; if(scope==="class"){ if(!_envc.cls) _envc.cls={}; host=_envc.cls; } else { if(!_envc.students[scope]) _envc.students[scope]={}; host=_envc.students[scope]; }
  host.settings=host.settings||{}; const t=host.settings[part]=host.settings[part]||{};
  Object.keys(upd).forEach(p=>{ const a=p.split("/"); if(a.length===1){ if(upd[p]==null) delete t[a[0]]; else t[a[0]]=upd[p]; return; }
    const m=t[a[0]]=t[a[0]]||{}; if(upd[p]==null) delete m[a[1]]; else m[a[1]]=upd[p]; if(!Object.keys(m).length) delete t[a[0]]; });
}
// THE save: one targeted update at classes/<cid>/settings/<part> or students/<sid>/settings/<part>. v null = clear (class → the default,
// a student → the class). Refused: not the console, a locked setting for the teacher, a value outside the range, mix-in at/above hand-off.
function envClsSave(scope,name,v,key){
  const f=envClsField(name); if(!envcOn()||!f||!_envc.cid) return false;
  if(!envClsCanEdit(name)){ envsToast("\u{1F512} "+f.label+" is set by Adrienne"); return false; }
  if(scope!=="class"&&!(_envc.students||{})[scope]) return false;
  let val=null;
  if(v!=null){ const c=envClsCheck(name,v,key); if(!c.ok){ envsToast(c.error); envcRe(); return false; } val=c.v; }
  if(f.kind==="tier"&&val!=null){ const mix=name==="mixInAt"?val:envClsEff(scope,"mixInAt"), hand=name==="handOffAt"?val:envClsEff(scope,"handOffAt"); if(!envClsTierOrderOk(mix,hand)){ envsToast("Hand-off must be above mix-in"); return false; } }
  const p=(key!=null&&key!=="")?name+"/"+key:name, upd={[p]:val};
  envcWrite(envClsBase(scope,f.part),upd,"update").then(()=>{ envClsMem(scope,f.part,upd); envcRe(); }).catch(()=>{});
  return true;
}
function envClsInput(scope,name,raw,key){ const s=String(raw==null?"":raw).trim(); return envClsSave(scope,name,s===""?null:s,key); }
// "Reset to default" (class) / "Use the class's" (a student): one update clearing every set value of the section the teacher may change
function envClsReset(scope,sect){
  const S=ENVCS_SECTS.find(x=>x[0]===sect); if(!envcOn()||!S||!_envc.cid) return false; const part=S[2], cur=envClsPart(scope,part), upd={};
  ENVCS_FIELDS.filter(f=>f.sect===sect&&envClsCanEdit(f.name)&&cur[f.name]!=null).forEach(f=>{ upd[f.name]=null; });
  if(!Object.keys(upd).length){ envsToast(scope==="class"?"Already at the defaults":"Nothing changed for this student here"); return false; }
  envcWrite(envClsBase(scope,part),upd,"update").then(()=>{ envClsMem(scope,part,upd); envcRe(); }).catch(()=>{});
  return true;
}
// how cards are learned: tick a step on / off, move it up / down — the whole order is saved as one value
function envClsPat(scope,step,op){
  const cur=(envClsEff(scope,"pattern")||[]).slice(), i=cur.indexOf(step);
  if(op==="on"&&i<0) cur.push(step); else if(op==="off"&&i>=0){ if(cur.length===1){ envsToast("Keep at least one step"); return false; } cur.splice(i,1); }
  else if(op==="up"&&i>0){ cur.splice(i,1); cur.splice(i-1,0,step); } else if(op==="down"&&i>=0&&i<cur.length-1){ cur.splice(i,1); cur.splice(i+1,0,step); } else return false;
  return envClsSave(scope,"pattern",cur);
}
// Adrienne's 🔒: settings/locks/<name> = true | null, one update, admin only
function envClsLock(name,on){ if(!envcAdmin()||!envClsField(name)) return false; const upd={[name]:on?true:null};
  envcWrite("settings/locks",upd,"update").then(()=>{ _envcs.locks=Object.assign({},_envcs.locks||{}); if(on) _envcs.locks[name]=true; else delete _envcs.locks[name]; envcRe(); }).catch(()=>{}); return true; }
function envClsFmt(f,v){
  if(typeof cpSeatsFmt==="function"){ const t=cpSeatsFmt(f,v); if(t!=null) return t; }   // 🪑 CPSEATS: "Auto"
  if(v==null) return "–";
  if(f.kind==="int") return (v===0&&f.zero)?"0 ("+f.zero+")":String(v);
  if(f.kind==="tier") return envClsTierLbl(v);
  if(f.kind==="choice"){ const o=f.opts.find(x=>x[0]===v); return o?o[1]:String(v); }
  if(f.kind==="pattern") return (Array.isArray(v)?v:[]).map(s=>{ const x=ENVCS_STEPS.find(y=>y[0]===s); return x?x[1]:s; }).join(" → ");
  return Object.keys(v||{}).length+" set";
}
// one setting's row: meaning, control, value now (class: "now · default"; a student: "class: X" until overridden, then "✕ use the class's")
function envClsRowHtml(f,scope){
  const J=envcJ, sc=J(scope), locked=envClsLocked(f.name), can=envClsCanEdit(f.name), dis=can?'':' disabled', admin=envcAdmin();
  const own=envClsPart(scope,f.part)[f.name], eff=envClsEff(scope,f.name), cls=envClsClassVal(f.name), isMap=f.kind==="tiermap"||f.kind==="deckint"||f.kind==="deckmode";
  let h='<div style="padding:10px 0;border-top:1px solid #f1efe9;'+(can?'':'opacity:.55')+'"><div class="envs-row" style="align-items:flex-start"><div style="flex:1;min-width:170px"><div style="font-weight:800;font-size:13.5px">'+envcEsc(f.label)+(locked?' \u{1F512}':'')+'</div><div class="envs-muted">'+envcEsc(f.means)+(f.kind==="int"?' ('+f.min+'–'+f.max+')':'')+'</div></div>';
  if(admin&&scope==="class") h+='<button class="envs-btn sec" style="min-height:34px;padding:0 10px;font-size:12px" onclick="envClsLock(\''+f.name+'\','+(locked?'false':'true')+')">'+(locked?'\u{1F513} Unlock':'\u{1F512} Lock')+'</button>';
  h+='</div><div style="margin-top:6px">';
  const chip=(on,label,click)=>'<button class="envs-btn '+(on?'':'sec')+'" style="min-height:36px;padding:0 11px;font-size:12px;margin:0 6px 6px 0"'+dis+' onclick="'+click+'">'+label+'</button>';
  if(f.kind==="int") h+='<input class="envs-in" type="number" inputmode="numeric" min="'+f.min+'" max="'+f.max+'" style="width:96px" value="'+envcEsc(scope==="class"?eff:(own!=null?own:""))+'"'+(scope!=="class"?' placeholder="'+envcEsc(cls)+'"':'')+dis+' onchange="envClsInput(\''+sc+'\',\''+f.name+'\',this.value)">';
  else if(f.kind==="tier") h+=envClsTiers().map(t=>chip(eff===t,envcEsc(envClsTierLbl(t)),"envClsSave('"+sc+"','"+f.name+"','"+t+"')")).join("");
  else if(f.kind==="choice") h+=f.opts.map(o=>chip(eff===o[0],envcEsc(o[1]),"envClsSave('"+sc+"','"+f.name+"','"+o[0]+"')")).join("");
  else if(f.kind==="pattern"){ const on=eff||[], rows=on.concat(ENVCS_STEPS.map(x=>x[0]).filter(s=>on.indexOf(s)<0));
    h+=rows.map(s=>{ const x=ENVCS_STEPS.find(y=>y[0]===s), i=on.indexOf(s), t=i>=0;
      return '<div class="envs-row" style="padding:3px 0"><label style="display:flex;gap:8px;align-items:center;flex:1;min-width:170px;min-height:40px;font-size:13px"><input type="checkbox" '+(t?'checked':'')+dis+' onchange="envClsPat(\''+sc+'\',\''+s+'\',this.checked?\'on\':\'off\')"> <b>'+(t?(i+1)+'. ':'')+envcEsc(x[1])+'</b> <span class="envs-muted">'+envcEsc(x[2])+'</span></label>'+
        (t?'<button class="envs-btn sec" style="min-height:34px;padding:0 10px"'+(can&&i>0?'':' disabled')+' onclick="envClsPat(\''+sc+'\',\''+s+'\',\'up\')" aria-label="earlier">↑</button><button class="envs-btn sec" style="min-height:34px;padding:0 10px"'+(can&&i<on.length-1?'':' disabled')+' onclick="envClsPat(\''+sc+'\',\''+s+'\',\'down\')" aria-label="later">↓</button>':'')+'</div>'; }).join(""); }
  else if(f.kind==="deckmode"||f.kind==="deckint"){ const m=eff||{}, mine=own||{}, dflt=envClsDef(f)||{}, base=envClsEff(scope,"max_intro_per_cat");
    envsStations().forEach(st=>{ h+='<div style="font-size:11px;font-weight:800;color:#6b7280;margin:6px 0 2px">'+envcEsc(st.label)+'</div>';
      st.decks.forEach(d=>{ const k=J(d.key);
        h+='<div class="envs-row" style="padding:2px 0"><div style="flex:1;font-size:12.5px;min-width:120px">'+envcEsc(envsDeckShort(d.key))+'</div>';
        if(f.kind==="deckmode") h+='<select class="envs-in" style="width:120px"'+dis+' onchange="envClsSave(\''+sc+'\',\'cat_modes\',this.value,\''+k+'\')">'+ENVCS_MODES.map(o=>'<option value="'+o[0]+'" '+((m[d.key]||dflt[d.key])===o[0]?'selected':'')+'>'+envcEsc(o[1])+'</option>').join("")+'</select>';
        else h+='<input class="envs-in" type="number" inputmode="numeric" min="1" max="10" style="width:80px" value="'+envcEsc(scope==="class"?(m[d.key]!=null?m[d.key]:""):(mine[d.key]!=null?mine[d.key]:""))+'" placeholder="'+envcEsc(scope!=="class"&&(cls||{})[d.key]!=null?cls[d.key]:base)+'"'+dis+' onchange="envClsInput(\''+sc+'\',\'cat_intro_max\',this.value,\''+k+'\')">';
        h+='</div>'; }); }); }
  if(f.kind==="seats"&&typeof cpSeatsCtlHtml==="function") h+=cpSeatsCtlHtml(f,scope,eff,own,cls,dis);   // 🪑 CPSEATS: Auto + a number
  h+='</div><div class="envs-muted" style="margin-top:2px">';
  if(scope==="class") h+=isMap?(own&&Object.keys(own).length?Object.keys(own).length+' changed for the class':'all at the default'):'now: <b>'+envcEsc(envClsFmt(f,eff))+'</b>'+(own==null?' (default)':'');
  else if(own==null||(isMap&&!Object.keys(own).length)) h+=isMap?'all as the class':'class: <b>'+envcEsc(envClsFmt(f,cls))+'</b>';
  else h+=(isMap?Object.keys(own).length+' changed for this student':'this student: <b>'+envcEsc(envClsFmt(f,eff))+'</b> · class: '+envcEsc(envClsFmt(f,cls)))+(can?' · <a href="javascript:void(0)" onclick="envClsSave(\''+sc+'\',\''+f.name+'\',null)" style="color:#b91c1c">✕ use the class’s</a>':'');
  if(locked&&!admin) h+=' · \u{1F512} set by Adrienne'; else if(locked) h+=' · \u{1F512} locked for the teacher';
  if(f.kind==="seats"&&typeof cpSeatsPaceHtml==="function") h+=cpSeatsPaceHtml(f,scope);   // 🪑 CPSEATS: the real-pace line
  return h+'</div></div>';
}
function envClsSectHtml(scope,sect){
  const S=ENVCS_SECTS.find(x=>x[0]===sect); const fs=ENVCS_FIELDS.filter(f=>f.sect===sect);
  return '<div class="envs-card"><div class="envs-row"><div class="envs-h2" style="flex:1;margin:0">'+envcEsc(S[1])+'</div><button class="envs-btn sec" style="min-height:34px;padding:0 10px;font-size:12px" onclick="envClsReset(\''+envcJ(scope)+'\',\''+sect+'\')">'+(scope==="class"?'Reset to default':'Use the class’s')+'</button></div>'+fs.map(f=>envClsRowHtml(f,scope)).join("")+'</div>';
}
function envClsBodyHtml(scope,adv,advClick){
  let h=envClsSectHtml(scope,"front");
  h+='<button class="envs-btn sec" style="width:100%;margin-bottom:12px" onclick="'+advClick+'">'+(adv?'▴ Hide advanced':'▾ Advanced · when cards move on, the drill ladder, limits, each deck')+'</button>';
  if(adv) ["moves","ladder","limits","decks"].forEach(s=>{ h+=envClsSectHtml(scope,s); });
  if(typeof cpWatchSectHtml==="function") h+=cpWatchSectHtml(scope);   // 🧠 CPWATCH: ⚙️ Parent drills (the class's numbers)
  if(typeof cpwkSectHtml==="function") h+=cpwkSectHtml(scope);   // 📊 CPWEEK: ⚙️ Weekly summary (the completion target)
  return h;
}
// the ⚙️ Class settings screen (ENVCONSOLE's chip): the class's values, Adrienne's locks
function envClsPanelHtml(){
  if(!envcOn()) return ""; const cls=_envc.cls||{}, nLock=Object.keys(_envcs.locks||{}).filter(k=>_envcs.locks[k]===true).length;
  let h='<div class="envs-card"><div class="envs-h2">⚙️ Class settings · '+envcEsc(cls.name||_envc.cid)+'</div><div class="envs-muted">For every student in the class. A student page can change one student. Changes reach a student the next time their app opens. Saved at classes/'+envcEsc(_envc.cid)+'/settings.'+(envcAdmin()?' \u{1F512} Lock keeps a setting yours: the teacher sees it greyed, “set by Adrienne”.':(nLock?' \u{1F512} = set by Adrienne.':''))+'</div></div>';
  if(typeof cpPaceSumHtml==="function") h+=cpPaceSumHtml();   // 📅 CPPACE: the plan in one line, a link to 📅 Pace
  if(typeof cpShareSetHtml==="function") h+=cpShareSetHtml();   // 🧭 CPSHARE: where new cards come from once more than one section is open
  if(typeof cpSpecSetHtml==="function") h+=cpSpecSetHtml();   // 🏅 CPSPECIALIST: ⚙️ Class settings ▸ 🏅 Specialists (the defaults)
  if(typeof cpAheadSetHtml==="function") h+=cpAheadSetHtml();   // 🚀 CPAHEAD: ⚙️ Class settings ▸ 🚀 Getting ahead (on by default, Adrienne’s 🔒) and how the points work
  return h+envClsBodyHtml("class",_envcs.adv,"_envcs.adv=!_envcs.adv;envcRe()");
}
// the student page's "⚙️ Settings for this student" (folded until tapped)
function envClsStudentHtml(sid){
  if(!envcOn()||!sid) return ""; const s=(_envc.students||{})[sid]||{}, st=s.settings||{}; let n=0; ["study","drill"].forEach(p=>{ Object.keys(st[p]||{}).forEach(()=>n++); });
  const open=_envcs.stuOpen===sid, name=envcName(Object.assign({sid},s));
  let h='<div class="envs-card"><div class="envs-row"><div style="flex:1"><div class="envs-h2" style="margin:0">⚙️ Settings for this student</div><div class="envs-muted">'+(n?n+' changed for '+envcEsc(name)+'; the rest as the class':'All as the class')+' · students/'+envcEsc(sid)+'/settings</div></div><button class="envs-btn sec" onclick="_envcs.stuOpen=(_envcs.stuOpen===\''+envcJ(sid)+'\')?\'\':\''+envcJ(sid)+'\';envcRe()">'+(open?'▴ Close':'▾ Open')+'</button></div></div>';
  if(open) h+=envClsBodyHtml(sid,_envcs.stuAdv,"_envcs.stuAdv=!_envcs.stuAdv;envcRe()");
  return h;
}
// ENVCLASSSET_END
// ── end of env.js — the flag below tells index.html the whole file ran (haLazyReady) ──
if(typeof window!=="undefined") window._haLazy_env=true;
