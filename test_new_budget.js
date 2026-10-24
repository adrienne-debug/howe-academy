/*
 * 🎯 New-card budget (her yes 2026-10-23). One daily total per kid; study sessions take a share by role:
 * fixed (German 5) → keeps pace with the book (Science, Social Studies) → takes what's left (Daily Study).
 * Senses load: over 60 reviews a day on the ladder → 2 fewer; over 90 → pace/rest take 1. Budget off → nothing changes.
 * Since the review engine (2026-10-24) the load is the WHOLE ladder — Σ cards ÷ their rung's school days — not today's due.
 *   run:  node test_new_budget.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const blk=src.slice(src.indexOf("// NEWBUDGET_START"),src.indexOf("// NEWBUDGET_END"));
function fn(n){ const i=src.indexOf("\nfunction "+n+"("); if(i<0) throw new Error("no "+n); return src.slice(i+1,src.indexOf("\n}",i+1)+2); }

// Lincoln-shaped data: German (fixed 5), Science (pace, max 10), Social Studies (pace, max 5), Daily Study (rest, max 8).
function sandbox(o){
  o=o||{};
  const items=[], bank={};
  const add=(deck,n,status,opts)=>{ for(let k=0;k<n;k++) items.push(Object.assign({id:deck+"_"+status+k,subject:deck,prompt:deck+" "+status+" "+k,status,tier:status==="active"?"weekly":"daily",next_due:status==="active"?(o.dueAt!=null?o.dueAt:500):undefined},opts||{})); };
  add("German",4,"active"); add("Science",3,"active"); add("Discover",2,"active"); add("Grammar",2,"active");
  if(o.eod) add("Grammar",o.eod,"active",{tier:"every_other_day",next_due:o.dueAt!=null?o.dueAt:500});   // ½ a review a day each
  if(o.lincoln){ add("German",149,"active",{tier:"every_other_day"}); add("Science",107,"active",{tier:"weekly"}); add("Discover",26,"active",{tier:"bi_weekly"}); add("Grammar",35,"active",{tier:"monthly"}); }
  bank.Science=Array.from({length:o.sciWaiting!=null?o.sciWaiting:58},(_,k)=>"sci word "+k);
  bank.Discover=Array.from({length:o.ssWaiting!=null?o.ssWaiting:6},(_,k)=>"ss word "+k);
  bank.Grammar=["g1","g2"];
  const sessions=o.sessions||[
    {sid:"german",name:"German",kind:"deck",decks:["German"],newPerDay:5,maxCards:25,focusDecks:1,budgetRole:"fixed"},
    {sid:"science",name:"Science",kind:"deck",decks:["Science"],newPerDay:10,maxCards:10,focusDecks:3,budgetRole:"pace"},
    {sid:"social",name:"Social Studies",kind:"deck",decks:["Discover"],newPerDay:5,maxCards:10,focusDecks:1,budgetRole:"pace"},
    {sid:"dailystudy",name:"Daily Study",kind:"all",decks:["Grammar"],newPerDay:8,maxCards:18,focusDecks:6,budgetRole:"rest"},
    {sid:"daily_mix",name:"Daily Mix",kind:"mix",decks:[],budgetRole:null}];
  const writes=[];
  const ctx={console,Math,Object,Array,String,Number,JSON,Set,
    MAST_TIER_INT:{daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null},
    masteryData:{lincoln:items,lincoln_settings:o.settings||{new_budget:12}},
    mstSessions:()=>sessions,
    mastBankEligible:(kid,d)=>bank[d]||[],
    mastIsParked:i=>i.status==="parked", mastIsNeverDrill:()=>false,
    mastIsDue:(i,pn)=>i.next_due!=null&&pn>=i.next_due,
    esc:s=>String(s), momHere:()=>o.mom!==false,
    db:{ref:p=>({set:v=>writes.push([p,v])})}, HA_LS:{setItem(){}}, renderAll:()=>{}};
  vm.createContext(ctx); vm.runInContext(blk,ctx);
  return {ctx,writes,run:c=>vm.runInContext(c,ctx)};
}
const plan=(S)=>S.run('JSON.parse(JSON.stringify(nbPlan("lincoln",204)))');
const shares=p=>Object.fromEntries(Object.entries(p.by).map(([k,v])=>[k,v.n]));

console.log("🎯 a normal day: fixed → book pace → what's left");
{
  const p=plan(sandbox());
  ok("light load (11 weekly cards ≈ 2 a day) → full budget of 12",p.level==="ok"&&p.room===12&&p.load===2,[p.level,p.room,p.load]);
  ok("German fixed at 5",p.by.german.n===5);
  ok("Science keeps pace: 58 waiting ÷ 15 days → 4",p.by.science.n===4&&p.by.science.waiting===58,p.by.science);
  ok("Social Studies keeps pace: 6 waiting → 1",p.by.social.n===1,p.by.social);
  ok("Daily Study takes what's left: 12 − 5 − 4 − 1 = 2",p.by.dailystudy.n===2,shares(p));
  ok("the Mix is never in the budget",!p.by.daily_mix);
  ok("total used = 12",p.used===12,p.used);
}

console.log("📖 the book sets the pace, inside its New/day");
{
  ok("more chapters open → more a day (150 waiting → 10)",plan(sandbox({sciWaiting:150})).by.science.n===10);
  ok("…but never past its New/day (300 waiting → still 10)",plan(sandbox({sciWaiting:300})).by.science.n===10);
  ok("a little waiting → at least 1 (3 waiting → 1)",plan(sandbox({sciWaiting:3})).by.science.n===1);
  ok("nothing released → 0, and that seat goes to Daily Study",(()=>{ const p=plan(sandbox({sciWaiting:0})); return p.by.science.n===0&&p.by.dailystudy.n===6; })(),shares(plan(sandbox({sciWaiting:0}))));
  ok("a big Science day squeezes Daily Study down to 1, never 0",(()=>{ const p=plan(sandbox({sciWaiting:150})); return p.by.dailystudy.n===1; })(),shares(plan(sandbox({sciWaiting:150}))));
  ok("Daily Study never takes more than its New/day (budget 30 → 8)",plan(sandbox({settings:{new_budget:30}})).by.dailystudy.n===8);
}

console.log("⚖️ it senses his whole review load");
{
  const busy=plan(sandbox({eod:130}));
  ok("130 every-other-day cards + 11 weekly → 67 reviews a day → busy, budget 12 − 2 = 10",busy.level==="busy"&&busy.room===10&&busy.load===67,[busy.level,busy.room,busy.load]);
  ok("…German stays 5, Science 4, SS 1, Daily Study squeezed to its floor of 1",busy.by.german.n===5&&busy.by.science.n===4&&busy.by.social.n===1&&busy.by.dailystudy.n===1,shares(busy));
  const heavy=plan(sandbox({lincoln:true}));
  ok("Lincoln's ladder 2026-10-24 (149 EOD · 107 weekly · 26 bi-weekly · 35 monthly ≈ 100) + the 11 above = 102 a day → heavy",heavy.level==="heavy"&&heavy.load===102,[heavy.level,heavy.load]);
  ok("…German still 5, the flexible sessions take 1 each",heavy.by.german.n===5&&heavy.by.science.n===1&&heavy.by.social.n===1&&heavy.by.dailystudy.n===1,shares(heavy));
  ok("a book-paced session with nothing waiting stays at 0 on a heavy day",plan(sandbox({lincoln:true,ssWaiting:0})).by.social.n===0);
  ok("leveling can't hide it: the same ladder reads the same load whether everything is due today or nothing is",plan(sandbox({eod:130,dueAt:100})).load===plan(sandbox({eod:130,dueAt:900})).load);
  ok("learning (introduction) and parked cards don't count",(()=>{ const S=sandbox(); S.run('masteryData.lincoln.push({id:"i",status:"introduction",tier:"daily"},{id:"p",status:"parked",tier:"weekly"})'); return S.run('nbLoad("lincoln",204)')===2; })());
}

console.log("📴 off means off");
{
  ok("no budget set → no plan",sandbox({settings:{}}).run('nbPlan("lincoln",204)')===null);
  ok("budget set but no session has a role → no plan",sandbox({sessions:[{sid:"x",kind:"deck",decks:["Science"],newPerDay:5}]}).run('nbPlan("lincoln",204)')===null);
  const S=sandbox();
  ok("a session without a role gets null (uses its own New/day)",S.run('nbSessionToday("lincoln",{sid:"zz",kind:"deck",budgetRole:null},204)')===null);
  ok("a session with a role gets its share",S.run('nbSessionToday("lincoln",{sid:"science",budgetRole:"pace"},204).n')===4);
}

console.log("✏️ setting the budget");
{
  const S=sandbox();
  S.run('nbSetBudget("lincoln",10)');
  ok("writes only mastery/<kid>_settings/new_budget",S.writes.length===1&&S.writes[0][0]==="mastery/lincoln_settings/new_budget"&&S.writes[0][1]===10,S.writes);
  S.run('nbSetBudget("lincoln",0)');
  ok("0 turns it off (writes null)",S.writes[1][1]===null&&S.run('nbBudget("lincoln")')===0);
  const K=sandbox({mom:false}); K.run('nbSetBudget("lincoln",20)');
  ok("only Mom can change it",K.writes.length===0);
}

console.log("wiring");
ok("mstSessions carries budgetRole (only the three roles)",/budgetRole: \(rec\.budgetRole === "fixed" \|\| rec\.budgetRole === "pace" \|\| rec\.budgetRole === "rest"\) \? rec\.budgetRole : null/.test(src));
const pile=fn("mstPile");
ok("mstPile asks for today's share",/const _nb = \(typeof nbSessionToday === "function"\) \? nbSessionToday\(kid, session, pn\) : null;/.test(pile));
ok("…uses it for new cards",/const newPerDay = Math\.min\(Math\.max\(0, _npd - shownNewCount\),/.test(pile));
ok("…and grows the card limit by the share",/const _maxCards = \(_nb && session\.maxCards > 0\) \? session\.maxCards \+ _nb\.n : session\.maxCards;/.test(pile)&&/const seats = _maxCards > 0/.test(pile)&&!/session\.maxCards - doneToday/.test(pile));
ok("the session editor saves the role for deck and Daily Study sessions",/rec\.budgetRole = mhqSessForm\.budgetRole;/.test(src));
ok("the editor offers the four choices",/\["", "Not in it"\], \["fixed", "Fixed"\], \["pace", "Keeps pace with the book"\], \["rest", "Takes what\\u2019s left"\]/.test(src));
ok("the sessions list shows the budget card",/h \+= nbBudgetCardHtml\(kid, mastGetPrintNum\(kid\)\);/.test(src));
ok("the block is marked",src.indexOf("// NEWBUDGET_START")>0&&src.indexOf("// NEWBUDGET_END")>src.indexOf("// NEWBUDGET_START"));
ok("no 🔀 emoji",src.indexOf("\u{1F500}")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
