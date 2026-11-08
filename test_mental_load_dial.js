/* 🎚 MLDIAL — the Load dial (slice 2 of PLAN_mental_load_2026-11-03.md). One control per kid (minutes a day + sittings) on the
   📊 Scores card that WRITES the knobs the app already has, in the claim order reviews → learning → new → games (½).
   Defaults by grade band; mlKnobsFor on four fixtures (monotonic, the order holds); the batch writes exactly the knob paths, one
   multi-path update; Undo restores; dry run writes nothing; nothing writes on boot or render; no family or kid names.
   Fixture family (ava · ben · cal · dot), touches no live data.
   run: node test_mental_load_dial.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const blk=(a,z)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(z,i); if(j<0) throw new Error("missing end "+z); return src.slice(i,j); };
const A=src.indexOf("// MLDIAL_START"), Z=src.indexOf("// MLDIAL_END"), block=src.slice(A,Z);
const SCP=blk("// SCORESPAGE_START","// SCORESPAGE_END"), SCR=blk("const SC_RANK=","\n// History-shaped view");

console.log("── the block ──");
ok("marked once, right after SCORESPAGE_END", A>0&&Z>A&&src.split("// MLDIAL_START").length===2&&src.split("// MLDIAL_END").length===2&&src.indexOf("// SCORESPAGE_END\n// MLDIAL_START")>0);
ok("no family or kid name in the block", !/lincoln|ellis|lucy|julian|howe|dewalt|burris|taylor|makenzie|andrew|caleb|kenzie|sara|melanie/i.test(block));
ok("every write is the one multi-path update in _mldSave, behind db && !_dryRun()", (block.match(/db\.ref\(/g)||[]).length===1&&/function _mldLive\(\)\{ return typeof db!=="undefined"&&!!db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\); \}/.test(block)&&/if\(_mldLive\(\)\)\{ try\{ db\.ref\(\)\.update\(upd\);/.test(block)&&!/\.set\(|\.remove\(|\.transaction\(/.test(block));
ok("the Scores block stays read-only (its own test's rule)", !/db\.ref\(|firebase|\.set\(|\.update\(|\.remove\(|\.transaction\(|HA_LS\.setItem/.test(SCP));
ok("the Scores card's hooks are guarded (byte-identical without the dial)", (SCP.match(/typeof mldDialHtml==="function"/g)||[]).length===2&&/typeof mldDefault!=="function"/.test(SCP));
ok("every inline <script> still compiles", (()=>{ const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m,n=0; while((m=re.exec(src))){ n++; try{ new vm.Script(m[1]); }catch(e){ console.log("    script #"+n+": "+e.message); return false; } } return n>0; })());

// a world: the Scores block + the dial, with stubs for what they read
function world(o){
  o=o||{}; const calls=[];
  const c={console,momHere:()=>o.mom!==false,ROSTER:o.roster||["ava","ben"],ROSTER_DEF:o.rdef||[{id:"ava",grade:"3",schoolAge:true},{id:"ben",grade:"",schoolAge:false}],
    KID_NAME:{},KID_COLOR:{},masteryData:o.md||{},weekData:{tasks:[]},checked:{},archive:{},currWeekNum:()=>30,mstTodayKey:()=>"20261108",
    mastSchoolDayNum:(k,d)=>{ const n=Math.round(Date.parse(d)/86400000); return n-Math.round(n/7)*2; },
    nbLoad:k=>((o.load||{})[k]||0),ENV_SESSION_SID:"envirothon",_dryRun:()=>!!o.dry,HA_LS:{getItem:()=>null,setItem:()=>{}},renderAll:()=>{},gwShowToast:()=>{},
    document:{getElementById:()=>null}};
  c.db=o.noDb?null:{ref:p=>{ calls.push({op:"ref",p:p}); return {update:u=>calls.push({op:"update",p:p,u:JSON.parse(JSON.stringify(u))}),set:v=>calls.push({op:"set",p:p,v}),remove:()=>calls.push({op:"remove",p:p})}; }};
  vm.createContext(c); vm.runInContext(SCR+"\n"+SCP+"\n"+block,c); c.calls=calls; c.run=e=>vm.runInContext(e,c); return c;
}

console.log("── defaults by grade band ──");
{ const rdef=[["a","PreK",false],["b","K",true],["c","1",true],["d","2",true],["e","3",true],["f","4",true],["g","5",true],["h","8",true],["i","",false],["j","",true],["k","Pre-K",false]].map(x=>({id:x[0],grade:x[1],schoolAge:x[2]}));
  const w=world({rdef,roster:rdef.map(x=>x.id)}); const d=k=>w.run("mldDefault")(k);
  ok("Pre-K 12 · K–2 15 · 3–4 25 · 5+ 35", d("a")===12&&d("k")===12&&d("b")===15&&d("c")===15&&d("d")===15&&d("e")===25&&d("f")===25&&d("g")===35&&d("h")===35, rdef.map(x=>d(x.id)));
  ok("no grade: not school-age → Pre-K 12; school-age → no default", d("i")===12&&d("j")===undefined);
  ok("a kid not on the roster → no default", d("zz")===undefined);
  ok("the band table is in code, not names", /const MLD_BANDS=\[\[-1,12,"Pre-K"\],\[2,15,"K–2"\],\[4,25,"3–4"\],\[99,35,"5\+"\]\]/.test(block));
  const dl=w.run("mldDial")("e"); ok("the dial before any tap: the default, 1 sitting, not stored", dl.minutes===25&&dl.sittings===1&&dl.stored===false&&dl.band.label==="3–4", dl); }

console.log("── mlKnobsFor: four fixtures ──");
const F={
  light:{secsPerCard:8,reviewsPerDay:20,learning:4,passes:2,introDots:5,sessions:[{sid:"s1",kind:"all",budgetRole:null},{sid:"s2",kind:"deck",budgetRole:null}]},
  heavy:{secsPerCard:12,reviewsPerDay:110,learning:25,passes:2,introDots:5,sessions:[{sid:"de",kind:"deck",budgetRole:"fixed"},{sid:"sc",kind:"deck",budgetRole:"pace"},{sid:"ds",kind:"all",budgetRole:"rest"},{sid:"mx",kind:"mix",budgetRole:null}]},
  mixed:{secsPerCard:9,reviewsPerDay:45,learning:10,passes:3,introDots:4,sessions:[{sid:"r",kind:"deck",budgetRole:"rest"},{sid:"x",kind:"deck",budgetRole:null},{sid:"m",kind:"mix",budgetRole:null},{sid:"ck",kind:"checkup",budgetRole:null}]},
  empty:{}
};
const w0=world(), K=w0.run("mlKnobsFor"), MINS=[]; for(let m=0;m<=120;m+=5) MINS.push(m);
const kv=(out)=>{ const o={}; out.knobs.forEach(k=>{ o[k.rel]=k.value; }); return o; };
Object.keys(F).forEach(name=>{
  const ks=F[name], R=Math.round(ks.reviewsPerDay||0), p=ks.passes||2, Lr=ks.learning||0;
  for(let s=1;s<=4;s++){
    let prev=null, mono=true, order=true, bad=null;
    MINS.forEach(m=>{ const out=K(m,s,ks), v=kv(out), tot=out.claim.reviews+out.claim.learning+out.claim.new+out.claim.games;
      if(prev){ Object.keys(v).forEach(k=>{ if(v[k]<prev.v[k]){ mono=false; bad={m,k,from:prev.v[k],to:v[k]}; } }); if(out.newCards<prev.out.newCards||out.cards<prev.out.cards||tot<prev.tot||out.claim.games<prev.out.claim.games) { mono=false; bad=bad||{m,claim:out.claim}; } }
      const unk=Math.min(out.cards-out.claim.reviews,Math.floor(out.cards*0.3));
      if(out.claim.learning>0&&out.claim.reviews!==Math.min(R,out.cards)) order=false;           // learning only after reviews
      if(out.newCards>1&&!(out.claim.reviews===R&&out.claim.learning===Lr*p)) order=false;        // new (past the floor) only after reviews + learning
      if(out.claim.games>0&&!(out.claim.reviews===R&&out.claim.learning+Math.floor((unk-out.claim.learning)/p)*p<=unk&&unk===Math.floor(out.cards*0.3))) order=false;   // games only once reviews and the unknown room are full
      prev={v,out,tot}; });
    ok(name+", "+s+" sitting"+(s>1?"s":"")+": more minutes never fewer cards (every knob, every claim)", mono, bad);
    ok(name+", "+s+" sitting"+(s>1?"s":"")+": the order holds (reviews → learning → new → games)", order);
  }
  // more sittings → each sitting no bigger
  { let okS=true; MINS.forEach(m=>{ for(let s=1;s<4;s++){ const a=kv(K(m,s,ks)), b=kv(K(m,s+1,ks)); ["_settings/max_learn_per_drill","_settings/max_overdue_per_drill"].forEach(k=>{ if(b[k]>a[k]) okS=false; }); Object.keys(a).filter(k=>/mixFinish$/.test(k)).forEach(k=>{ if(b[k]>a[k]) okS=false; }); } });
    ok(name+": more sittings only make each sitting smaller", okS); }
  // every value in its knob's range
  { let okR=true; const rng={new_budget:[1,60],newPerDay:[0,50],maxCards:[1,60],mixFinish:[5,60],max_learn_per_drill:[1,40],max_overdue_per_drill:[1,60],"missPlay.cap":[1,99]};
    MINS.forEach(m=>{ for(let s=1;s<=4;s++) K(m,s,ks).knobs.forEach(k=>{ const r=rng[k.knob]; if(!r||!Number.isInteger(k.value)||k.value<r[0]||k.value>r[1]) okR=false; }); });
    ok(name+": every knob stays inside the range its own editor allows (no 0 = 'no limit' sneaks in)", okR); }
});
{ const o=K(35,2,F.light), v=kv(o);
  ok("light: 35 min at 8 s → 262 cards; reviews 20 claimed first; learning 8 (4 × 2 passes); the unknown room 78 → 35 new", o.cards===262&&o.claim.reviews===20&&o.claim.learning===8&&o.newCards===35&&o.claim.games===164, o);
  ok("light: no budget roles → no new_budget; the new cards split across the two sessions; their seats = share × intro days", !("_settings/new_budget" in v)&&v["_sessions/s1/newPerDay"]===18&&v["_sessions/s2/newPerDay"]===17&&v["_sessions/s1/maxCards"]===60&&v["_sessions/s2/maxCards"]===60, v);
  ok("light: games get what's left at ½ weight (164 showings → 44 min of games, a list of 54)", o.minutes.games===44&&v["_settings/missPlay/cap"]===54, o.minutes); }
{ const o=K(35,2,F.heavy), v=kv(o);
  ok("heavy: 175 cards, 110 reviews claimed first (never dropped)", o.cards===175&&o.claim.reviews===110, o.claim);
  ok("heavy: learning takes the unknown room (50 of 52 learning showings) → new floors at 1, games get 13 showings", o.claim.learning===50&&o.newCards===1&&o.claim.games===13, o.claim);
  ok("heavy: every session in the budget → new_budget = 1, no newPerDay / maxCards written for them", v["_settings/new_budget"]===1&&!Object.keys(v).some(k=>/_sessions\/(de|sc|ds)\//.test(k)), v);
  ok("heavy: the Mix finish line = reviews ÷ sittings (55)", v["_sessions/mx/mixFinish"]===55, v);
  const big=K(120,2,F.heavy); ok("heavy at 120 min: more room → more new cards than at 35", big.newCards>o.newCards&&kv(big)["_settings/new_budget"]>1); }
{ const v=kv(K(25,1,F.mixed));
  ok("mixed: a budget group + an outside session share the new cards; the check-up session is never touched", ("_settings/new_budget" in v)&&("_sessions/x/newPerDay" in v)&&!Object.keys(v).some(k=>/_sessions\/(ck|r)\//.test(k)), v); }
{ const o=K(15,1,F.empty), v=kv(o);
  ok("empty (nothing logged, no sessions): 10 s a card default → 90 cards, the drill knobs only", o.secsPerCard===10&&o.cards===90&&Object.keys(v).sort().join()==="_settings/max_learn_per_drill,_settings/max_overdue_per_drill,_settings/missPlay/cap", v);
  ok("0 minutes → still a valid day (1 new card, nothing at 0 = 'no limit')", K(0,1,F.empty).knobs.every(k=>k.value>=1)&&K(0,1,F.empty).newCards===1); }

console.log("── the batch, Undo, dry run ──");
const md0=()=>({ava:[{id:"i1",status:"introduction"},{id:"i2",status:"active",tier:"weekly"}],
  ava_settings:{intro_dots:5,max_learn_per_drill:0,missPlay:{on:true,cap:0}},
  ava_sessions:{s1:{name:"Daily Study",kind:"all",newPerDay:5,passes:2},mx:{name:"Mix",kind:"mix",mixFinish:20},ck:{name:"Check",kind:"checkup",perDay:5},envirothon:{name:"Class",kind:"deck",decks:["d"],newPerDay:5}},
  ben_settings:{}});
{ const w=world({md:md0(),load:{ava:30}}); const before=JSON.parse(JSON.stringify(w.masteryData));
  ok("boot + render write nothing", (w.run("mldDialHtml")("ava"),w.run("renderMPScores")({innerHTML:""},""),w.calls.length===0), w.calls);
  const b=w.run("mldSet")("ava",30,2);
  const ups=w.calls.filter(x=>x.op==="update"), keys=ups.length?Object.keys(ups[0].u).sort():[];
  const expect=["ava_settings/load/budgetMin","ava_settings/load/sittings","ava_settings/load/last","ava_settings/max_learn_per_drill","ava_settings/max_overdue_per_drill","ava_settings/missPlay/cap","ava_sessions/s1/newPerDay","ava_sessions/s1/maxCards","ava_sessions/mx/mixFinish"].map(k=>"mastery/"+k).sort();
  ok("one tap = ONE multi-path update at the root, nothing else (no set, no remove)", w.calls.filter(x=>x.op!=="ref").length===1&&ups.length===1&&ups[0].p===undefined, w.calls.map(x=>x.op+" "+x.p));
  ok("…exactly the knob paths (+ the dial and load/last); never the check-up or the class session; never a whole node", JSON.stringify(keys)===JSON.stringify(expect), keys);
  ok("the local memory matches what was written", w.masteryData.ava_settings.load.budgetMin===30&&w.masteryData.ava_settings.load.sittings===2&&w.masteryData.ava_sessions.s1.newPerDay===ups[0].u["mastery/ava_sessions/s1/newPerDay"]);
  ok("load/last lists what moved (from → to) and how to put it back", b.moved.some(m=>m.k==="newPerDay"&&m.sid==="s1"&&m.from===5)&&b.undo.some(u=>u.p==="mastery/ava_settings/load/budgetMin"&&u.gone)&&b.undo.some(u=>u.p==="mastery/ava_sessions/s1/newPerDay"&&u.was===5));
  const html=w.run("mldDialHtml")("ava");
  ok("the card shows the 'what changed' line and an Undo", /Moved: New a day \(Daily Study\) 5 → \d+/.test(html)&&/Learning cards a drill 0 → \d+/.test(html)&&/mldUndo\('ava'\)/.test(html), html);
  ok("the same dial again → nothing moved, nothing written", w.run("mldSet")("ava",30,2)===false&&w.calls.filter(x=>x.op==="update").length===1);
  w.run("mldUndo")("ava"); const u2=w.calls.filter(x=>x.op==="update")[1];
  ok("Undo is one multi-path update: every moved path back to its old value (gone → null) and load/last cleared", u2&&u2.u["mastery/ava_sessions/s1/newPerDay"]===5&&u2.u["mastery/ava_settings/load/budgetMin"]===null&&u2.u["mastery/ava_settings/max_learn_per_drill"]===0&&u2.u["mastery/ava_settings/load/last"]===null, u2&&u2.u);
  const after=JSON.parse(JSON.stringify(w.masteryData)); if(after.ava_settings.load&&!Object.keys(after.ava_settings.load).length) delete after.ava_settings.load;
  ok("…and this device's memory is back exactly as it was", JSON.stringify(after)===JSON.stringify(before), after.ava_settings); }
{ const w=world({md:md0(),dry:true}); w.run("mldSet")("ava",30,2); w.run("mldUndo")("ava");
  ok("dry run: a tap and an Undo write nothing", w.calls.length===0, w.calls); }
{ const w=world({md:md0(),mom:false}); ok("not Mom → no write", w.run("mldSet")("ava",30,2)===false&&w.run("mldUndo")("ava")===false&&w.calls.length===0); }
{ const w=world({md:md0(),noDb:true}); ok("no database (demo / offline) → no throw, memory only", w.run("mldSet")("ava",20,1)&&w.masteryData.ava_settings.load.budgetMin===20); }
{ const w=world({md:md0()}); w.run("mldStep")("ava",1,0);
  ok("the stepper: + from the 25 default (grade 3) → 30, sittings stay 1", w.masteryData.ava_settings.load.budgetMin===30&&w.masteryData.ava_settings.load.sittings===1);
  w.run("mldStep")("ava",0,1); w.run("mldStep")("ava",0,9); ok("sittings top out at 4; minutes at 5–120", w.masteryData.ava_settings.load.sittings===4&&(w.run("mldSet")("ava",500,1),w.masteryData.ava_settings.load.budgetMin===120)&&(w.run("mldSet")("ava",1,1),w.masteryData.ava_settings.load.budgetMin===5)); }
{ const w=world({md:{},rdef:[{id:"ava",grade:"",schoolAge:true}],roster:["ava"]});
  ok("no grade, no dial: the card says so, the first + starts at 15", /No grade on the roster/.test(w.run("mldDialHtml")("ava"))&&(w.run("mldStep")("ava",1,0),w.masteryData.ava_settings.load.budgetMin===15)); }

console.log("── the meter reads the dial ──");
{ const w=world({md:{ava_settings:{}}}); const g=w.run("scpGather");
  ok("no stored budget → the meter reads the grade default (25), read only", g("ava").load&&g("ava").load.budget===25&&w.calls.length===0, g("ava").load);
  ok("…a Pre-K kid with no grade reads 12", g("ben").load&&g("ben").load.budget===12);
  w.masteryData.ava_settings.load={budgetMin:40}; ok("a stored dial wins", g("ava").load.budget===40);
  const el={innerHTML:""}; w.run("renderMPScores")(el,""); ok("each kid's card carries the dial", el.innerHTML.split('class="mld-dial"').length===3&&/Suggested for Pre-K/.test(el.innerHTML)); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
