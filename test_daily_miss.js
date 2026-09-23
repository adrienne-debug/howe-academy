/*
 * 🗓 Daily cards missed (her ask 2026-09-23) + ↻ rebuild marks ("rebuilds can skew things").
 *   · missed = not checked ON ITS OWN DAY; a later check = late (still a miss) · kid-off days and today never count
 *   · a day the card wasn't laid doesn't count · streak = days in a row missed up to the latest past day
 *   · READ-ONLY except the one rebuild log push per Rebuild all / build / Regenerate
 *   run:  node test_daily_miss.js
 */
const fs=require("fs"), path=require("path");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const grab=name=>{ const a=src.indexOf("function "+name+"("); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };
const F=new Function(grab("dmCompute")+"\n"+grab("dmLabel")+"\nreturn {dmCompute,dmLabel};")();
const wk=(dates,cards,checked,history)=>({dates,tasks:cards,checked:checked||{},history:history||{}});
let N=0; const c=(who,day,title,sk,x)=>Object.assign({id:"t"+(N++),who,day,title,subjectKey:sk},x||{});
const LESSON={singapore:1};
const o=x=>Object.assign({todayISO:"2026-09-23",kids:["lincoln","ellis"],isDaily:t=>!LESSON[t.subjectKey],labelOf:F.dmLabel,kidOff:()=>false},x||{});
const D1={monday:"2026-09-14",tuesday:"2026-09-15",wednesday:"2026-09-16",thursday:"2026-09-17",friday:"2026-09-18"};
const D2={monday:"2026-09-21",tuesday:"2026-09-22",wednesday:"2026-09-23",thursday:"2026-09-24",friday:"2026-09-25"};
const days=["monday","tuesday","wednesday","thursday","friday"];
// week 23: Ind Reading done Mon–Wed, missed Thu, late Fri; week 24: missed Mon + Tue; today (Wed) open
const w1=days.map(d=>c("lincoln",d,"📖 Ind Reading — Ind Reading","ind_read")), w2=days.map(d=>c("lincoln",d,"📖 Ind Reading — Ind Reading","ind_read"));
const ck1={}; w1.slice(0,3).forEach(t=>ck1[t.id]="x"); ck1[w1[4].id]="x";
const hs1={[w1[4].id]:{checkedOnDay:"saturday"}};
const sing=c("lincoln","monday","📄 Singapore Math — 5B Ch.12 L1","singapore");
const drill=c("ellis","monday","🃏 Daily Drill","retrieval"), match=c("ellis","monday","🎯 Match & Play","retrieval");
const R=F.dmCompute([wk(D1,w1,ck1,hs1),wk(D2,w2.concat([sing,drill,match]),{[drill.id]:"x"},{})],o());
const ir=R.rows.find(r=>r.kid==="lincoln"&&r.label==="Ind Reading");
ok("a daily's days run across the weeks, today excluded (Mon 9/14 … Tue 9/22 = 7 days)",ir&&ir.days.length===7,ir&&ir.days);
ok("checked on a LATER day counts as late, not done",ir.days[4].st==="late");
ok("this week: missed 2 of 2 past days (Wednesday is still open)",ir.weekMiss===2&&ir.weekOf===2,[ir.weekMiss,ir.weekOf]);
ok("streak = 4 days in a row (Thu missed, Fri late, Mon, Tue missed)",ir.streak===4,ir.streak);
ok("last done = Wed 9/16",ir.lastDone==="2026-09-16");
ok("a plan-backed LESSON is never a daily",!R.rows.some(r=>r.label==="Singapore Math"));
ok("retrieval slots are told apart by their title (Daily Drill vs Match & Play)",R.rows.some(r=>r.label==="Daily Drill"&&r.streak===0)&&R.rows.some(r=>r.label==="Match & Play"&&r.streak===1));
const R2=F.dmCompute([wk(D2,w2)],o({kidOff:(k,iso)=>iso==="2026-09-21"}));
ok("a day the kid was off doesn't count",R2.rows[0].days.length===1&&R2.rows[0].days[0].iso==="2026-09-22");
const R3=F.dmCompute([wk(D2,[c("lincoln","tuesday","📖 Ind Reading — Ind Reading","ind_read")])],o());
ok("a day the card wasn't laid doesn't count (only Tuesday is judged)",R3.rows[0].days.length===1&&R3.rows[0].weekOf===1);
const two=[c("lincoln","monday","📖 Ind Reading — Ind Reading","ind_read"),c("lincoln","monday","📖 Ind Reading — Ind Reading","ind_read")];
const R4=F.dmCompute([wk(D2,two,{[two[1].id]:"x"})],o());
ok("two cards of the same daily on a day: the done one stands",R4.rows[0].days[0].st==="done");

console.log("↻ rebuilds + read-only");
const blk=src.slice(src.indexOf("// DAILYMISS_START"),src.indexOf("// DAILYMISS_END"));
ok("the only write in the tracker is ONE push to rebuildLog",(blk.match(/\.push\(\{ts:/g)||[]).length===1&&/db\.ref\("rebuildLog"\)\.push\(/.test(blk)&&!/\.set\(|\.update\(|\.remove\(/.test(blk));
ok("Rebuild all logs once (its per-subject builds don't each log)",/rbLog\("rebuild-all",kid,built/.test(src)&&/if\(!_rbInAll&&typeof rbLog==="function"\) rbLog\("rebuild",kid,1/.test(src)&&/_rbInAll=true; try\{ return _cbRebuildAllRunInner\(kid,list\); \} finally\{ _rbInAll=false; \}/.test(src));
ok("Regenerate logs",/rbLog\("regenerate","all",0,d\.week\|\|""\)/.test(src));
ok("a dry run never logs",/_dryRun\(\)\)\) return;\n    const d=new Date\(\)/.test(blk));
ok("rebuild days are marked ↻ on the kid's dot row, and each kid's latest build stamp shows too",/rbOn\(r\.kid,x\.iso\)\?/.test(blk)&&/pacing\|\|\{\}\)\.builtAt/.test(blk));
ok("the card is Mom-only, under Evening Out",/if\(momModeActive\|\|adminPinUnlocked\)\{ try\{ h\+=dmRender\(\); \}catch\(e\)\{\} \}/.test(src));
ok("an incomplete saved week (no Monday, or under 10% checked) is skipped and named",/const whole=a=>\{ const dd=a\.dates\|\|\{\}; const n=\(a\.tasks\|\|\[\]\)\.length, c=Object\.keys\(a\.checked\|\|\{\}\)\.length; return !!\(dd\.monday&&dd\.friday&&n&&c>=n\*0\.1\); \};/.test(src)&&/Skipped \(saved copy incomplete\)/.test(src));
ok("a hyphen inside a name stays (Sprint Re-checks), a spaced dash still cuts",F.dmLabel({title:"📅 Sprint Re-checks",subjectKey:"retrieval"})==="Sprint Re-checks"&&F.dmLabel({title:"🃏 Daily Drill — x",subjectKey:"retrieval"})==="Daily Drill");
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
