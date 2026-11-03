/* 🏆 KCWINS — Wins moved behind Mom's Day (SCHEDBAR), so the kid's own view lives in Kids' Corner (her plan-2 yes 2026-11-02). The
 * Corner's 🏆 Trophies shelf (TROPHYSHELF 10/22) already had the trophy case, reading log and streaks; it gains the two pieces it
 * lacked from the Wins page — the book progress bars ("Where I am") and the finished list — through two shared helpers that the Wins
 * page itself now draws with (byte-identical output). Kid view only: no Mom tools.   run: node test_kc_wins.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const a=src.indexOf("// KCWINS_START"), b=src.indexOf("// KCWINS_END"); const block=src.slice(a,b);
ok("KCWINS block is marked once, right before renderPace", a>0&&b>a&&src.split("// KCWINS_START").length===2&&/\/\/ KCWINS_END\nfunction renderPace\(el\)\{/.test(src));
ok("every inline <script> still compiles", (()=>{ const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m,n=0; while((m=re.exec(src))){ n++; try{ new vm.Script(m[1]); }catch(e){ console.log("    script #"+n+": "+e.message); return false; } } return n>0; })());
ok("no family or kid name in the block", !/lincoln|ellis|lucy|julian|howe|dewalt|burris/i.test(block));

// the two helpers in a small world
function world(o){
  o=o||{};
  const env={ PACE_KIDS:["ava","ben"], PACE_KCOL:{ava:"#aa0000",ben:"#0000aa"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;"),
    paceLiveKeys:k=>Object.keys(o.bars&&o.bars[k]||{}), subjectProgress:(k,sk)=>(o.bars[k][sk]), rlBooks:k=>(o.rl&&o.rl[k])||[] };
  const keys=Object.keys(env);
  return new Function(...keys,block+"\nreturn {paceBarsHTML,paceWinsListHTML};")(...keys.map(k=>env[k]));
}
console.log("── paceBarsHTML ──");
{ const w=world({bars:{ava:{math:{label:"Math",unit:"lesson",cur:12,total:40,pct:30,done:false,now:"Lesson 12"},hist:{label:"History",unit:"page",cur:200,total:300,pct:67,done:false,book:"Vol 2",bookCount:4,bookNum:2},read:{label:"Reading",unit:"at",now:"Ch. 3",done:false}}}});
  const h=w.paceBarsHTML("ava");
  ok("a kid card with the name header, bars sorted nearest-done first", /^<div class="pace-kid-card"><div class="pace-kid-name" style="color:#aa0000;margin-bottom:8px">Ava<\/div>/.test(h)&&h.indexOf("History")<h.indexOf("Math"));
  ok("a page book names the book and the volume count; a lesson book its spot; an 'at' subject just where they are", /Vol 2 <span style="opacity:0.6">\(book 2 of 4\)<\/span> · page 200 of 300 · 67%/.test(h)&&/Lesson 12 · 12 of 40 lessons · 30%/.test(h)&&/Reading<\/span><span style="color:var\(--muted\);font-size:11px">on Ch\. 3<\/span>/.test(h));
  ok("bars coloured by the kid, a done one green", /pace-bar-fill" style="width:67%;background:#aa0000"/.test(h));
  ok("noName: the same card without the header (the shelf's title says whose it is)", /^<div class="pace-kid-card"><div style="margin-bottom:9px">/.test(w.paceBarsHTML("ava",{noName:true})));
  ok("nothing live → '' (the shelf shows no section)", w.paceBarsHTML("ben")===""); }
console.log("── paceWinsListHTML ──");
{ const w=world({rl:{ava:[{title:"Owl Moon",status:"done"},{title:"Frog",status:"reading"}]}});
  const win={books:[{kid:"ava",name:"Math 2"}],done:[{kid:"ava",subject:"Spelling"}]};
  const h=w.paceWinsListHTML("ava",win);
  ok("one kid: the green Wins 🎉 card with 📖 book · 🎉 subject · 📚 reading-log finishes, no kid names", /^<div style="background:#f0fdf4;[^"]*"><div style="[^"]*">Wins 🎉<\/div><div style="font-size:12px;color:#166534;padding:2px 0">📖 finished <b>Math 2<\/b><\/div><div[^>]*>🎉 finished <b>Spelling<\/b><\/div><div[^>]*>📚 finished <b>Owl Moon<\/b><\/div><\/div>$/.test(h)&&!/Ava finished/.test(h));
  ok("the family view names the kid", /📖 Ava finished <b>Math 2<\/b>/.test(w.paceWinsListHTML("all",win))&&/📚 Ava finished <b>Owl Moon/.test(w.paceWinsListHTML("mom",win)));
  ok("bare: the lines alone (the shelf has its own title)", /^<div style="font-size:12px;color:#166534;padding:2px 0">📖 finished/.test(w.paceWinsListHTML("ava",win,{bare:true}))&&!/Wins 🎉/.test(w.paceWinsListHTML("ava",win,{bare:true})));
  ok("nothing finished → ''", w.paceWinsListHTML("ben",{books:[],done:[]})===""); }
console.log("── the Wins page draws with the helpers (same output as before) ──");
{ const rp=fn("renderPace");
  ok("per-kid cards via paceBarsHTML, the finished card via paceWinsListHTML(kid,_win)", /showKids\.forEach\(k=>\{ h\+=paceBarsHTML\(k\); \}\);/.test(rp)&&/const _win=paceWins\(kid\);\n  h\+=paceWinsListHTML\(kid,_win\);/.test(rp));
  ok("the old inline copies are gone from renderPace (one drawing, two pages)", !/pace-kid-name/.test(rp)&&!/Wins 🎉/.test(rp)&&/paceEncouragement\(_lt,_stk,_win\)/.test(rp)); }
console.log("── the Corner's 🏆 Trophies shelf ──");
{ const ts=fn("tsShelfHTML");
  ok("after the Reading log: 📘 Where I am (bars, no name) and 🎉 Finished (bare lines), each only when it has something", /Reading log'[^\n]*\n  \/\/ KCWINS[^\n]*\n  let bars='', fin='';[^\n]*paceBarsHTML\(k,\{noName:true\}\)[^\n]*paceWinsListHTML\(k,paceWins\(k\),\{bare:true\}\)[^\n]*\n  if\(bars\)\{ any=true; h\+=sec\('\\u\{1F4D8\} Where I am',bars\); \}\n  if\(fin\)\{ any=true; h\+=sec\('\\u\{1F389\} Finished','<div style="padding:2px 0 4px;font-size:'\+fs\+'">'\+fin\+'<\/div>'\); \}/.test(ts));
  ok("guarded: typeof checks + try/catch, so a device without the pace code (or a test world) still draws the shelf", /try\{ if\(typeof spGridReset==="function"\) spGridReset\(\); if\(typeof paceBarsHTML==="function"\)/.test(ts)&&/\}catch\(e\)\{ bars=''; fin=''; \}/.test(ts));
  ok("kid view only: the shelf still draws no Mom tool (no give/dock, celebrate, store editor, Mom mode reads)", !/momModeActive|momHere\(|celebrate|gbPool|_bankCardHTML|storeEdit/.test(ts));
  ok("the Trophies button and shelf door are untouched (TROPHYSHELF)", /tsStripHTML\(k\)/.test(src)&&/tsOpenKid===k\) h\+=tsShelfHTML\(k\);/.test(src)); }
ok("no Firebase writes in the block", !/db\.|\.ref\(/.test(block));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
