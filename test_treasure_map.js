/*
 * 🗺 Treasure map per deck (her "yes to all and go to all" 2026-11-03; PLAN_practice_games_2026-10-23.md §4.5 / §5 #7).
 * A picture of the ladder on the Study start card and the Nice work! card: stops = the kid's ladder rungs, a count per stop,
 * a ship ⛵ at the deck's average rung. Only the ladder moves it. No writes, no points, no sounds. Runs the REAL block.
 *   run:  node test_treasure_map.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }

// ── by text ──
const a=src.indexOf("// TMAP_START"), b=src.indexOf("// TMAP_END"), so=src.indexOf("// SORTIT_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one TMAP block among the game blocks: after SORTIT_END, before STUDYCOUNTS_START, straight after another block's _END line",so>0&&a>so&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(so,a).trim().split("\n").pop()||"")&&src.indexOf("// TMAP_START",a+1)<0&&src.indexOf("// TMAP_END",b+1)<0);
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("NO writes of any kind: no db, no ref/set/update/push/remove, no HA_LS / localStorage",!/\bdb\b|\.ref\(|\.set\(|\.update\(|\.push\(|\.remove\(|HA_LS|localStorage|_dryRun/.test(code));
ok("no currency, no points, no best, no spins, no sounds, no clock",!/bankDirect|points|\bpts\b|coins|spin|match_best|matchDing|matchBonk|mastSpeak|_showCelebration|setTimeout|setInterval|leaderboard|lives/i.test(code));
ok("never touches a card: no tier / next_due / status assignment, no gameLogRound (it is not a game), no GAMES_LIST line",!/\.(tier|status)\s*=(?!=)|next_due|gameLogRound|GAMES_LIST/.test(code)&&!/tmap/i.test(cut("const GAMES_LIST=[","];")));
const rms=fnText("renderMastStudy");
ok("renderMastStudy: ONE guarded tmapStudyHtml line on the orange card — run while a sitting runs, done after the save, start otherwise",(rms.match(/h\+=tmapStudyHtml\(/g)||[]).length===1&&/if\(typeof tmapStudyHtml==="function"\) h\+=tmapStudyHtml\(kid,session,\(mstState&&mstSid===session\.sid\)\?"run":\(mstDone\?"done":"start"\)\);/.test(rms));
ok("renderMastStudy: ONE guarded tmapMovedHtml line, inside the Nice work! (mstDone) card",(rms.match(/h\+=tmapMovedHtml\(/g)||[]).length===1&&rms.indexOf("tmapMovedHtml")>rms.indexOf("else if(mstDone){")&&rms.indexOf("tmapMovedHtml")<rms.indexOf("mpStudyDoneHtml"));
ok("the games' position tests still hold: nothing new between SPELLBUILD_END and GOFISH_START",!/\n(?!\/\/ (BRAINDUMP|BINGO|SORTIT|GOFISH)_)[^\n]*(_START|_END)/.test(src.slice(src.indexOf("// SPELLBUILD_END")+18,src.indexOf("// GOFISH_START"))));

// ── a sandbox ──
const ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
function world(items,o){
  o=o||{};
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,
    MAST_TIER_ORDER:ORDER,MAST_TIER_COL:{daily:"#dc2626",every_other_day:"#ea580c",weekly:"#ca8a04",bi_weekly:"#65a30d",monthly:"#0d9488",graduated:"#7c3aed"},
    esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),
    mastIsNeverDrill:i=>!!(i&&(i.knowledge_type==="concept"||i.knowledge_type==="transfer")),
    mastDrillSettings:()=>({ladder:o.ladder||["every_other_day","weekly","bi_weekly","monthly","graduated"]}),
    masteryData:{k:items||[]},
    mstSessions:k=>o.sessions||[{sid:"s1",kind:"deck",decks:["Math Facts","Roots"]},{sid:"s2",kind:"all",decks:["Science"]},{sid:"mix",kind:"mix",decks:[]},{sid:"ck",kind:"checkup",decks:["Math Facts"]}]};
  vm.createContext(ctx);
  vm.runInContext(cut("// TMAP_START","// TMAP_END")+"\nthis.tmapSnap=tmapSnap;",ctx);
  return ctx;
}
const C=(id,deck,tier,extra)=>Object.assign({id:id,subject:deck,prompt:"front-"+id,answer:"back-"+id,status:"active",tier:tier},extra||{});
const ITEMS=[C("m1","Math Facts","daily"),C("m2","Math Facts","every_other_day"),C("m3","Math Facts","weekly"),C("m4","Math Facts","monthly"),C("m5","Math Facts","graduated"),
  C("m6","Math Facts","every_third_day"),C("m7","Math Facts","weekly",{status:"introduction"}),C("m8","Math Facts","weekly",{status:"parked"}),C("m9","Math Facts","weekly",{knowledge_type:"concept"}),
  C("r1","Roots","bi_weekly"),C("r2","Roots","bi_weekly"),C("s1","Science","daily"),C("x1","Spelling","weekly")];

{ const c=world(ITEMS);
  const st=c.tmapStops(["every_other_day","weekly","bi_weekly","monthly","graduated"]);
  ok("stops: the ladder with Daily put in front (the harbor)",JSON.stringify(st)==="[\"daily\",\"every_other_day\",\"weekly\",\"bi_weekly\",\"monthly\",\"graduated\"]",st);
  ok("stops: a ladder that starts at Daily is used as it is",JSON.stringify(c.tmapStops(["daily","weekly","graduated"]))==="[\"daily\",\"weekly\",\"graduated\"]");
  ok("stops: junk, repeats and a scrambled order → known tiers once, in ladder order; nothing → the default",JSON.stringify(c.tmapStops(["monthly","weekly","nope","weekly","daily"]))==="[\"daily\",\"weekly\",\"monthly\"]"&&JSON.stringify(c.tmapStops(null))===JSON.stringify(st)&&JSON.stringify(c.tmapStops(["zzz"]))===JSON.stringify(st));
  ok("rung: a tier sits at the highest stop at or below it; below the first → the first; unknown → the first",c.tmapRung("daily",st)===0&&c.tmapRung("every_other_day",st)===1&&c.tmapRung("every_third_day",st)===1&&c.tmapRung("weekly",st)===2&&c.tmapRung("learned",st)===4&&c.tmapRung("graduated",st)===5&&c.tmapRung("???",st)===0&&c.tmapRung(undefined,st)===0);
  const m=c.tmapDeck(ITEMS,"Math Facts",st);
  ok("deck: counts per stop from the on-ladder cards only (introduction, parked, never-drill and other decks left out)",m.n===6&&JSON.stringify(m.counts)==="[1,2,1,0,1,1]",m);
  ok("deck: the ship is at the AVERAGE rung — (0+1+1+2+4+5)/6 — as a fraction of the path; the treasure count is the last stop",Math.abs(m.avg-13/6)<1e-9&&Math.abs(m.frac-(13/6)/5)<1e-9&&m.treasure===1);
  const e=c.tmapDeck(ITEMS,"Nothing",st);
  ok("deck with no cards: n 0, ship in the harbor",e.n===0&&e.frac===0&&e.avg===0);
  ok("decks for a deck session = its decks; the Daily Mix = the decks of every deck / all session; a check-up = none",JSON.stringify(c.tmapDecksFor({kind:"deck",decks:["Roots","Math Facts"]}))==="[\"Roots\",\"Math Facts\"]"&&JSON.stringify(c.tmapDecksFor({kind:"mix"},c.mstSessions("k")))==="[\"Math Facts\",\"Roots\",\"Science\"]"&&c.tmapDecksFor({kind:"checkup",decks:["x"]}).length===0&&c.tmapDecksFor(null).length===0);
}
{ const c=world(ITEMS), s1={sid:"s1",kind:"deck",decks:["Math Facts","Roots","Nothing"]};
  const h=c.tmapStudyHtml("k",s1,"start");
  ok("start card: a Treasure map with one row per deck that has cards (a deck with none is left out)",h.indexOf("Treasure map")>0&&(h.match(/class="tmap-row"/g)||[]).length===2&&h.indexOf(">Math Facts<")>0&&h.indexOf(">Roots<")>0&&h.indexOf("Nothing")<0);
  ok("each row has a ship, a line, and one stop per rung with its count ('·' when empty) and the treasure chest last",(h.match(/⛵/g)||[]).length===2&&(h.match(/class="tmap-stop"/g)||[]).length===12&&/tmap-chest">1\u{1F3C6}</u.test(h)&&/tmap-chest">\u{1F3C6}</u.test(h)&&h.indexOf(">·<")>0);
  const left=parseFloat((h.match(/tmap-ship" style="left:([\d.]+)%/)||[])[1]);
  ok("the ship stands over its average stop (Math Facts: (13/6+0.5)/6 of the width), inside the track",Math.abs(left-((13/6+0.5)/6*100))<0.1&&left>0&&left<100);
  ok("no card front or back is ever on the map — deck names and counts only",!/front-|back-/.test(h));
  ok("the start card remembers each deck's ship for this kid + session",c.tmapSnap["k|s1"]&&Math.abs(c.tmapSnap["k|s1"]["Math Facts"]-(13/6)/5)<1e-9&&c.tmapSnap["k|s1"].Roots!=null);
  ok("while a sitting runs → nothing; a session with no cards → nothing; no kid → nothing",c.tmapStudyHtml("k",s1,"run")===""&&c.tmapStudyHtml("k",{sid:"z",kind:"deck",decks:["Nothing"]},"start")===""&&c.tmapStudyHtml(null,s1,"start")===""&&c.tmapStudyHtml("k",s1,"")==="");
  ok("before anything moved: no 'moved ahead' line",c.tmapMovedHtml("k",s1)==="");
  // the sitting climbs one Math Facts card a rung; a Roots card falls
  c.masteryData.k.find(x=>x.id==="m1").tier="every_other_day";
  c.masteryData.k.find(x=>x.id==="r1").tier="weekly";
  const d=c.tmapStudyHtml("k",s1,"done"), mv=c.tmapMovedHtml("k",s1);
  ok("done card: the maps as they stand now (the climbed card's stop count moved); the snapshot is not re-taken",(d.match(/class="tmap-row"/g)||[]).length===2&&Math.abs(c.tmapSnap["k|s1"]["Math Facts"]-(13/6)/5)<1e-9);
  ok("'⛵ Math Facts moved ahead!' — and NO line for Roots, which slipped",mv.indexOf("⛵ Math Facts moved ahead!")>0&&mv.indexOf("Roots")<0&&JSON.stringify(c.tmapMoved("k",s1))==="[\"Math Facts\"]");
  ok("a session the start card never drew (a reload mid-sitting) → no line",c.tmapMovedHtml("k",{sid:"other",kind:"deck",decks:["Math Facts"]})==="");
  ok("a deck name is escaped",c.tmapStudyHtml("k",{sid:"q",kind:"deck",decks:["<b>Roots"]},"start").indexOf("<b>")<0||!c.masteryData.k.some(x=>x.subject==="<b>Roots"));
}
{ const c=world([C("a","Roots","daily"),C("b","Roots","daily"),C("c","Roots","daily")]);
  const h=c.tmapStudyHtml("k",{sid:"s",kind:"deck",decks:["Roots"]},"start");
  ok("a brand-new deck: every card in the harbor, the ship at the first stop",Math.abs(parseFloat((h.match(/tmap-ship" style="left:([\d.]+)%/)||[])[1])-(0.5/6*100))<0.1&&/tmap-has"[^>]*>3</.test(h));
  const g=world([C("a","Roots","graduated"),C("b","Roots","graduated")]);
  const gh=g.tmapStudyHtml("k",{sid:"s",kind:"deck",decks:["Roots"]},"start");
  ok("a finished deck: the ship at the treasure, 2🏆",/tmap-chest">2\u{1F3C6}</u.test(gh)&&Math.abs(parseFloat((gh.match(/tmap-ship" style="left:([\d.]+)%/)||[])[1])-(5.5/6*100))<0.1);
  const dl=world([C("a","Roots","weekly")],{ladder:["daily","weekly","monthly"]});
  ok("the kid's own ladder is the path (3 stops here)",(dl.tmapStudyHtml("k",{sid:"s",kind:"deck",decks:["Roots"]},"start").match(/class="tmap-stop"/g)||[]).length===3);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
