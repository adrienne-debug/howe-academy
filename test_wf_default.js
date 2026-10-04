// 🔄 WF_DEFAULT — a kid with no Workflow Orders saved runs Mom-required first (DeWalt Week 1, 2026-10-04).
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let pass=0, fail=0; function ok(name,c){ if(c){pass++;console.log("  ok  - "+name);} else {fail++;console.log("  FAIL- "+name);} }
const i=src.indexOf("function wfWithDefaults("); ok("wfWithDefaults exists", i>=0);
const j=src.indexOf("function gwWorkflowRank(",i); const k=src.indexOf("\n}\n",j)+3;
const fbArr=v=>Array.isArray(v)?v:(v&&typeof v==="object"?Object.values(v):null);
function load(roster,wf){ return new Function("fbArr","ROSTER","rulesData","wfMatch",src.slice(i,k)+"\nreturn {wfWithDefaults,gwWorkflowRank};")(fbArr,roster,{workflow:wf},()=>false); }
const DEF=["required","independent","maybe","computer"];

let m=load(["taylor","makenzie"],undefined);
let w=m.wfWithDefaults(undefined);
ok("no workflow node → every roster kid gets the default", ["taylor","makenzie"].every(x=>w[x]&&w[x].normal.map(s=>s.tier).join()===DEF.join()));
const req=m.gwWorkflowRank("taylor","saxon",{mom:"required",device:"paper"},"monday",false);
const ind=m.gwWorkflowRank("taylor","piano",{mom:"none",device:"keyboard"},"monday",false);
const cmp=m.gwWorkflowRank("taylor","typing",{mom:"none",device:"computer"},"monday",false);
ok("Mom-required ranks before independent", req<ind);
ok("independent ranks before computer", ind<cmp);
ok("nothing falls to the neutral 500", req<500&&ind<500&&cmp<500);

const howe={lincoln:{normal:[{tier:"computer"},{tier:"required"}],babysitter:[{tier:"independent"}]},julian:{normal:{0:{tier:"independent"}}}};
m=load(["lincoln","julian"],howe); w=m.wfWithDefaults(howe);
ok("saved steps are returned untouched (same objects)", w.lincoln===howe.lincoln&&w.julian===howe.julian);
ok("saved order still wins: computer before required for a kid who saved it", m.gwWorkflowRank("lincoln","x",{device:"computer"},"monday",false)<m.gwWorkflowRank("lincoln","y",{mom:"required",device:"paper"},"monday",false));
ok("input object is not mutated", Object.keys(howe).join()==="lincoln,julian");

m=load(["andrew"],{andrew:{normal:[]}}); w=m.wfWithDefaults({andrew:{normal:[]}});
ok("an EMPTY normal list also gets the default", w.andrew.normal.length===4&&w.andrew.normal[0].tier==="required");

ok("cascade sort reads the default (guarded)", /const wf=\(typeof wfWithDefaults==="function"\)\?wfWithDefaults\(r\.workflow\):\(\(r\.workflow\)\|\|\{\}\);/.test(src));
ok("displacement reads the default (guarded)", /const wf=\(typeof wfWithDefaults==="function"\)\?wfWithDefaults\(r\.workflow\):\(r\.workflow\|\|\{\}\);/.test(src));
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
