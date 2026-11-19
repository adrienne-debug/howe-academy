/*
 * 📅 MVTRELAY — after Mom's "📅 Move to today" the rest of THAT subject's week slides up (her approval 2026-11-19, from a beta
 * family's report: a kid's math was moved Wed→Tue and Fri→Wed; the kid worked ahead, lessons were all checked by Wednesday and
 * Friday had no math card — the move took one card and nothing followed it).
 * Now the move hands that one kid + subject to the week's own re-lay (relayWeek → reprojectSubjectWeek, "from tomorrow"):
 *   · the subject's open lessons slide up into its own days and the plan's next lesson fills the freed day, in the slot the
 *     moved card left (nothing else on that day moves);
 *   · other subjects, other kids, checked cards, history and lesson records stay byte-for-byte as they were;
 *   · days the subject is not allowed on stay empty;
 *   · one line says what moved, and its Undo puts the week back exactly as it was before the re-lay;
 *   · ?dryrun=1 writes nothing.
 * The SYNTHETIC demo family (no real names or data) in the whole-app vm sandbox of test_demo_week.js. Kid B's math runs
 * Mon/Tue/Wed/Fri (4×/week, Mom required) — the shape of the live report (a day the subject is not on, mid-week).
 *   run: node test_mvt_relay.js        (MV_VERBOSE=1 echoes the app's console)
 */
"use strict";
process.env.TZ="America/New_York";
const fs=require("fs"), path=require("path");
const S=require(path.join(__dirname,"test_fixtures","demo_week_sandbox.js"));
const FX=JSON.parse(fs.readFileSync(path.join(__dirname,"test_fixtures","living_demo_family.json"),"utf8"));
const INDEX=path.join(__dirname,"index.html");
const SRC=fs.readFileSync(INDEX,"utf8");

let pass=0, fail=0;
function ok(n,c,x){ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+(typeof x==="string"?x:JSON.stringify(x)).slice(0,700)+")":"")); } }
const J=x=>JSON.stringify(x);
const hm=(iso,h,m)=>{ const d=new Date(iso+"T12:00:00"); d.setHours(h,m,0,0); return d.getTime(); };
const DAYS=["monday","tuesday","wednesday","thursday","friday","saturday"];
const MON="2026-11-09";

// boot Sunday 11/8 (week 1 builds itself), roll into Monday 11/9; o.dryrun: this device runs ?dryrun=1 from the start of Monday
async function world(o){
  o=o||{};
  const clock=S.makeClock(hm("2026-11-08",0,0)+30000); clock.boot=clock.now;
  const sched=S.makeScheduler(clock);
  const db=S.makeDb(FX.db,clock,sched);
  const flush=async ms=>{ await sched.run(clock.now+(ms==null?30000:ms)); };
  const A=S.bootDevice({name:"A (Mom)",dev:"dev_a",db,clock,sched,family:FX.family,indexPath:INDEX,verbose:!!process.env.MV_VERBOSE});
  A.momOn(); await flush(500);
  A.fn("dayRollCheck")(); await flush(90000);
  clock.now=hm(MON,0,0)+30000; A.fn("dayRollCheck")(); await flush(90000);
  A.run("globalThis.__toasts=[]; gwShowToast=function(m){ globalThis.__toasts.push(String(m)); };");
  const W={A,db,clock,flush,
    wk:()=>db.get("ha_active_wk")||A.get("WK"),
    board:()=>JSON.parse(J(db.get(W.wk()+"/tasks")||{})),
    checked:()=>db.get(W.wk()+"/checked")||{},
    toasts:()=>A.get("globalThis.__toasts").slice()};
  W.cards=(kid,sk,b)=>Object.values(b||W.board()).filter(t=>t&&t.who===kid&&t.subjectKey===sk&&!String(t.id).endsWith("_c")).sort((a,c)=>DAYS.indexOf(a.day)-DAYS.indexOf(c.day)||String(a.lid).localeCompare(String(c.lid)));
  W.desc=(kid,sk,b)=>W.cards(kid,sk,b).map(t=>t.day.slice(0,3)+" "+t.time+" "+t.lid+(W.checked()[t.id]?" ✓":""));
  W.idOf=(kid,sk,day)=>{ const t=W.cards(kid,sk).find(x=>x.day===day); return t&&t.id; };
  W.check=async(id,atMs)=>{ clock.now=atMs; A.fn("finalizeDone")(id,A.fn("nowTs")()); await flush(4000); };
  W.lastLog=()=>{ const L=db.get(W.wk()+"/relayLog")||{}; const k=Object.keys(L).sort().pop(); return k?L[k]:null; };
  // Mom's tap: the move is written at once; the re-lay waits its 2 s (relayWeek's own wait) and runs
  W.move=async(id,atMs)=>{ clock.now=atMs; A.fn("momMoveToToday")(id); await flush(500); const mid=W.board(); await flush(90000); return mid; };
  return W;
}
// every card that is NOT this kid+subject, keyed by id — compared as JSON
function others(b,kid,sk){ const o={}; Object.keys(b).forEach(id=>{ const t=b[id]; if(!(t&&t.who===kid&&t.subjectKey===sk)) o[id]=t; }); return o; }

