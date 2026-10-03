// 📭 No day work → no lock message, no Brain Break (her catch 2026-10-03: Dewalt had no week built;
// Taylor finished her Morning list and still saw "Finish your Morning list…" plus a Brain Break button).
// Run: node test_no_day_work.js
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log("FAIL "+m);} else console.log("ok   "+m); };
const a=src.indexOf("function kcSchoolHTML("), b=src.indexOf("// Their subnav");
const fn=src.slice(a,b);
function run(o){
  const env={_todayDay:"saturday",bbMomDraft:o.draft||null,tab:"kids",
    _kcTodayCards:()=>o.cards||[], mlBannerHTML:()=>"", bbBlock:()=>"[BB]", bbActive:()=>o.active||null,
    gateLookAhead:()=>!!o.look, isScheduleUnlocked:()=>!!o.unlocked, gateClockHeld:()=>false, gateStartMin:()=>600,
    fromMin:()=>"10:00 AM", morningComplete:()=>!!o.mdone, esc:s=>s, toMin:()=>600, _haLunchMin:()=>780,
    lunchBlock:()=>"", taskCard:t=>"[card "+t.id+"]"};
  const f=new Function(...Object.keys(env), fn+";return kcSchoolHTML('taylor');");
  return f(...Object.values(env));
}
// the reported bug: no week built (gate says locked), no cards today
let h=run({cards:[],unlocked:false,mdone:true});
ok(!h.includes("\u{1F512}"),"no week + no cards: no lock message");
ok(!h.includes("[BB]"),"no week + no cards: no Brain Break");
ok(h.includes("No school cards today"),"no week + no cards: friendly empty line");
// a break already running still shows (so it can finish)
ok(run({cards:[],active:{phase:"timer"}}).includes("[BB]"),"no cards but a running break: break card still shows");
ok(run({cards:[],draft:{kid:"taylor"}}).includes("[BB]"),"no cards but Mom drafting a break for this kid: still shows");
// normal day with cards: unchanged behaviour
h=run({cards:[{id:"t1",time:"10:00 AM"}],unlocked:false});
ok(h.includes("\u{1F512}")&&h.includes("Finish your Morning list"),"cards + morning not done: still locked");
ok(h.includes("[BB]"),"cards: Brain Break still shows");
h=run({cards:[{id:"t1",time:"10:00 AM"}],unlocked:true});
ok(!h.includes("\u{1F512}")&&h.includes("[card t1]"),"cards + unlocked: cards show, no lock");
// Schedule tab carries the same rule
const s0=src.indexOf("const _noDayWork=(kid!==\"all\"&&kid!==\"mom\")");
ok(s0>0,"Schedule tab computes _noDayWork for single-kid views only");
const sl=src.slice(s0,s0+1600);
ok(/!tasks\.length&&!offToday\.length&&!carriedOver\.length/.test(sl),"Schedule tab: off-today and carried-over cards still count as work");
ok(sl.includes("if(!_noDayWork||bbActive(kid)||(bbMomDraft&&bbMomDraft.kid===kid)) h+=bbBlock(kid)"),"Schedule tab: Brain Break gated");
ok(sl.includes("|| _lookAhead || _noDayWork")&&sl.includes("!_noDayWork && gateLookAhead(kid, day)"),"Schedule tab: lock + look-ahead gated");
// the real gate itself is untouched (loading stays locked-by-default)
ok(src.includes("if(weekData.tasks.length === 0) return false;"),"isScheduleUnlocked unchanged");
if(fail){console.log(fail+" failed");process.exit(1);} console.log("all passed");
