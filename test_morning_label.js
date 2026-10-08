// 🕘 Morning routine label reads School Day Times (her yes 2026-10-08). DeWalt starts at 9 with lunch at 12,
// but the grey line under "Morning" on the routine checklist still said a fixed "10:00 AM – 1:00 PM".
// Run: node test_morning_label.js
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log("FAIL "+m);} else console.log("ok   "+m); };
const fnSrc=name=>{ const a=src.indexOf("function "+name+"("); if(a<0) throw new Error("missing "+name); const b=src.indexOf("\n}\n",a); const one=src.indexOf("\n",a);
  const line=src.slice(a,one); return (line.trim().endsWith("}")&&!line.trim().endsWith("{"))?line:src.slice(a,b+2); };
const helpers=["toMin","fromMin","gateStartMin","_haLunchMin"].map(fnSrc).join("\n");
const a=src.indexOf("const SL_STIM"), b=src.indexOf("\n",a); const line=src.slice(a,b);
ok(a>0&&line.includes("MORNING_LABEL"),"SL_STIM carries the MORNING_LABEL getter");
function stim(rulesData,day,todayName){
  const f=new Function("rulesData","day","getTodayDayName", helpers+"\n"+line+"\nreturn SL_STIM;");
  return f(rulesData,day,()=>todayName===undefined?"monday":todayName);
}
const HOWE={schoolDay:{defaultStart:"10:00 AM",defaultEnd:"4:15 PM",lunchStart:"1:00 PM",lunchEnd:"2:00 PM"}};
const DEWALT={schoolDay:{defaultStart:"9:00 AM",defaultEnd:"4:00 PM",lunchStart:"12:00 PM",lunchEnd:"1:00 PM"}};
ok(stim(HOWE,"monday").morning==="10:00 AM – 1:00 PM","Howe hours: label unchanged (10:00 AM – 1:00 PM)");
ok(stim(DEWALT,"monday").morning==="9:00 AM – 12:00 PM","DeWalt hours: 9:00 AM – 12:00 PM");
ok(stim({},"monday").morning==="10:00 AM – 1:00 PM","no School Day Times (Burris today): old default text");
ok(stim(null,"monday").morning==="10:00 AM – 1:00 PM","rules not loaded yet: old default text");
const OV={schoolDay:Object.assign({},DEWALT.schoolDay,{overrides:{thursday:{start:"11:30 AM"}}})};
ok(stim(OV,"thursday").morning==="11:30 AM – 12:00 PM","a day's start override is used for that day (same as the Morning gate)");
ok(stim(OV,"friday").morning==="9:00 AM – 12:00 PM","other days keep the default start");
ok(stim(OV,undefined,"thursday").morning==="11:30 AM – 12:00 PM","no viewed day: falls back to today");
ok(stim(DEWALT,undefined,null).morning==="9:00 AM – 12:00 PM","weekend (no today name): default start");
const s=stim(DEWALT,"monday");
ok(s.afternoon==="After school work"&&s.chores==="After school"&&s.evening==="Bedtime routine","other slot labels unchanged");
ok(Object.keys(s).join(",")==="morning,afternoon,chores,evening","SL_STIM[slot] lookups still see the same four keys");
// a throwing helper never breaks the routine row
const fBad=new Function("rulesData","day","getTodayDayName","const toMin=()=>{throw new Error('x')},fromMin=toMin,gateStartMin=toMin,_haLunchMin=toMin;\n"+line+"\nreturn SL_STIM;");
ok(fBad(DEWALT,"monday",()=>"monday").morning==="10:00 AM – 1:00 PM","helper error: falls back to the old text");
// the three render sites still read it the same way
ok((src.match(/SL_STIM\.morning/g)||[]).length===1&&(src.match(/SL_STIM\[slot\]/g)||[]).length===2,"render sites unchanged (1× SL_STIM.morning, 2× SL_STIM[slot])");
if(fail){console.log(fail+" failed");process.exit(1);} console.log("all passed");