(async()=>{
  console.log("── the block is marked and wired");
  {
    const a=SRC.indexOf("// MVTRELAY_START"), b=SRC.indexOf("// MVTRELAY_END");
    ok("MVTRELAY block present, cites the approval and the date",a>=0&&b>a&&/2026-11-19/.test(SRC.slice(a,b)));
    ok("momMoveToToday hands the subject to the re-lay after its own write",/function momMoveToToday[\s\S]{0,2200}mvtRelaySubject\(t,p\.from,rec\.fromTime\)/.test(SRC));
    ok("the re-lay goes through relayWeek (no second scheduler)",/function mvtRelaySubject[\s\S]{0,600}relayWeek\("movetoday"/.test(SRC));
  }

  console.log("\n── pure helpers");
  {
    const W=await world();
    const only=W.A.fn("_rlwMvtOnly");
    ok("a run of moves alone is move-only",only({whys:["movetoday","movetoday"],mvt:[{id:"x"}]})===true);
    ok("a move merged with another edit in the same 2 s is not (the sweep still runs for it)",only({whys:["movetoday","curriculum"],mvt:[{id:"x"}]})===false);
    ok("no move → not move-only",only({whys:["curriculum"]})===false);
    const canU=W.A.fn("_rlwCanUndo"), now=Date.now();
    ok("a move's re-lay offers Undo with no trigger path",canU({at:now,mvt:{line:"x"}},now+1000)===true);
    ok("…but not once undone, nor after 15 min",canU({at:now,mvt:{line:"x"},undone:1},now+1000)===false&&canU({at:now,mvt:{line:"x"}},now+16*60000)===false);
    ok("an entry with neither undo nor a move still has no Undo (the 8 PM sweep)",canU({at:now},now+1000)===false);
    const tasks=[{id:"m3",who:"kid_x",subjectKey:"sums",title:"📄 Sums — Lesson 3",day:"tuesday"},{id:"m4",who:"kid_x",subjectKey:"sums",title:"📄 Sums — Lesson 4",day:"friday"},{id:"o1",who:"kid_y",subjectKey:"art",title:"Art",day:"friday"}];
    const line=W.A.fn("_mvtRelayLine")({moves:[{id:"m3",ti:"📄 Sums — Lesson 3",to:{d:"tuesday"}}],added:["m4"],removed:[],boxed:[]},tasks,[{kid:"kid_x",sk:"sums"}],"Sums");
    ok("the line names each lesson and its new day",line==="Sums: Lesson 3 → Tue, Lesson 4 → Fri",line);
    const line2=W.A.fn("_mvtRelayLine")({moves:[{id:"o1",ti:"Art",to:{d:"friday"}}],added:[],removed:[],boxed:[]},tasks,[{kid:"kid_x",sk:"sums"}],"Sums");
    ok("anything else that moved is never hidden",/1 other card moved/.test(line2),line2);
    ok("a daily (not Builder-paced) is never re-laid by a move",W.A.fn("mvtRelaySubject")({id:"x",who:"kid_c",subjectKey:"handwriting"},"tuesday","9:00 AM")===false&&W.A.get("_rlwPend")===null);
  }

  console.log("\n── 1. slide-up + the plan's next lesson (Kid B's math, Mon/Tue/Wed/Fri) — Mom moves Tuesday's lesson to Monday");
  let W1, mid1, before1;
  {
    const W=await world(); W1=W;
    const kid="kid_b", sk="math";
    // Monday morning: a few cards checked — they are records and must never move
    await W.check(W.idOf(kid,sk,"monday"),hm(MON,10,5));
    const sp=W.idOf(kid,"spelling","monday"); if(sp) await W.check(sp,hm(MON,10,10));
    const c0=W.cards(kid,sk);
    ok("premise: L1 Mon ✓, L2 Tue, L3 Wed, L4 Fri, nothing Thursday",J(c0.map(t=>t.day+" "+t.lid))===J(["monday L0001","tuesday L0002","wednesday L0003","friday L0004"]),W.desc(kid,sk));
    const slot=d=>(c0.find(t=>t.day===d)||{}).time;
    const tue=slot("tuesday"), wed=slot("wednesday"), fri=slot("friday");
    before1=W.board(); const ck0=J(W.checked()), h0=J(W.db.get(W.wk()+"/history")), d0=J(W.db.get("curriculum/done"));
    const mark=W.db.log.length;
    mid1=await W.move(W.idOf(kid,sk,"tuesday"),hm(MON,10,30));
    const c=W.cards(kid,sk);
    ok("L2 is on Monday (the move)",(c.find(t=>t.lid==="L0002")||{}).day==="monday",W.desc(kid,sk));
    ok("L3 slid up Wed → Tue, into the slot the moved card left",J(c.filter(t=>t.lid==="L0003").map(t=>t.day+" "+t.time))===J(["tuesday "+tue]),W.desc(kid,sk));
    ok("L4 slid up Fri → Wed, into L3's slot",J(c.filter(t=>t.lid==="L0004").map(t=>t.day+" "+t.time))===J(["wednesday "+wed]),W.desc(kid,sk));
    ok("the plan's next lesson L5 fills Friday, in L4's slot",J(c.filter(t=>t.lid==="L0005").map(t=>t.day+" "+t.time))===J(["friday "+fri]),W.desc(kid,sk));
    ok("allowed days: still nothing on Thursday (not one of its days) and nothing on Saturday",!c.some(t=>t.day==="thursday"||t.day==="saturday"),W.desc(kid,sk));
    ok("one card per day, no lesson twice",c.length===5&&new Set(c.map(t=>t.lid)).size===5,W.desc(kid,sk));
    ok("every other card in the week (other subjects, other kids) is byte-for-byte unchanged",J(others(W.board(),kid,sk))===J(others(before1,kid,sk)));
    ok("checked cards never move: the checked Monday lesson is unchanged",J(W.board()[c0[0].id])===J(before1[c0[0].id]));
    ok("checked / history / lesson records unchanged",J(W.checked())===ck0&&J(W.db.get(W.wk()+"/history"))===h0&&J(W.db.get("curriculum/done"))===d0);
    const L=W.lastLog();
    const words=W.A.fn("_rlwWords")(L);
    ok("Mom's one line: what moved, in plain words",words==="📅 Math: Lesson 3 → Tue, Lesson 4 → Wed, Lesson 5 → Fri"||/^📅 Math: .*→ Tue, .*→ Wed, .*→ Fri$/.test(words),words);
    ok("…with Undo",W.A.fn("_rlwCanUndo")(L)===true);
    ok("…and the same words in the toast",W.toasts().some(m=>m.indexOf(words)>=0),W.toasts());
    // what was written: the move, then ONE targeted update of this subject's cards and the log line — no sweep, no whole node
    const wr=W.db.writesSince(mark).filter(w=>w.op!=="tx"&&w.path!=="_debug");
    const taskUpd=wr.filter(w=>w.op==="update"&&w.path===W.wk()+"/tasks");
    const mine=id=>{ const t=W.board()[String(id).split("/")[0]]||before1[String(id).split("/")[0]]; return t&&t.who===kid&&t.subjectKey===sk; };
    ok("every task write touches only this kid's math cards",taskUpd.length>=1&&taskUpd.every(w=>w.keys.every(mine)),taskUpd.map(w=>w.keys));
    ok("no whole-node write",!wr.some(w=>w.whole),wr.filter(w=>w.whole));
    ok("writes are the move, the subject's re-lay and the log line only",wr.every(w=>/\/(tasks|momMoves\/[^/]+|relayLog\/\d+)$/.test(w.path)),wr.map(w=>w.op+" "+w.path));
  }

  console.log("\n── 2. Undo puts the week back exactly as it was before the re-lay");
  {
    const W=W1; const L=W.lastLog();
    W.clock.now+=60000; W.A.fn("relayUndo")(String(L.at)); await W.flush(5000);
    ok("the whole week is byte-for-byte what it was right after the move, before the re-lay",J(W.board())===J(mid1),W.desc("kid_b","math"));
    ok("…which is the week before the move except the moved card itself",J(others(W.board(),"kid_b","math"))===J(others(before1,"kid_b","math")));
    const L2=W.lastLog();
    ok("the line now says undone, and Undo is gone",/· undone$/.test(W.A.fn("_rlwWords")(L2))&&W.A.fn("_rlwCanUndo")(L2)===false,W.A.fn("_rlwWords")(L2));
  }

  console.log("\n── 3. a lesson the kid already did ahead never moves (Kid C's math, Mon–Fri)");
  {
    // Thursday's lesson checked on Monday (on another device): the check puts that card on Monday at the time it was done
    // (the ts-heal, unchanged here), so Thursday has no math card when Mom then moves Tuesday's lesson to Monday.
    const W=await world();
    const kid="kid_c", sk="math";
    await W.check(W.idOf(kid,sk,"monday"),hm(MON,10,35));
    const thu=W.idOf(kid,sk,"thursday");
    await W.db.api("dev_t").ref(W.wk()+"/checked/"+thu).set("10:36 AM Nov 9"); await W.flush(5000);
    const b0=W.board();
    const mid=await W.move(W.idOf(kid,sk,"tuesday"),hm(MON,10,40));
    const c=W.cards(kid,sk);
    ok("the checked card is byte-for-byte unchanged",J(W.board()[thu])===J(b0[thu]),W.desc(kid,sk));
    ok("no lesson twice, one card a day after today",new Set(c.map(t=>t.lid)).size===c.length&&["tuesday","wednesday","thursday","friday"].every(d=>c.filter(t=>t.day===d).length===1),W.desc(kid,sk));
    const open=c.filter(t=>!W.checked()[t.id]&&t.day!=="monday").map(t=>t.lid);
    ok("the open lessons slide up in order and the plan's next ones fill the empty days",J(open)===J(["L0003","L0005","L0006","L0007"]),W.desc(kid,sk));
    // Thursday had no hole the move left, so the engine's own INSERT + SHIFT lays the new lesson there and that kid's later
    // Thursday cards make room (its rule, unchanged here). Nothing else in the week changes, and the line says so.
    const o0=others(mid,kid,sk), o1=others(W.board(),kid,sk);
    const ch=Object.keys(Object.assign({},o0,o1)).filter(id=>J(o0[id])!==J(o1[id]));
    ok("anything else the re-lay moved is this kid's, on the day the new lesson landed, same day, time only",ch.every(id=>o1[id]&&o0[id]&&o1[id].who===kid&&o1[id].day==="thursday"&&o0[id].day==="thursday"&&J(Object.assign({},o0[id],{time:o1[id].time}))===J(o1[id])),ch);
    ok("…and Mom's line counts it",!ch.length||new RegExp(ch.length+" other card").test(W.A.fn("_rlwWords")(W.lastLog())),W.A.fn("_rlwWords")(W.lastLog()));
    ok("other kids' weeks are byte-for-byte unchanged",Object.keys(o1).every(id=>o1[id].who===kid||J(o1[id])===J(o0[id])));
  }

  console.log("\n── 4. ?dryrun=1 writes nothing");
  {
    const W=await world();
    W.A.run('HA_LS.setItem("ha_dryrun","1")');
    ok("premise: this device is in dry run",W.A.fn("_dryRun")()===true);
    const kid="kid_b", sk="math"; const b0=W.board(); const mark=W.db.log.length;
    W.clock.now=hm(MON,10,30); W.A.fn("momMoveToToday")(W.idOf(kid,sk,"tuesday")); await W.flush(90000);
    const wr=W.db.writesSince(mark);
    ok("no database write at all (not even the scheduler lock)",wr.length===0,wr.map(w=>w.op+" "+w.path));
    ok("the database week is untouched",J(W.board())===J(b0));
    const mem=(W.A.tasks()||[]).filter(t=>t.who===kid&&t.subjectKey===sk).map(t=>t.day+" "+t.lid).sort();
    ok("…while this device's own copy shows the re-lay (L5 dealt to Friday)",mem.indexOf("friday L0005")>=0,mem);
  }

  console.log("\n"+pass+" passed, "+fail+" failed");
  process.exit(fail?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
