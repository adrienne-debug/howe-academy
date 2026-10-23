/* 🧱 GRIDPRUNE (her ask 2026-10-23: rows "should just go as far as the longest subject and can grow if things get pushed back"):
 * after a build's clears, trailing rows that are empty for every subject and sit past the new grid end leave in the same update.
 * Replica of DeWalt/Makenzie 10/18: 189 rows with lessons, then 489 empty placeholder rows out to June 2029.
 * run: node test_grid_trailing_prune.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fnIn=(s,name)=>{ const i=s.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=s.indexOf("{",i);k<s.length;k++){ if(s[k]==="{") d++; else if(s[k]==="}"&&--d===0) return s.slice(i,k+1); } throw new Error("unterminated "+name); };
const TODAY="2026-10-23";
// a school-day calendar: weekdays from 2026-10-05, n rows, "Wk N" labels like the builder's
function rows(n,fill){ const out={}, wd={}; let d=new Date(2026,9,5), dn=0, wk=0, mon=null;
  while(dn<n){ const dow=d.getDay(); if(dow>=1&&dow<=5){ const m=new Date(d); m.setDate(m.getDate()-((dow+6)%7)); const key=m.toDateString(); if(key!==mon){ mon=key; wk++; }
      dn++; const iso=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); const r={date:iso,week:"Wk "+wk}; const f=fill(dn,iso); if(f) Object.assign(r,f); out[dn]=r; (wd["Wk "+wk]=wd["Wk "+wk]||[]).push(dn); }
    d.setDate(d.getDate()+1); }
  return {rows:out,wd:wd}; }
function world(o){
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date, dbg:()=>{}, scheduleOverrides:o.ov||{},
    currData:{lessons:{makenzie:o.rows},weekDays:{makenzie:o.wd},subjects:{makenzie:o.subs||{aas_4:{},cle:{}}}},
    gvDerivedColumn:(kid,sk)=>(o.derived&&o.derived[sk])||null};
  vm.createContext(ctx);
  vm.runInContext([fnIn(src,"_cbParseDate"),fnIn(src,"_cbISO"),"function cbTodayISO(){ return '"+TODAY+"'; }",fnIn(src,"cbTrailingEmptyRows"),fnIn(src,"cbPruneTrailingRows")].join("\n"),ctx);
  return ctx;
}
console.log("── the Makenzie replica: 189 lesson rows, then 489 empty rows to 2029 ──");
{ const R=rows(678,(dn,iso)=>dn<=189?{aas_4:"Step "+dn,cle:(dn%5?"L"+dn:undefined)}:null); const w=world(R);
  const up={}, snaps={}; const snap=(p,v)=>{ if(!(p in snaps)) snaps[p]=(v===undefined||v===null)?null:JSON.parse(JSON.stringify(v)); };
  const t=w.cbTrailingEmptyRows("makenzie",TODAY);
  ok("the grid end is the last stored cell (row 189)", t.end===R.rows[189].date, t.end);
  ok("489 trailing empty rows found, 190..678", t.dayNums.length===489&&t.dayNums[0]===190&&t.dayNums[488]===678);
  const n=w.cbPruneTrailingRows("makenzie",up,snap);
  ok("the prune returns 489 and writes lessons/makenzie/<dn>=null for each", n===489&&Object.keys(up).filter(p=>/^lessons\/makenzie\/\d+$/.test(p)&&up[p]===null).length===489);
  ok("no lesson row with a cell is touched (1..189 untouched)", !Object.keys(up).some(p=>/^lessons\/makenzie\/(\d+)$/.test(p)&&parseInt(p.split("/")[2],10)<=189));
  const wkUp=Object.keys(up).filter(p=>p.indexOf("weekDays/makenzie/")===0);
  const lastWk=snaps["lessons/makenzie/678"]?snaps["lessons/makenzie/678"].week:"";
  ok("the weeks those rows filled are cleared (the last week → null) and the week of row 189 keeps its first rows", wkUp.length>=90&&up["weekDays/makenzie/"+lastWk]===null&&(()=>{ const wk=R.rows[189].week; const a=up["weekDays/makenzie/"+wk]; return Array.isArray(a)&&a.indexOf(189)>=0&&a.every(x=>x<=189); })(), [lastWk,wkUp.length]);
  ok("local state follows: 189 rows and no week label past row 189", Object.keys(w.currData.lessons.makenzie).length===189&&!Object.keys(w.currData.weekDays.makenzie).some(k=>(w.currData.weekDays.makenzie[k]||[]).some(x=>x>189)));
  ok("every pruned row and week was snapped for ↩ Undo", snaps["lessons/makenzie/678"]&&snaps["lessons/makenzie/678"].date>"2029-01-01"&&("weekDays/makenzie/"+lastWk in snaps)&&Array.isArray(snaps["weekDays/makenzie/"+lastWk]));
}
console.log("── what stays ──");
{ const R=rows(60,(dn)=>dn<=20||dn===40?{aas_4:"Step "+dn}:null); const w=world(R);   // rows 21..39 empty MID-grid, 40 filled, 41..60 empty trailing
  const t=w.cbTrailingEmptyRows("makenzie",TODAY);
  ok("a mid-grid gap stays (21..39 kept); only 41..60 trail", t.dayNums.length===20&&t.dayNums[0]===41);
  const R2=rows(60,(dn)=>dn<=20?{aas_4:"Step "+dn}:null); const w2=world(Object.assign({},R2,{derived:{cle:{byDate:{[R2.rows[35].date]:{text:"projected L9"}}}}}));
  const t2=w2.cbTrailingEmptyRows("makenzie",TODAY);
  ok("a derived (projected) cell counts as the grid end: rows up to it stay, only 36..60 trail", t2.end===R2.rows[35].date&&t2.dayNums[0]===36&&t2.dayNums.length===25);
  const R3=rows(60,(dn)=>dn<=20?{aas_4:"Step "+dn}:null); const w3=world(Object.assign({},R3,{ov:{[R3.rows[50].date]:{makenzie:{added:{cle:"make-up L4"}}}}}));
  const t3=w3.cbTrailingEmptyRows("makenzie",TODAY);
  ok("a row carrying Mom's hand-added make-up slot stays (50 kept, the rest trail)", t3.dayNums.indexOf(50)<0&&t3.dayNums.length===39);
  const R4=rows(10,()=>null); const w4=world(R4);   // every row empty, and the first rows are on/before today
  const t4=w4.cbTrailingEmptyRows("makenzie",TODAY);
  ok("no cells anywhere: rows on/before today stay, future empties trail", t4.end===""&&t4.dayNums.every(dn=>R4.rows[dn].date>TODAY)&&t4.dayNums.length===Object.keys(R4.rows).filter(dn=>R4.rows[dn].date>TODAY).length);
  const R5=rows(30,(dn)=>({aas_4:"Step "+dn})); const w5=world(R5);
  ok("a full grid prunes nothing; up stays empty", w5.cbPruneTrailingRows("makenzie",{},()=>{})===0);
}
console.log("── wiring ──");
ok("cbApply calls the prune after cbPatchLocal and before its one curriculum update", (()=>{ const f=fnIn(src,"cbApply"); const a=f.indexOf("cbPatchLocal(up);"), b=f.indexOf("cbPruneTrailingRows(kid,up,snap)"), c=f.indexOf('db.ref("curriculum").update(up)'); return a>0&&b>a&&c>b; })());
ok("the build message says how many rows were trimmed", /empty row"\+\(_pruned!==1\?"s":""\)\+" past the end trimmed/.test(fnIn(src,"cbApply")));
ok("the block writes nothing of its own (no db.ref) — only paths in the build's update", !/db\.ref\(/.test(src.slice(src.indexOf("// GRIDPRUNE_START"),src.indexOf("// GRIDPRUNE_END"))));
ok("no 🔀 anywhere in index.html", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
