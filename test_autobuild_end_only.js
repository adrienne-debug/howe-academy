/*
 * 🗓 ENDONLY — a date with only a finish time must not stop the week from building (found 2026-11-15: week 32 never built
 * itself; "auto-gen wk32 failed: TypeError … reading 'match'" all day, and the same throw in the mid-week re-lay and the
 * This-week strip). config/rules/schoolDay/byDate/<iso> = {end:"12:00 PM"} is a normal thing to save ("this day ends early"),
 * but _abMerge read the leaf's start through the app's own toMin, which throws on undefined.
 * test_autobuild_settings.js could not see it: it hands _abMerge a forgiving toMin of its own. This file uses the REAL one,
 * sliced out of index.html.
 *   1. shape: the start is read only when it is there
 *   2. a finish-only date: no throw; the day's times ride along with start null; nothing is called a late start
 *   3. nothing else moved: a later start is still the late start, an earlier one is not, a start-only date works, a date with
 *      no leaf adds nothing
 *   4. a whole week shaped like the one that failed (finish-only Sunday and Friday) merges
 *   run:  node test_autobuild_end_only.js
 */
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
function fn(name){ const sig="function "+name+"("; const i=src.indexOf(sig); if(i<0) throw new Error("not found "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{")d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i,k+1); } } throw new Error("unbalanced "+name); }
const _AB_DAYS=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
eval(fn("toMin")); eval(fn("_abMerge"));
const ctx=(byDate,dates)=>({dates:dates,leaf:iso=>byDate[iso]||null,usualStart:()=>toMin("9:00 AM"),roster:["kid_a","kid_b"],toMin:toMin});
const tryMerge=(byDate,dates)=>{ try{ return {cfg:_abMerge(12,null,ctx(byDate,dates))}; }catch(e){ return {err:String(e)}; } };

console.log("1. shape");
{ const A=src.indexOf("// AUTOBUILD_START"), B=src.indexOf("// AUTOBUILD_END"), BLK=src.slice(A,B);
  ok("one AUTOBUILD block",A>0&&B>A);
  ok("the merge no longer reads a missing start",BLK.indexOf("const sm=tm(L.start);")<0);
  ok("the app's own toMin still throws on nothing (this is what the merge must not hand it)",(()=>{ try{ toMin(undefined); return false; }catch(e){ return true; } })()); }

console.log("2. a finish-only date");
{ const r=tryMerge({"2026-03-06":{end:"3:00 PM"}},{friday:"2026-03-06"});
  ok("no throw",!r.err,r.err);
  ok("the day's times ride along, start null",r.cfg&&JSON.stringify(r.cfg.dayTimes)===JSON.stringify({friday:{start:null,end:"3:00 PM"}}),r.cfg&&r.cfg.dayTimes);
  ok("nothing is called a late start",r.cfg&&Object.keys(r.cfg.lateStart).length===0,r.cfg&&r.cfg.lateStart);
  const e=tryMerge({"2026-03-06":{start:"",end:"3:00 PM"}},{friday:"2026-03-06"});
  ok("an empty start is the same as none",!e.err&&Object.keys(e.cfg.lateStart).length===0,e.err); }

console.log("3. nothing else moved");
{ const later=tryMerge({"2026-03-02":{start:"11:00 AM",end:"3:00 PM"}},{monday:"2026-03-02"});
  ok("a later start is the day's late start",!later.err&&later.cfg.lateStart.monday==="11:00 AM",later);
  const earlier=tryMerge({"2026-03-02":{start:"8:00 AM"}},{monday:"2026-03-02"});
  ok("an earlier start is not called late",!earlier.err&&earlier.cfg.lateStart.monday===undefined&&earlier.cfg.dayTimes.monday.start==="8:00 AM",earlier);
  const same=tryMerge({"2026-03-02":{start:"9:00 AM"}},{monday:"2026-03-02"});
  ok("the usual start is not called late",!same.err&&same.cfg.lateStart.monday===undefined,same);
  const none=tryMerge({},{monday:"2026-03-02",tuesday:"2026-03-03"});
  ok("dates with no times of their own add nothing",!none.err&&Object.keys(none.cfg.dayTimes).length===0&&Object.keys(none.cfg.lateStart).length===0,none); }

console.log("4. the week that failed");
{ const byDate={"2026-03-01":{end:"12:00 PM"},"2026-03-06":{end:"3:00 PM"}};
  const dates={sunday:"2026-03-01",monday:"2026-03-02",tuesday:"2026-03-03",wednesday:"2026-03-04",thursday:"2026-03-05",friday:"2026-03-06",saturday:"2026-03-07"};
  const r=tryMerge(byDate,dates);
  ok("a finish-only Sunday and Friday: the week's settings come out",!r.err&&r.cfg.weekNum==="12",r.err);
  ok("both days keep their finish",!r.err&&r.cfg.dayTimes.sunday.end==="12:00 PM"&&r.cfg.dayTimes.friday.end==="3:00 PM"&&Object.keys(r.cfg.dayTimes).length===2,r.cfg&&r.cfg.dayTimes); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
