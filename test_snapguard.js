// SNAPGUARD — a 📌 lesson-day sitting is never snapped back onto the day in its stale "came from" note (DeWalt 2026-10-07).
const fs=require("fs"),path=require("path"); const dir=process.argv[2]||__dirname;
const html=fs.readFileSync(path.join(dir,"index.html"),"utf8");
let pass=0,fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ✓ "+n);} else {fail++;console.log("  ✗ "+n+(x!==undefined?"  → "+JSON.stringify(x):""));} };
const m=html.match(/      if\(t\.cascadedFrom&&t\.cascadedFrom!==t\.day\)\{\n        \/\/ 📌 SNAPGUARD[\s\S]*?\n        \}\n      \}/);
ok("guard present inside the noCarry snap-back",!!m);
const run=(t,pinned)=>{ const upd={}, logs=[]; let moved=false;
  new Function("t","ldPinnedTask","dbg","_healUpd","setMoved",m[0].replace(/_healMoved=true/g,"setMoved()"))(t,()=>pinned,x=>logs.push(x),upd,()=>{moved=true;});
  return {t,upd,logs,moved}; };
console.log("📌 lesson-day sitting (Andrew AAS 1 L19 day 2, note says tuesday)");
{ const r=run({id:"andrew_andrew__all_about_spelling_1_L0011",day:"thursday",cascadedFrom:"tuesday"},true);
  ok("stays on Thursday",r.t.day==="thursday",r.t);
  ok("stale note cleared + persisted",r.t.cascadedFrom===undefined&&r.upd["andrew_andrew__all_about_spelling_1_L0011/cascadedFrom"]===null&&!("andrew_andrew__all_about_spelling_1_L0011/day" in r.upd),r.upd);
  ok("logged as skipped",/snap-back skipped/.test(r.logs[0]||""),r.logs); }
console.log("other day-bound cards (notebook, reflex, retrieval) keep the old snap-back");
{ const r=run({id:"x_reflex",day:"thursday",cascadedFrom:"tuesday"},false);
  ok("snapped back to its own day",r.t.day==="tuesday"&&r.upd["x_reflex/day"]==="tuesday"&&r.upd["x_reflex/cascadedFrom"]===null,r); }
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
