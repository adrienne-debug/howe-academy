/* 🧽 HHROSTER (audit 2026-10-24): the household who-list, the new-job default, the projects order and the room names follow the
 * family — another family never sees Lincoln/Ellis/Lucy/Julian (or "Lucy + Julian's room"); Howe's lists come out identical.
 * run: node test_household_roster.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const line=start=>{ const i=src.indexOf(start); if(i<0) throw new Error("missing "+start); return src.slice(i,src.indexOf("\n",i)+1); };
const stmt=(start,end)=>{ const i=src.indexOf(start); const j=src.indexOf(end,i); if(i<0||j<0) throw new Error("missing "+start); return src.slice(i,j+end.length); };
function world(roster,howe,first){
  const ctx={console,Object,Array,String,ROSTER:roster,FIRST_KID:first||roster[0]}; if(howe!==undefined) ctx.HA_IS_HOWE=howe;
  vm.createContext(ctx);
  vm.runInContext([line("const HH_WHO="),stmt("const HH_ROOMS=","return L[r[0]]?[r[0],L[r[0]],r[2]]:r; });"),line("let hhAdd={")].join("\n")+"\nthis._W=HH_WHO; this._R=HH_ROOMS; this._A=hhAdd;",ctx);
  return ctx;
}
const H=world(["lincoln","ellis","lucy","julian"],true), D=world(["taylor","makenzie","andrew","caleb"],false), B=world(["zuri","d3"],false);
ok("Howe: the who-list is exactly what it was", JSON.stringify(H._W)===JSON.stringify(["lincoln","ellis","lucy","julian","mom","dad","grab"]), H._W);
ok("DeWalt: its own four, then Mom, Dad, Up for Grabs", JSON.stringify(D._W)===JSON.stringify(["taylor","makenzie","andrew","caleb","mom","dad","grab"]), D._W);
ok("Burris: Zuri and 3D", JSON.stringify(B._W)===JSON.stringify(["zuri","d3","mom","dad","grab"]));
ok("a new household job starts on the family's first kid (Howe: lincoln · DeWalt: taylor · Burris: zuri)", H._A.who==="lincoln"&&D._A.who==="taylor"&&B._A.who==="zuri");
ok("Howe keeps its own room names", H._R.find(r=>r[0]==="lj")[1]==="Lucy + Julian's room"&&H._R.find(r=>r[0]==="boys")[1]==="Boys' room");
ok("another family sees plain room names, same ids", D._R.find(r=>r[0]==="lj")[1]==="Second kids' room"&&D._R.find(r=>r[0]==="boys")[1]==="Kids' room"&&D._R.find(r=>r[0]==="ours")[1]==="Parents' room + bathroom"&&D._R.length===H._R.length&&D._R.every((r,i)=>r[0]===H._R[i][0]));
ok("no Howe kid name in another family's rooms", !/Lucy|Julian|Lincoln|Ellis/.test(JSON.stringify(D._R)));
ok("the projects order list is built from HH_WHO (no Howe names typed)", /const order=\["mom","dad"\]\.concat\(HH_WHO\.filter/.test(src)&&src.indexOf('const order=["mom","dad","lincoln"')<0);
ok("Howe's names appear in HH_WHO only as the no-roster fallback", /ROSTER\.slice\(\):\["lincoln","ellis","lucy","julian"\]\)\.concat\(\["mom","dad","grab"\]\)/.test(line("const HH_WHO=")));
ok("no 🔀 anywhere in index.html", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
