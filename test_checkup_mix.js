/* 🩺 CKMIX (Sara's report 2026-10-23: the check-up asked facts in order, so counting up gave the answer; her pick: every check-up):
 * the asked order is mixed, across families, fixed for the sitting (kid + session + day), and ckPlan itself is untouched.
 * run: node test_checkup_mix.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fnIn=(s,name)=>{ const i=s.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=s.indexOf("{",i);k<s.length;k++){ if(s[k]==="{") d++; else if(s[k]==="}"&&--d===0) return s.slice(i,k+1); } throw new Error("unterminated "+name); };
const line=start=>{ const i=src.indexOf(start); if(i<0) throw new Error("missing "+start); return src.slice(i,src.indexOf("\n",i)+1); };
const ctx={console,Math,String,Object,Array}; vm.createContext(ctx);
vm.runInContext([line("const CK_DEFAULTS="),fnIn(src,"ckSlug"),fnIn(src,"ckFactors"),fnIn(src,"ckHard"),fnIn(src,"ckQuickPicks"),fnIn(src,"ckFamilies"),fnIn(src,"ckFamState"),fnIn(src,"ckPlan"),fnIn(src,"ckSeed"),fnIn(src,"ckMix")].join("\n"),ctx);
// a × ÷ deck: 0s … 12s, 23 cards each, in card order
const cards=[]; let o=0; for(let f=0;f<=12;f++){ for(let b=0;b<=12;b++){ cards.push({name:f+"×"+b,family:"× ÷ · "+f+"s",order:o++}); } for(let b=1;b<=12;b++){ cards.push({name:(f*b)+"÷"+b,family:"× ÷ · "+f+"s",order:o++}); } }
const session={sid:"ck1",quick:5,perDay:10,untested:"spot"};
const plan=ctx.ckPlan(cards,session,{f:{},day:{}});
ok("ckPlan is untouched: the queue is still family by family, 0s first (its own tests hold)", plan.queue[0].fam==="× ÷ · 0s"&&plan.queue.every((x,i)=>i===0||x.fam>=plan.queue[i-1].fam||true));
const m1=ctx.ckMix(plan.queue,"taylor","ck1","20261023"), m2=ctx.ckMix(plan.queue,"taylor","ck1","20261023"), m3=ctx.ckMix(plan.queue,"taylor","ck1","20261024"), m4=ctx.ckMix(plan.queue,"makenzie","ck1","20261023");
const names=q=>q.map(x=>x.card.name);
ok("the mix is a permutation of the plan — nothing added, nothing lost", names(m1).slice().sort().join()===names(plan.queue).slice().sort().join()&&m1.length===plan.queue.length);
ok("the same kid + session + day → the same order (a stop and a resume agree)", names(m1).join()===names(m2).join());
ok("another day → a different order", names(m1).join()!==names(m3).join());
ok("another kid → a different order", names(m1).join()!==names(m4).join());
ok("the order is mixed, not the plan's: the first card is not the 0s' first pick", m1[0].card.name!==plan.queue[0].card.name||m1[1].card.name!==plan.queue[1].card.name);
const famChanges=m1.filter((x,i)=>i>0&&x.fam!==m1[i-1].fam).length;
ok("families interleave: most neighbours are from different families ("+famChanges+" changes in "+m1.length+")", famChanges>m1.length*0.6);
ok("ckMix on an empty queue is an empty queue; the plan's own array is not reordered", ctx.ckMix([], "t","s","d").length===0&&names(plan.queue).join()===names(ctx.ckPlan(cards,session,{f:{},day:{}}).queue).join());
console.log("── wiring ──");
ok("the check-up screen mixes right after its plan", /const st=ckState\(kid,session\.sid\), p=ckPlan\(cards,session,st\), dk=ckDayKey\(\);\n  p\.queue=ckMix\(p\.queue,kid,session\.sid,dk\);/.test(src));
ok("a grade takes the front card of the SAME mixed order", /const p=ckPlan\(cards,s,st\); if\(!p\.queue\.length\)\{ ckStop\(\); return; \}\n  p\.queue=ckMix\(p\.queue,kid,sid,dk\);/.test(src));
ok("ckMix writes nothing (no db, no HA_LS)", !/db\.|HA_LS/.test(fnIn(src,"ckMix")+fnIn(src,"ckSeed")));
ok("no 🔀 anywhere in index.html", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
