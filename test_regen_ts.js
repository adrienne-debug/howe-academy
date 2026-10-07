// REGENTS + FAMGAP — regenerate keeps this week's checks on every browser; family time never floats (2026-10-07).
const fs=require("fs"),path=require("path"); const dir=process.argv[2]||__dirname;
const html=fs.readFileSync(path.join(dir,"index.html"),"utf8");
let pass=0,fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ✓ "+n);} else {fail++;console.log("  ✗ "+n+(x!==undefined?"  → "+JSON.stringify(x):""));} };
const m=html.match(/function gwCheckTsMs\(ts\)\{[\s\S]*?\n\}\n/); ok("reader present",!!m);
ok("regenerate uses it for the 7-day cutoff",/const tsMs=\(typeof ts==="number"\)\?ts:gwCheckTsMs\(ts\);/.test(html));
ok("family cards never float in Gap-backfill",/occ\.filter\(t=>!checked\[t\.id\]&&!_isNote\(t\)&&t\.mom!=="required"&&!t\.famBlock&&subjCount/.test(html));
const RealDate=Date; const at=(y,mo,d,h,mi)=>{ const fixed=new RealDate(y,mo,d,h,mi).getTime(); function D(...a){ return a.length?new RealDate(...a):new RealDate(fixed);} D.now=()=>fixed; D.prototype=RealDate.prototype; return D; };
const mk=D=>new Function("Date",m[0]+"\nreturn gwCheckTsMs;")(D);
console.log("Wed Oct 7 2026, 4 PM");
{ const D=at(2026,9,7,16,0), f=mk(D), cut=D.now()-7*864e5;
  const mon=f("09:13 AM Oct 5"); ok("Mon 9:13 AM → Oct 5 2026 9:13 (this week, kept)",new RealDate(mon).getFullYear()===2026&&new RealDate(mon).getMonth()===9&&new RealDate(mon).getDate()===5&&new RealDate(mon).getHours()===9&&mon>=cut,new RealDate(mon).toString());
  ok("12:05 PM → 12:05",new RealDate(f("12:05 PM Oct 6")).getHours()===12);
  ok("12:30 AM → 0:30",new RealDate(f("12:30 AM Oct 6")).getHours()===0);
  ok("last week's check (Sep 28) is past the cutoff (dropped, as designed)",f("10:00 AM Sep 28")<cut);
  ok("a number stays a number",typeof f(123)==="number");
  ok("full ISO dates still read normally",new RealDate(f("2026-10-05T09:13:00")).getDate()===5); }
console.log("Mon Jan 4 2027 — a December check");
{ const D=at(2027,0,4,9,0), f=mk(D); ok("Dec 30 → 2026, not 2027",new RealDate(f("2:00 PM Dec 30")).getFullYear()===2026); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
