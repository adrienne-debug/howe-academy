/* 🩺 CKORDER (Adrienne 2026-10-28, Sara's day 10/27: "The fix I did for drills where I made it mix up everything has caused a major
 * issue with [the 7th-grader's] spelling checkup. It should not be mixing up the order … it should be doing 3 of each lesson in
 * each book. And it should start at book 1, lesson 1, and do the 3. It doesn't matter if those 3 mix up. If a lesson has already
 * passed … just check that one off … we need to be progressing through that in the order in which it was created.")
 *  1. mstSessions now carries lessonFrom/lessonTo — the range Mom set was saved but never read back, so every level's whole list was asked.
 *  2. ckLessonOrder: a famSort unit's level is put in lesson order (deck by deck put the word-less Lessons 1–6 after Lesson 24).
 *  3. ckMix(…, inFam): a SPELLING check-up keeps the plan's lesson order and mixes only inside one lesson; facts check-ups mix as before.
 *  4. passed / done lessons are skipped (counted as checked) and a half-asked one is finished first, in order — no data change needed.
 *   run: node test_checkup_order.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fnIn=(s,name)=>{ const i=s.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=s.indexOf("{",i);k<s.length;k++){ if(s[k]==="{") d++; else if(s[k]==="}"&&--d===0) return s.slice(i,k+1); } };
const line=start=>{ const i=src.indexOf(start); if(i<0) throw new Error("missing "+start); return src.slice(i,src.indexOf("\n",i)+1); };
// A two-level spelling unit shaped like the AAS starter: words deck first, then phonograms; Lessons 1–2 have no words.
const words=[], phon=[]; let o=0;
for(const st of [1,2]){ for(let L=3;L<=6;L++) for(const w of ["a","b","c","d"]) words.push({name:"L"+st+"w"+L+w,family:"Lesson "+L,lesson:L,order:++o,stage:st});
  for(let L=1;L<=6;L++) for(const p of ["x","y","z"]) phon.push({name:"L"+st+"p"+L+p,family:"Lesson "+L,lesson:L,order:++o,stage:st}); }
const unit={id:"spell",famSort:true,cardLessons:true,decks:[{key:"AAS Words",cards:words},{key:"Phonograms",cards:phon}]};
const facts=[]; o=0; for(let f=0;f<=2;f++) for(let b=0;b<=3;b++) facts.push({name:f+"×"+b,family:"× ÷ · "+f+"s",order:++o,stage:7});
const factsUnit={id:"facts",decks:[{key:"Math Facts",cards:facts}]};
const ctx={console,Math,String,Object,Array,Number,parseInt,isNaN,JSON,RegExp};
ctx.unitStudies={spell:unit,facts:factsUnit}; ctx.masteryData={}; vm.createContext(ctx);
vm.runInContext([line("const CK_DEFAULTS="),fnIn(src,"ckSlug"),fnIn(src,"ckFactors"),fnIn(src,"ckHard"),fnIn(src,"ckQuickPicks"),fnIn(src,"ckFamilies"),fnIn(src,"ckFamState"),fnIn(src,"ckPlan"),
  fnIn(src,"ckSeed"),fnIn(src,"ckMix"),fnIn(src,"ckSpanCards"),fnIn(src,"ckLessonOrder"),fnIn(src,"ckCards"),fnIn(src,"ckSessionFilter"),fnIn(src,"_ustCards"),fnIn(src,"_ustFamNum"),fnIn(src,"ckIsSpelling")].join("\n"),ctx);
const names=q=>q.map(x=>x.card.name), fams=q=>q.map(x=>x.fam);
const uniqRuns=arr=>arr.filter((f,i)=>i===0||f!==arr[i-1]);   // the sequence of lesson blocks as they are asked
console.log("── 1. the lesson range is read back ──");
ok("mstSessions carries lessonFrom and lessonTo beside stage/stageTo", /lessonFrom: rec\.lessonFrom, lessonTo: rec\.lessonTo,/.test(src));
const span={sid:"ck",kind:"checkup",unit:"spell",stage:1,stageTo:2,lessonTo:3,quick:3,perDay:10,untested:"spot",decks:[]};
const cards=ctx.ckCards(span);
ok("'Levels 1–2 · through L2 Lesson 3' = all of Level 1 and Level 2 up to Lesson 3 ("+cards.length+" cards)", cards.length===(16+18)+(4+9)&&cards.every(c=>c.stage===1||c.lesson<=3));
console.log("── 2. created order: Book 1 Lesson 1 first ──");
const plan=ctx.ckPlan(cards,span,{f:{},day:{}});
ok("the first lesson asked is Level 1 Lesson 1 (a phonogram-only lesson, not Lesson 3's words)", plan.queue[0].fam==="L1 · Lesson 1", plan.queue[0]);
const order=uniqRuns(fams(plan.queue));
ok("lessons run L1 1→6 then L2 1→3, each lesson in one block", order.join("|")==="L1 · Lesson 1|L1 · Lesson 2|L1 · Lesson 3|L1 · Lesson 4|L1 · Lesson 5|L1 · Lesson 6|L2 · Lesson 1|L2 · Lesson 2|L2 · Lesson 3", order);
ok("3 per lesson (quick 3), the words of a lesson before its phonograms (card order kept inside the lesson)", plan.queue.filter(q=>q.fam==="L1 · Lesson 3").length===3&&names(plan.queue.filter(q=>q.fam==="L1 · Lesson 3")).join()==="L1w3a,L1w3b,L1w3c");
const single={sid:"ck1",kind:"checkup",unit:"spell",stage:2,quick:3,perDay:10,untested:"spot",decks:[]};
ok("one level alone is ordered the same way", uniqRuns(fams(ctx.ckPlan(ctx.ckCards(single),single,{f:{},day:{}}).queue)).join("|")==="Lesson 1|Lesson 2|Lesson 3|Lesson 4|Lesson 5|Lesson 6");
const fplan=ctx.ckPlan(ctx.ckCards({sid:"f",kind:"checkup",unit:"facts",stage:7,quick:5,perDay:10,untested:"known",decks:[]}),{quick:5,untested:"known"},{f:{},day:{}});
ok("a unit without numbered families (the facts path) keeps its card order", uniqRuns(fams(fplan.queue)).join("|")==="× ÷ · 0s|× ÷ · 1s|× ÷ · 2s");
console.log("── 3. the mix stays inside a lesson for spelling ──");
const m1=ctx.ckMix(plan.queue,"k","ck","20261028",true), m2=ctx.ckMix(plan.queue,"k","ck","20261028",true), m3=ctx.ckMix(plan.queue,"k","ck","20261029",true);
ok("nothing added, nothing lost", names(m1).slice().sort().join()===names(plan.queue).slice().sort().join()&&m1.length===plan.queue.length);
ok("the lesson blocks come in the plan's order — Book 1 Lesson 1 first, no interleaving", uniqRuns(fams(m1)).join("|")===order.join("|"), uniqRuns(fams(m1)));
ok("the three words inside a lesson may mix (some lesson's trio is reordered over the days)", names(m1).join()!==names(plan.queue).join()||names(m3).join()!==names(plan.queue).join());
ok("a stop and a resume agree: same kid + session + day → same order", names(m1).join()===names(m2).join());
ok("ckIsSpelling says yes for the AAS-shaped unit and no for the facts path", ctx.ckIsSpelling(span)===true&&ctx.ckIsSpelling({unit:"facts",decks:[]})===false);
const full=ctx.ckMix(fplan.queue,"k","f","20261028",false);
ok("without inFam (a facts check-up) the whole queue still mixes across families (CKMIX, her 10/23 pick)", uniqRuns(fams(full)).length>uniqRuns(fams(fplan.queue)).length);
console.log("── 4. passed lessons count as done; a half-asked one is finished first ──");
const st={f:{L1___Lesson_1:{m:"pass",a:{L1p1x:{r:"c"},L1p1y:{r:"c"},L1p1z:{r:"c"}}}, L1___Lesson_4:{m:"done",a:{}}, L1___Lesson_2:{m:"quick",a:{L1p2x:{r:"c"}}}},day:{}};
const p2=ctx.ckPlan(cards,span,st); const m4=ctx.ckMix(p2.queue,"k","ck","20261028",true);
ok("Lesson 1 (passed) and Lesson 4 (done) are checked off — not asked again", p2.checked===2&&!fams(p2.queue).includes("L1 · Lesson 1")&&!fams(p2.queue).includes("L1 · Lesson 4"));
ok("Lesson 2's two remaining picks are asked first, then Lesson 3", uniqRuns(fams(m4)).slice(0,2).join("|")==="L1 · Lesson 2|L1 · Lesson 3"&&m4.filter(q=>q.fam==="L1 · Lesson 2").length===2, uniqRuns(fams(m4)).slice(0,3));
console.log("── wiring ──");
ok("the check-up screen mixes inside the lesson for a spelling session", /p\.queue=ckMix\(p\.queue,kid,session\.sid,dk,ckIsSpelling\(session\)\);/.test(src));
ok("a grade takes the front card of the SAME order", /p\.queue=ckMix\(p\.queue,kid,sid,dk,ckIsSpelling\(s\)\);/.test(src));
ok("ckLessonOrder is used for one level and for a span", /if\(b<=a\) return ckLessonOrder\(u,_ustCards\(u,a\)\);/.test(src)&&/ckLessonOrder\(u,_ustCards\(u,st\)\)\.forEach/.test(src));
ok("CKORDER block is marked; ckMix/ckLessonOrder write nothing", src.indexOf("// CKORDER_START")>0&&src.indexOf("// CKORDER_END")>src.indexOf("// CKORDER_START")&&!/db\.|HA_LS/.test(fnIn(src,"ckMix")+fnIn(src,"ckLessonOrder")));
ok("no 🔀 anywhere in index.html", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
