/* 🎓 TEACHSCORE — Teach it is scored as its own line (her decision 2026-11-08, games audit §4 #12 / §7 rank 7 / Q6).
   Teach it's ✓ is the listener's verdict tapped on the teacher's device, so a Teach round changes no Right % (scpRight) and no
   learned-through-games count (scgLearned); the 🎮 Games section shows "🎓 taught: N cards · M rounds", no Right %. The round is still
   logged (TEACH block → gameLogRound) with its count and minutes.
   run: node test_teach_score.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const blk=(a,z)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(z,i); if(j<0) throw new Error("missing end "+z); return src.slice(i,j); };

console.log("── by text ──");
ok("one SCP_UNSCORED list: Teach it only", /const SCP_UNSCORED=\{teach:1\};/.test(src)&&src.split("const SCP_UNSCORED=").length===2);
// 📊 SCPSKIP (2026-11-08): every Right % / learned-through-games exclusion lives in ONE list, read by both readers
const skipList=(src.match(/const SCP_SKIP=\[([\s\S]*?)\];/)||[])[1]||"";
ok("SCP_SKIP is the one list: before judging, Teach it, a study round, a Pictures sort", ["scpPreJudge","scpUnscored","scpStudyRound","scpCatSort"].every(f=>new RegExp("^\\s*"+f+",?\\s*//","m").test(skipList)) && (src.match(/const SCP_SKIP=/g)||[]).length===1);
ok("scpRight and scgLearned both skip through it (one guarded clause each), and nothing else names the rules there", (src.match(/forEach\(e=>\{ if\(scpSkip\(e\)\) return;/g)||[]).length===2 && !/scpUnscored\(e\)\|\||scpPreJudge\(e\)\) return/.test(src));
ok("the TEACH block still logs its round (game teach) — nothing in it changed", /try\{ if\(typeof gameLogRound==="function"\) gameLogRound\(st\); \}catch\(e\)\{\}   \/\/ 🎮 GAMELOG: each card's verdict, game:"teach"/.test(blk("// TEACH_START","// TEACH_END")));
ok("no 🔀 anywhere in index.html", src.indexOf("\u{1F500}")<0);

const ctx={console}; vm.createContext(ctx);
vm.runInContext(blk("const SC_RANK=","\n// History-shaped view")+"\n"+blk("// SCORESPAGE_START","// SCORESPAGE_END")+"\n"+blk("// SCORESGAMES_START","// SCORESGAMES_END"),ctx);
const run=e=>vm.runInContext(e,ctx);
const scpRight=run("scpRight"), scgLearned=run("scgLearned"), scgStats=run("scgStats"), scgHtml=run("scgHtml"), scpMinutes=run("scpMinutes");

// a card missed in the drill on 11/01, ✓ on 11/06; a Which one? round and a Teach round between
const cards=[{id:"t1",status:"active",tier:"weekly",subject:"Science",answer:"Name t1"},{id:"t2",status:"active",tier:"weekly",subject:"Science",answer:"Name t2"},{id:"t3",status:"active",tier:"weekly",subject:"Science",answer:"Name t3"}];
const H={ava:{"20261101":{items:[{id:"t1",result:"m"},{id:"t2",result:"m"},{id:"t3",result:"c"}]},"20261106":{items:[{id:"t1",result:"c"},{id:"t2",result:"c"},{id:"t3",result:"c"}]}}};
const WHICH={game:"which",deck:"Science",at:1,secs:120,why:"free",items:[{id:"t1",ok:true,n:1},{id:"t3",ok:false,n:2}]};
const TEACH={game:"teach",deck:"Science",at:2,secs:300,why:"free",items:[{id:"t2",ok:true,n:1},{id:"t3",ok:true,n:1},{id:"t1",ok:false,n:2},{id:"t1",ok:true,n:1,back:true}]};
const GL0={ava:{"20261103":{a:WHICH}}}, GL1={ava:{"20261103":{a:WHICH,b:TEACH}}};
const W={from:"20261101",to:"20261108"};

console.log("── Right % ──");
{ const r0=scpRight("ava",H,{},GL0,W), r1=scpRight("ava",H,{},GL1,W);
  ok("a Teach round changes no Right % (graded, right, pct, games n / ok all equal)", JSON.stringify(r0)===JSON.stringify(r1), [r0,r1]);
  ok("…the honest game still counts (2 answered, 1 right)", r1.games.n===2&&r1.games.ok===1);
  const only=scpRight("ava",{},{},{ava:{"20261103":{b:TEACH}}},W);
  ok("Teach rounds alone → nothing graded (pct null)", only.graded===0&&only.pct===null);
  ok("its minutes still count (the round is kept, her 'count and minutes')", scpMinutes("ava",{},{},GL1,W,5).games===Math.round(420/60)); }

console.log("── learned through games ──");
{ const L0=scgLearned("ava",cards,H,{},GL0), L1=scgLearned("ava",cards,H,{},GL1);
  ok("t1: missed → right in Which one? → ✓ = learned (unchanged)", L0.indexOf("t1")>=0&&L1.indexOf("t1")>=0);
  ok("t2: its only in-between right is a Teach ✓ → NOT learned through games", L1.indexOf("t2")<0);
  ok("a Teach round changes no learned count", L0.length===L1.length&&JSON.stringify(L0.slice().sort())===JSON.stringify(L1.slice().sort()), [L0,L1]);
  const asWhich={ava:{"20261103":{a:WHICH,b:Object.assign({},TEACH,{game:"which"})}}};
  ok("(control) the same rights logged as another game WOULD count t2", scgLearned("ava",cards,H,{},asWhich).indexOf("t2")>=0); }

console.log("── the 🎮 Games section ──");
{ const s0=scgStats("ava",{gameLog:GL0,cards:cards,history:H,today:"20261108"}), s1=scgStats("ava",{gameLog:GL1,cards:cards,history:H,today:"20261108"});
  ok("Teach is not a row in the games table and in no deck", !s1.games.some(g=>g.key==="teach")&&s1.decks.every(d=>!d.games.teach));
  ok("the summary's first-try % is unchanged by it", s0.total.pct===s1.total.pct&&s0.total.n===s1.total.n&&s0.total.ok===s1.total.ok);
  ok("…but its round is a round played (all time / 7 days)", s1.total.rounds===s0.total.rounds+1&&s1.total.w7===s0.total.w7+1);
  ok("taught: 3 cards (a came-back card is not a second card) · 1 round", s1.taught&&s1.taught.cards===3&&s1.taught.rounds===1, s1.taught);
  ok("no Teach round → no taught line", s0.taught===null);
  const h=scgHtml(s1,true,cards);
  ok("the line renders: 🎓 taught: 3 cards · 1 round", /class="scg-taught"[^>]*>\u{1F393} taught: <b>3<\/b> cards · 1 round<\/div>/u.test(h));
  ok("…with no Right % on it, and no Teach row in the table", !/scg-taught[^<]*<b>3<\/b> cards · 1 round[^<]*%/.test(h)&&h.indexOf("<td style=\"padding:4px 6px;border-top:1px solid #eef2f7;vertical-align:top\">teach")<0);
  ok("'How these are counted' says what taught means", /Taught = Teach it/.test(h));
  ok("no Teach round → the section is byte-identical to before", scgHtml(s0,true,cards).indexOf("scg-taught")<0);
  const two=scgStats("ava",{gameLog:{ava:{"20261103":{b:TEACH},"20261104":{c:Object.assign({},TEACH,{at:3,items:[{id:"t1",ok:true,n:1}]})}}},cards:cards,history:H,today:"20261108"});
  ok("two rounds: 4 cards · 2 rounds; a kid with only Teach rounds still gets a section", two.any&&two.taught.cards===4&&two.taught.rounds===2&&/taught: <b>4<\/b> cards · 2 rounds/.test(scgHtml(two,true,cards))); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
