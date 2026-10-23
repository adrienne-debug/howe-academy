/* 🧺 LL_FAMILY (her report 2026-10-23, DeWalt: "it has my full family on her rotation including my kids names"):
 * the laundry line's default loads come from THIS family's roster; Howe's four kids and Howe's home days apply on Howe only.
 * run: node test_laundry_family_defaults.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fnIn=(s,name)=>{ const i=s.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=s.indexOf("{",i);k<s.length;k++){ if(s[k]==="{") d++; else if(s[k]==="}"&&--d===0) return s.slice(i,k+1); } throw new Error("unterminated "+name); };
const line=start=>{ const i=src.indexOf(start); if(i<0) throw new Error("missing "+start); return src.slice(i,src.indexOf("\n",i)+1); };
const code=[line("const LL_DL="),line("const LL_HOME_DEF="),line("const LL_HOME_DEF_FAM="),fnIn(src,"llIsHowe"),fnIn(src,"llHomeDef"),fnIn(src,"llDefaultItems"),fnIn(src,"llItems"),fnIn(src,"llOrder"),fnIn(src,"llHome")].join("\n");
function world(o){
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,
    ROSTER:o.roster, KID_NAME:o.names, cap:s=>s.charAt(0).toUpperCase()+s.slice(1), laundryLine:{}};
  if(o.howe!==undefined) ctx.HA_IS_HOWE=o.howe;
  vm.createContext(ctx); vm.runInContext(code,ctx); return ctx;
}
const DW={roster:["taylor","makenzie","andrew","caleb"],names:{taylor:"Taylor",makenzie:"Makenzie",andrew:"Andrew",caleb:"Caleb"}};
const HW={roster:["lincoln","ellis","lucy","julian"],names:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}};
console.log("── another family (HA_IS_HOWE false) ──");
{ const w=world(Object.assign({howe:false},DW)); const it=w.llDefaultItems(), keys=Object.keys(it);
  ok("the default loads are that family's kids, in roster order, then Mom & Dad's clothes and towels", JSON.stringify(w.llOrder())===JSON.stringify(["taylor","makenzie","andrew","caleb","momdad","towels"]), w.llOrder());
  ok("labels carry their names: Taylor's clothes … Caleb's clothes", it.taylor.label==="Taylor's clothes"&&it.caleb.label==="Caleb's clothes"&&it.makenzie.emoji==="👕");
  ok("no Howe name anywhere in the defaults", !/lincoln|ellis|lucy|julian/i.test(JSON.stringify(it)));
  ok("home days: kids Mon, Tue, Wed, Thu in roster order; ours Thu; towels Fri", [w.llHome("taylor"),w.llHome("makenzie"),w.llHome("andrew"),w.llHome("caleb"),w.llHome("momdad"),w.llHome("towels")].join()==="0,1,2,3,3,4", [w.llHome("taylor"),w.llHome("caleb"),w.llHome("momdad"),w.llHome("towels")]);
  const two=world({howe:false,roster:["zuri","d3"],names:{zuri:"Zuri",d3:"D3"}}); 
  ok("a two-kid family: two kids' loads, ours third, towels fourth", JSON.stringify(two.llOrder())===JSON.stringify(["zuri","d3","momdad","towels"])&&two.llItems().momdad.order===2);
  const saved=world(Object.assign({howe:false},DW)); saved.laundryLine={items:{a:{label:"Sheets",order:0}}};
  ok("a family that has its own line keeps it — the defaults never replace saved items", JSON.stringify(Object.keys(saved.llItems()))==='["a"]');
}
console.log("── Howe (HA_IS_HOWE true, and the tests' undefined) ──");
{ [true,undefined].forEach(function(v){ const w=world(Object.assign({howe:v},HW)); const it=w.llDefaultItems();
    ok("HA_IS_HOWE "+String(v)+": Howe's four (Lucy's 👗), ours, towels — unchanged", JSON.stringify(w.llOrder())===JSON.stringify(["lincoln","ellis","lucy","julian","momdad","towels"])&&it.lucy.emoji==="👗"&&it.lincoln.label==="Lincoln's clothes");
    ok("…and her little schedule's home days: Lincoln Mon, Ellis Tue, Lucy + Julian Wed, ours Thu, towels Fri", [w.llHome("lincoln"),w.llHome("ellis"),w.llHome("lucy"),w.llHome("julian"),w.llHome("momdad"),w.llHome("towels")].join()==="0,1,2,2,3,4"); }); }
console.log("── the source ──");
ok("Howe's names appear in llDefaultItems only behind llIsHowe()", /const kids=llIsHowe\(\)\?\[\["lincoln","👕"\]/.test(fnIn(src,"llDefaultItems")));
ok("no 🔀 anywhere in index.html", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
