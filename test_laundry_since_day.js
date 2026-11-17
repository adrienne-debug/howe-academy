/*
 * 🧺 LAUNDRY_SINCEDAY — a laundry time that is not today says which day (her report 2026-11-17: "on the laundry list … it gives
 * a time in which things were added, but it doesn't give the date"; her pick: "only when not today").
 * 🫧 Machines now, the nudges, "done at" and the schedule blocks all print through laundrySince(ts), which gave the hour and
 * minute only — a load sitting since yesterday read the same as one from this morning.
 * The real laundrySince sliced from index.html, run against a clock the test sets.          run: node test_laundry_since_day.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(process.env.BASE_HTML||path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const ctx={}; vm.createContext(ctx); vm.runInContext(fn("laundrySince")+"\nvar _now=0; Date.now=function(){ return _now; };", ctx);
const at=(y,mo,d,h,mi)=>new Date(y,mo-1,d,h,mi).getTime();                         // a local clock time, whatever zone the test runs in
const bare=ts=>new Date(ts).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});   // what it printed before
const since=(now,ts,only)=>{ ctx._now=now; return ctx.laundrySince(ts,only); };
const NOW=at(2026,11,17,11,30);   // a Tuesday

console.log("Today reads as it always has");
ok("this morning → the time alone", since(NOW,at(2026,11,17,9,14))==="9:14 AM", since(NOW,at(2026,11,17,9,14)));
ok("a minute after midnight, seen late at night → the time alone", since(at(2026,11,17,23,59),at(2026,11,17,0,1))==="12:01 AM");
ok("later today (a load done by then) → the time alone", since(NOW,at(2026,11,17,15,5))==="3:05 PM");
ok("same words as before for every hour of today", Array.from({length:24},(_,h)=>at(2026,11,17,h,7)).every(ts=>since(NOW,ts)===bare(ts)));

console.log("Another day says which day");
ok("yesterday", since(NOW,at(2026,11,16,9,14))==="yesterday 9:14 AM", since(NOW,at(2026,11,16,9,14)));
ok("11:59 last night, seen at 12:01 → yesterday", since(at(2026,11,17,0,1),at(2026,11,16,23,59))==="yesterday 11:59 PM");
ok("two days ago → its weekday", since(NOW,at(2026,11,15,9,14))==="Sun 9:14 AM", since(NOW,at(2026,11,15,9,14)));
ok("six days ago → its weekday", since(NOW,at(2026,11,11,20,0))==="Wed 8:00 PM", since(NOW,at(2026,11,11,20,0)));
ok("a week ago → the date (the weekday alone would read as today's)", since(NOW,at(2026,11,10,9,14))==="11/10 9:14 AM", since(NOW,at(2026,11,10,9,14)));
ok("last month → the date", since(NOW,at(2026,10,3,7,5))==="10/3 7:05 AM", since(NOW,at(2026,10,3,7,5)));
ok("tomorrow (an air-dry done by then)", since(NOW,at(2026,11,18,9,0))==="tomorrow 9:00 AM", since(NOW,at(2026,11,18,9,0)));
ok("further ahead → the date", since(NOW,at(2026,11,20,9,0))==="11/20 9:00 AM", since(NOW,at(2026,11,20,9,0)));

console.log("The clock change does not tip a day");
ok("across the fall change: Saturday seen on Monday", since(at(2026,11,2,8,0),at(2026,10,31,21,30))==="Sat 9:30 PM", since(at(2026,11,2,8,0),at(2026,10,31,21,30)));
ok("across the fall change: late Saturday seen early Sunday → yesterday", since(at(2026,11,1,0,30),at(2026,10,31,23,45))==="yesterday 11:45 PM");
ok("across the spring change: Saturday night seen Sunday night → yesterday", since(at(2027,3,14,23,30),at(2027,3,13,23,30))==="yesterday 11:30 PM");
ok("the spring-change day itself still reads as today", since(at(2027,3,14,23,30),at(2027,3,14,0,30))==="12:30 AM");

console.log("Left as they were");
ok("time only, when the row has its own day word", since(NOW,at(2026,11,16,21,40),1)==="9:40 PM", since(NOW,at(2026,11,16,21,40),1));
ok("no time saved → what it printed before", since(NOW,undefined)===bare(undefined)&&since(NOW,0)===bare(0)&&since(NOW,null)===bare(null));

console.log("Wiring");
{ const calls=src.match(/laundrySince\([^()]*\)/g)||[];
  ok("🧺 Put away keeps its own \"last night\" and asks for the time only", /\(a\.day!==today\?'last night ':''\)\+esc\(laundrySince\(a\.at,1\)\)/.test(src));
  ok("… and it is the only time-only call", calls.filter(c=>/,/.test(c)&&!/^laundrySince\(ts,timeOnly\)$/.test(c)).length===1, calls);
  ok("🫧 Machines now prints through it", /meta\[1\]\+' since '\+laundrySince\(l\.ts\)\+laundryDoneTxt\(l\)/.test(src));
  ok("the nudges print through it", /since=laundrySince\(l\.ts\)/.test(fn("laundryNudgeRowHTML"))&&/since '\+laundrySince\(x\.l\.ts\)/.test(fn("laundrySplitNudgeTxt")));
  ok("it needs nothing else from the page (tests and screens that carry it alone still work)", !/\b(llToday|_hhIsoLocal|mwTodayIso|LL_DL|llSinceDay)\b/.test(fn("laundrySince")));
  ok("no 🔀", src.indexOf("🔀")<0);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
