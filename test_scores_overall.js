/* 📊 SCORESPAGE — the Overall card + Load meter (slice 1 of PLAN_scores_page_2026-11-03.md; her "Start it" 2026-11-03).
   Mom's Day ▸ School ▸ 📊 Scores: per kid Right % (drills + study + games at ½), Ladder (average rung), Week (done ÷ planned),
   Minutes a school day, "Where things are at" = (Right + Ladder + Week) ÷ 3 with the formula under it, Load = minutes ÷ budget
   (Light < 75 % · Steady · Heavy > 125 %), "no budget set yet" without one. Read-only. Fixture family (ava · ben), touches no live data.
   run: node test_scores_overall.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const blk=(a,z)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(z,i); if(j<0) throw new Error("missing end "+z); return src.slice(i,j); };
const a=src.indexOf("// SCORESPAGE_START"), b=src.indexOf("// SCORESPAGE_END"); const block=src.slice(a,b);

console.log("── the block ──");
ok("marked once, right after SCORES_END", a>0&&b>a&&src.split("// SCORESPAGE_START").length===2&&src.split("// SCORESPAGE_END").length===2&&src.lastIndexOf("// SCORES_END",a)>a-20);
ok("every inline <script> still compiles", (()=>{ const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m,n=0; while((m=re.exec(src))){ n++; try{ new vm.Script(m[1]); }catch(e){ console.log("    script #"+n+": "+e.message); return false; } } return n>0; })());
ok("no family or kid name in the block", !/lincoln|ellis|lucy|julian|howe|dewalt|burris|taylor|makenzie|andrew|caleb/i.test(block));
ok("read-only: the block never writes (no db.ref, firebase, set, update, remove, transaction, HA_LS.setItem)", !/db\.ref\(|firebase|\.set\(|\.update\(|\.remove\(|\.transaction\(|HA_LS\.setItem/.test(block));

// the pure functions + STUDYCOUNTS' graded-day merge, in a bare context
const ctx={console}; vm.createContext(ctx);
vm.runInContext(blk("const SC_RANK=","\n// History-shaped view")+"\n"+block,ctx);
const run=e=>vm.runInContext(e,ctx);
const api={}; ["scpShift","scpWin","scpPrevWin","scpRight","scpLadder","scpWeek","scpPrevWeek","scpMinutes","scpLoad","scpHeadline","scpFormula","scpKidNumbers","scpArrow","scpCardHtml","scpFamilyHtml"].forEach(n=>{ api[n]=run(n); });

console.log("── windows ──");
ok("scpShift crosses a month and a year", api.scpShift("20261103",-6)==="20261028"&&api.scpShift("20260101",-1)==="20251231"&&api.scpShift("20261103",1)==="20261104");
ok("a 7-day window ends today and starts 6 days back; the window before it sits just before", JSON.stringify(api.scpWin("20261103",7))==='{"from":"20261028","to":"20261103"}'&&JSON.stringify(api.scpPrevWin(api.scpWin("20261103",7),7))==='{"from":"20261021","to":"20261027"}');
ok("a 28-day window", api.scpWin("20261103",28).from==="20261007");

console.log("── Right % ──");
const W={from:"20261028",to:"20261103"};
const history={ava:{"20261102":{date:"2026-11-02",secs:202,sessTimes:[202],items:[{id:"a1",result:"c"},{id:"a2",result:"m"},{id:"a3",result:"~"},{id:"a4",result:"shown"}]},
                    "20261020":{date:"2026-10-20",secs:60,items:[{id:"a1",result:"m"}]}}};
const studyLog={ava:{sess1:{"20261102":{date:"2026-11-02",secs:600,sits:[{secs:300},{secs:300}],items:[{id:"a1",name:"one",result:"m"},{id:"a5",name:"five",result:"c"},{id:"a6",name:"six",result:"shown"}]},
                            "20261101":{date:"2026-11-01",secs:9000,items:[{id:"a7",name:"seven",result:"c"}]}}}};
const gameLog={ava:{"20261103":{p1:{game:"mole",deck:"D",at:1,secs:120,items:[{id:"a1",n:1,ok:true},{id:"a2",n:2,ok:false},{id:"a2",n:1,ok:true,back:true}]}}}};
{ const r=api.scpRight("ava",history,{},{},W);
  ok("drill only: c=right, m and ~ graded, shown not graded → 1 of 3", r.drill.g===3&&r.drill.r===1&&r.pct===33, r);
  ok("a day outside the window is left out", api.scpRight("ava",history,{},{},{from:"20261001",to:"20261027"}).drill.g===1); }
{ const r=api.scpRight("ava",history,studyLog,{},W);
  ok("drill + study: a card graded in both on one day counts ONCE, the worse grade (a1: drill c, study m → m)", r.drill.g===3&&r.drill.r===0&&r.study.g===2&&r.study.r===2&&r.graded===5&&r.right===2, r);
  ok("…so Right = 2 of 5 = 40", r.pct===40); }
{ const r=api.scpRight("ava",history,studyLog,gameLog,W);
  ok("games at ½ weight: 2 first taps (1 right; the came-back tap ignored) → graded 5+1, right 2+0.5 → 42", r.games.n===2&&r.games.ok===1&&r.graded===6&&r.right===2.5&&r.pct===42, r);
  ok("a game weight of 0 drops them; 1 counts them whole", api.scpRight("ava",history,studyLog,gameLog,W,0).pct===40&&api.scpRight("ava",history,studyLog,gameLog,W,1).pct===43); }
ok("nothing graded → pct null, zero counts", JSON.stringify(api.scpRight("ben",history,studyLog,gameLog,W))==='{"graded":0,"right":0,"pct":null,"drill":{"g":0,"r":0},"study":{"g":0,"r":0},"games":{"n":0,"ok":0}}');
ok("missing logs → no throw", api.scpRight("ava",null,null,null,W).pct===null&&api.scpRight("ava",undefined,undefined,undefined,W).graded===0);

console.log("── Ladder ──");
const cards=[{id:"a1",status:"active",tier:"weekly"},{id:"a2",status:"active",tier:"monthly"},{id:"a3",status:"introduction",tier:"daily"},{id:"a4",status:"parked",tier:"weekly"},{id:"a5",status:"active",tier:"graduated"},{id:"a6",status:"active",tier:"odd_rung"},null];
{ const l=api.scpLadder(cards);
  ok("weekly 40 + monthly 80 + learning 0 + graduated 100 = 220 ÷ 4 = 55; parked out; an unknown rung counted but not averaged", l.score===55&&l.n===5&&l.rungs.learning===1&&l.rungs.weekly===1&&l.rungs.graduated===1&&!("odd_rung" in l.rungs), l);
  ok("every rung in order: learning 0 · eod 20 · etd 30 · weekly 40 · bi-weekly 60 · monthly 80 · learned 90 · graduated 100", JSON.stringify(run("SCP_RUNG"))==='{"daily":0,"every_other_day":20,"every_third_day":30,"weekly":40,"bi_weekly":60,"monthly":80,"learned":90,"graduated":100}');
  ok("an object of cards (Firebase shape) reads the same as an array", api.scpLadder({x:cards[0],y:cards[1]}).score===60);
  ok("no cards → score null, 0 in play", api.scpLadder([]).score===null&&api.scpLadder(undefined).n===0); }

console.log("── Week ──");
const tasks=[{id:"t1",who:"ava",title:"Math"},{id:"t2",who:"ava",title:"Reading"},{id:"t3",who:"ava",title:"🍽 Lunch"},{id:"t2_c",who:"ava",title:"Reading"},{id:"t4",who:"ava",title:"Spelling"},{id:"b1",who:"ben",title:"Math"}];
{ const w=api.scpWeek(tasks,{t1:"x",t2_c:"y"},"ava");
  ok("ava: 3 planned (no lunch, no carry copy), 2 done (t1 checked; t2 through its carry copy) → 67", w.planned===3&&w.done===2&&w.pct===67, w);
  ok("ben: 1 planned, 0 done → 0; a kid with no cards → pct null", api.scpWeek(tasks,{},"ben").pct===0&&api.scpWeek(tasks,{},"cy").pct===null);
  const prev=api.scpPrevWeek({week28:{weekLabel:"Week 28",tasks:[{id:"p",who:"ava",title:"x"}],checked:{p:1}},week29:{weekLabel:"Week 29",tasks:[{id:"q",who:"ava",title:"x"}]},week31:{weekLabel:"Week 31",tasks:[]}},30);
  ok("last week = the highest archived week below the current one (29, not 31)", prev&&prev.num===29&&api.scpWeek(prev.tasks,prev.checked,"ava").pct===0);
  ok("no archive → null", api.scpPrevWeek({},30)===null&&api.scpPrevWeek(null,30)===null); }

console.log("── Minutes ──");
{ const m=api.scpMinutes("ava",history,studyLog,gameLog,W,5);
  ok("drill 202 s (sessTimes, not secs twice) + study 600 s (the sits) + games 120 s at ½ = 862 s ≈ 14 min ÷ 5 school days = 3 a day; the 9000 s sitting left open is skipped", m.drill===3&&m.study===10&&m.games===2&&m.total===14&&m.days===5&&m.perDay===3&&m.any===true, m);
  ok("school days floor at 1", api.scpMinutes("ava",history,studyLog,gameLog,W,0).days===1);
  ok("nothing in the window → any false, 0 everywhere", api.scpMinutes("ben",history,studyLog,gameLog,W,5).any===false&&api.scpMinutes("ava",history,studyLog,gameLog,{from:"20260101",to:"20260102"},5).total===0); }

console.log("── Load + headline ──");
ok("no budget → null (nothing to compare to)", api.scpLoad(20,null)===null&&api.scpLoad(20,0)===null&&api.scpLoad(20,"")===null&&api.scpLoad(null,35)===null);
ok("Light under 75 %: 26 of 35 = 74 %", api.scpLoad(26,35).word==="Light"&&api.scpLoad(26,35).ratio===74);
ok("Steady from 75 % to 125 %: 27 of 35, 35 of 35, 43 of 35", api.scpLoad(27,35).word==="Steady"&&api.scpLoad(35,35).word==="Steady"&&api.scpLoad(43,35).word==="Steady");
ok("Heavy over 125 %: 44 of 35 = 126 %", api.scpLoad(44,35).word==="Heavy"&&api.scpLoad(44,35).ratio===126);
ok("a budget typed as a string still counts", api.scpLoad(10,"12").word==="Steady");
ok("headline = (Right + Ladder + Week) ÷ 3, rounded", api.scpHeadline(87,47,30)===55&&api.scpHeadline(93,44,29)===55);
ok("…the parts that exist when one is missing; null when none", api.scpHeadline(null,50,30)===40&&api.scpHeadline(null,null,null)===null);
ok("the formula is printed in words", api.scpFormula(87,47,30)==="Right 87 + Ladder 47 + Week 30 ÷ 3"&&api.scpFormula(null,50,null)==="Ladder 50 ÷ 1"&&api.scpFormula(null,null,null)==="nothing logged yet");
ok("arrows: ▲ / ▼ with the difference, · inside 3 points, · when either side is missing", /▲10/.test(api.scpArrow(87,77))&&/▼5/.test(api.scpArrow(30,35))&&/·/.test(api.scpArrow(50,52))&&/·/.test(api.scpArrow(50,null)));

console.log("── one kid, end to end ──");
const D={history,studyLog,gameLog,cards,tasks,checked:{t1:1,t2_c:1},prev:{tasks:[{id:"p1",who:"ava",title:"x"},{id:"p2",who:"ava",title:"y"}],checked:{p1:1}},budgetMin:12,today:"20261103",schoolDays:(f,t)=>(t==="20261103"&&f==="20261028")?5:(f==="20261007"?20:5)};
{ const r=api.scpKidNumbers("ava",D);
  ok("Right 42 · Ladder 55 · Week 67 → headline 55, formula under it", r.right.w7.pct===42&&r.ladder.score===55&&r.week.pct===67&&r.headline===55&&r.formula==="Right 42 + Ladder 55 + Week 67 ÷ 3", {h:r.headline,f:r.formula});
  ok("minutes 3 a day over 5 school days; Load Light (3 of 12 = 25 %)", r.min.w7.perDay===3&&r.min.w7.days===5&&r.load&&r.load.word==="Light"&&r.load.ratio===25, r.load);
  ok("last week 50 % beside this week", r.last&&r.last.pct===50);
  ok("the 4-week window sees the 10/20 drill too (28-day graded 7, 7-day graded 6)", r.right.w28.graded===7&&r.right.w7.graded===6, [r.right.w28.graded,r.right.w7.graded]);
  ok("no budget → load null; still every other number", api.scpKidNumbers("ava",Object.assign({},D,{budgetMin:undefined})).load===null);
  const e=api.scpKidNumbers("ben",{today:"20261103"});
  ok("a kid with nothing at all: no throw, any=false, headline null, 'nothing logged yet'", e.any===false&&e.headline===null&&e.formula==="nothing logged yet"&&e.right.w7.pct===null&&e.ladder.score===null);
  ok("today defaults to the drill's day key when none is given", /^\d{8}$/.test(api.scpKidNumbers("ben",{}).today)); }

console.log("── the card ──");
{ const r=api.scpKidNumbers("ava",D); run("var KID_NAME={ava:'Ava',ben:'Ben'}, KID_COLOR={ava:'#123456'};");
  const h=api.scpCardHtml(r);
  ok("name + colour from the roster, the headline big, the formula under it", /#123456/.test(h)&&/>Ava</.test(h)&&/font-size:40px[^>]*>55</.test(h)&&/Right 42 \+ Ladder 55 \+ Week 67 ÷ 3/.test(h));
  ok("four tiles: Right · Ladder · Week · Minutes", /Right<\/div>[\s\S]*42%/.test(h)&&/Ladder<\/div>[\s\S]*>55</.test(h)&&/Week<\/div>[\s\S]*67%[\s\S]*2 of 3 · last week 50%/.test(h)&&/Minutes<\/div>[\s\S]*>3<[\s\S]*a school day · 5 days/.test(h));
  ok("the Load pill with the budget and the split", /⚖️ Light<\/span> <span[^>]*>3 min a school day of 12 \(25%\) · drill 3 · study 10 · games 2/.test(h));
  ok("'How these are counted' fold names every rule", /How these are counted/.test(h)&&/half weight/.test(h)&&/Parked cards stay out/.test(h)&&/left open over 2 hours/.test(h)&&/Light under 75%/.test(h));
  const h2=api.scpCardHtml(api.scpKidNumbers("ava",Object.assign({},D,{budgetMin:null})));
  ok("no budget → 'no budget set yet' with the minutes split, no pill", /Load: no budget set yet · drill 3 · study 10 · games 2 min this week/.test(h2)&&!/⚖️ Light/.test(h2));
  const h3=api.scpCardHtml(api.scpKidNumbers("ben",{today:"20261103"}));
  ok("an empty kid draws a calm line, no numbers", /Nothing logged yet/.test(h3)&&!/font-size:40px/.test(h3));
  ok("the family line averages the headlines that exist", /^<div[^>]*><div[^>]*>50<\/div>/.test(api.scpFamilyHtml([{headline:55},{headline:45},{headline:null}]))&&api.scpFamilyHtml([{headline:null}])===""); }

console.log("── the page ──");
{ const KIT=src.slice(src.indexOf("// KITCHENTAB_START"),src.indexOf("// KITCHENTAB_END")), SCH=src.slice(src.indexOf("// SCHOOLTAB_START"),src.indexOf("// SCHOOLTAB_END"));
  const h=new Function("HA_LS","pageOn","mpGoto","mdFrameOpen","mwBanner","mpSubnav","document","window","ROSTER","cap",KIT+"\n"+SCH+"\nreturn {mpSchoolRow,mpSchoolSub,MP_SCHOOL,MP_SCHOOL_VIEWS,MP_SCHOOL_SUBS};")({getItem:()=>null,setItem:()=>{}},()=>true,()=>{},()=>{},s=>s,()=>"",{getElementById:()=>null},{scrollTo:()=>{}},["ava","ben"],s=>s);
  ok("the 📊 Scores chip sits last on the School row, after 🌟 Wins", /mpSchoolOpen\('wins'\)[^>]*>🌟 Wins<\/button><button onclick="mpSchoolOpen\('scores'\)[^>]*>📊 Scores<\/button><\/div>$/.test(h.mpSchoolRow("notebook")));
  ok("…outlined when it is the page", /mpSchoolOpen\('scores'\)" style="[^"]*border:1.5px solid #2B7A78/.test(h.mpSchoolRow("scores")));
  ok("chip → sub-view 'scor'; MP_SCHOOL remembers it; the subtitle says what it is", h.mpSchoolSub("scores")==="scor"&&h.MP_SCHOOL.indexOf("scores")>=0&&h.MP_SCHOOL_VIEWS.scor==="scores"&&/right %, ladder, week, minutes, load/.test(h.MP_SCHOOL_SUBS.scores));
  ok("'scor' is routed: in SS_OTHER_VIEWS and renderMPSchool hands it to renderMPScores", (()=>{ const m=src.match(/const SS_OTHER_VIEWS=(\[[^\]]*\])/); const l=m?JSON.parse(m[1]):[]; return l.indexOf("scor")>=0&&/if\(key==='scores'&&typeof renderMPScores==="function"\)\{ renderMPScores\(el,top\); return; \}/.test(fn("renderMPSchool")); })());
  // renderMPScores in a world
  const world=(mom,md,tk)=>{ const c={console,momHere:()=>mom,ROSTER:["ava","ben"],KID_NAME:{ava:"Ava",ben:"Ben"},KID_COLOR:{},masteryData:md||{},weekData:{tasks:tk||tasks},checked:{t1:1},archive:{},currWeekNum:()=>30,mstTodayKey:()=>"20261103",mastSchoolDayNum:(k,d)=>{ const n=Math.round(Date.parse(d)/86400000); return n-Math.round(n/7)*2; },document:{getElementById:()=>null}};
    vm.createContext(c); vm.runInContext(blk("const SC_RANK=","\n// History-shaped view")+"\n"+block,c); const el={innerHTML:""}; vm.runInContext("renderMPScores",c)(el,"<top>"); return {el,c}; };
  ok("Mom off → Mom-only line, no card", /Mom only/.test(world(false).el.innerHTML)&&!/scp-card/.test(world(false).el.innerHTML));
  { const w=world(true,{history,studyLog,gameLog,ava:cards,ava_settings:{load:{budgetMin:12}}});
    ok("Mom on, All: the banner, a kid row (All · Ava · Ben), the family line, one card per kid", /^<top>/.test(w.el.innerHTML)&&/scpPick\('all'\)[^>]*>All<\/button><button onclick="scpPick\('ava'\)[^>]*>Ava<\/button><button onclick="scpPick\('ben'\)[^>]*>Ben</.test(w.el.innerHTML)&&/The family, where things are at/.test(w.el.innerHTML)&&w.el.innerHTML.split('class="scp-card"').length===3);
    ok("…ava has the pill from her budget; ben, with one planned card and nothing else, shows Week 0 of 1 and 'no budget set yet'", /⚖️ Light/.test(w.el.innerHTML)&&/0 of 1/.test(w.el.innerHTML)&&/no budget set yet/.test(w.el.innerHTML)&&!/Nothing logged yet/.test(w.el.innerHTML));
    ok("…the school-day count comes from the drill clock (5 school days in the 7)", /a school day · 5 days/.test(w.el.innerHTML)); }
  ok("a new family (empty masteryData, no week yet) draws every kid's calm card, no family line, no throw", (()=>{ const w=world(true,{},[]); return w.el.innerHTML.split('class="scp-card"').length===3&&w.el.innerHTML.split("Nothing logged yet").length===3&&!/family, where/.test(w.el.innerHTML); })());
  ok("empty masteryData with a built week: Week is the only number, the headline is Week alone", (()=>{ const w=world(true,{}); return /Week 33 ÷ 1/.test(w.el.innerHTML)&&/Week 0 ÷ 1/.test(w.el.innerHTML)&&/Right<\/div>[\s\S]*?—/.test(w.el.innerHTML); })());
  ok("one kid picked → that card alone, no family line", (()=>{ const w=world(true,{ava:cards}); vm.runInContext("scpKid='ben'",w.c); const el={innerHTML:""}; vm.runInContext("renderMPScores",w.c)(el,""); return el.innerHTML.split('class="scp-card"').length===2&&/>Ben</.test(el.innerHTML)&&!/family, where/.test(el.innerHTML); })());
  ok("a stale pick (a kid no longer on the roster) falls back to All", (()=>{ const w=world(true,{}); vm.runInContext("scpKid='zed'",w.c); const el={innerHTML:""}; vm.runInContext("renderMPScores",w.c)(el,""); return vm.runInContext("scpKid",w.c)==="all"; })()); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
