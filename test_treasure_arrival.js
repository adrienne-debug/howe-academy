/*
 * 🏴‍☠️ TCHEST — the ship reaches the treasure (her ask 2026-11-08). When every on-ladder card of a deck is graduated
 * (mastDeckMastery's own counting), the kid's map plays a ONE-TIME arrival card, the last stop becomes the open chest 💰,
 * and the one write — trophies/<kid>/treasure_<deckKey> through mintTrophy — puts a treasure chest (a kind of its own) in
 * the 🏴‍☠️ Treasures row of the shelf and a line on Mom's Scores. Never in dry run, never in Mom mode, no points.
 * Runs the REAL TMAP + TCHEST blocks and the app's own mintTrophy / hasTrophy / kidTrophies / mastDeckMastery.
 *   run:  node test_treasure_arrival.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("no fn "+name); const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j).split("\n// ")[0]; }
function lineOf(name){ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n",i)); }

// ── by text ──
const a=src.indexOf("// TCHEST_START"), b=src.indexOf("// TCHEST_END");
ok("one TCHEST block",a>0&&b>a&&src.indexOf("// TCHEST_START",a+1)<0);
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's or family's name in the block or this test",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew|adrienne|sara\b|howe|dewalt/i.test(blk)&&!/lincoln|ellis|lucy|julian|kenzie|sara\b|dewalt/i.test(fs.readFileSync(__filename,"utf8").replace(/no kid's or family's name[^\n]*/,"")));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("its only write is mintTrophy — no db / ref / set / update / HA_LS in the block",/mintTrophy\(/.test(code)&&(code.match(/mintTrophy\(/g)||[]).length===1&&!/\bdb\b|\.ref\(|\.set\(|\.update\(|HA_LS|localStorage/.test(code));
ok("no points, no Stars, no bank, no sounds, no timers",!/bankDirect|bank\/|\bpts\b|points|spin|_showCelebration|mastSpeak|Audio\(|setTimeout|setInterval/.test(code));
ok("kidTrophies leaves treasure records out (a chest never draws as a cup)",/filter\(t=>!\(t&&t\.type==="treasure"\)\)/.test(lineOf("kidTrophies")));
ok("the trophies listener sets trophiesLoaded; it starts false",/db\.ref\("trophies"\)\.on\("value",s=>\{ trophies=s\.val\(\)\|\|\{\}; trophiesLoaded=true; \}\);/.test(src)&&/\nlet trophiesLoaded=false;/.test(src));
const tsh=fnText("tmapStudyHtml");
ok("TMAP: one guarded tchMapCheck line and one guarded tchArriveHtml line in tmapStudyHtml",(tsh.match(/typeof tchMapCheck==="function"/g)||[]).length===1&&(tsh.match(/typeof tchArriveHtml==="function"/g)||[]).length===1);
ok("Wins Trophy Case and the Corner shelf each draw the Treasures row (guarded)",/typeof tchShelfHtml==="function"\)\?tchShelfHtml\(kid\)/.test(src)&&/typeof tchShelfHtml==="function"\)\?tchShelfHtml\(k,\{noHead:true\}\)/.test(fnText("tsShelfHTML")));
ok("Scores: both branches of scpCardHtml carry the guarded treasure line",(fnText("scpCardHtml").match(/typeof tchScoresHtml==="function"/g)||[]).length===2);

// ── a sandbox ──
const ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
function world(items,o){
  o=o||{};
  const writes=[];
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,
    MAST_TIER_ORDER:ORDER,MAST_TIER_COL:{daily:"#dc2626",weekly:"#ca8a04",graduated:"#7c3aed"},
    esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),
    mastIsNeverDrill:i=>!!(i&&(i.knowledge_type==="concept"||i.knowledge_type==="transfer")),
    mastDrillSettings:()=>({ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}),
    masteryData:{k:items||[]},
    mstSessions:k=>[{sid:"s1",kind:"deck",decks:["Math Facts","Roots"],emoji:"x"}],
    db:o.noDb?null:{ref:p=>({set:v=>writes.push({p,v:JSON.parse(JSON.stringify(v))})})},
    trophies:o.trophies||{}, trophiesLoaded:o.loaded!==false,
    _dryRun:()=>!!o.dry, momHere:()=>!!o.mom, envSiteOn:()=>false, nowTs:()=>"09:00 AM Nov 8"};
  vm.createContext(ctx);
  vm.runInContext(["hasTrophy","mintTrophy","kidTrophies","mastTierAtLeast","mastDeckMastery"].map(fnText).join("\n")+"\n"+
    cut("// TMAP_START","// TMAP_END")+"\n"+cut("// TCHEST_START","// TCHEST_END")+"\nthis.tchShow=tchShow;this.tchSeen=tchSeen;this.setTL=v=>{trophiesLoaded=v;};",ctx);
  ctx.writes=writes;
  return ctx;
}
const C=(id,deck,tier,extra)=>Object.assign({id:id,subject:deck,prompt:"front-"+id,answer:"back-"+id,status:"active",tier:tier},extra||{});
const s1={sid:"s1",kind:"deck",decks:["Math Facts","Roots"]};
const HALF=[C("m1","Math Facts","graduated"),C("m2","Math Facts","monthly"),C("r1","Roots","weekly")];
const DONE=[C("m1","Math Facts","graduated"),C("m2","Math Facts","graduated"),C("m3","Math Facts","graduated"),
  C("m4","Math Facts","weekly",{status:"introduction"}),C("m5","Math Facts","daily",{status:"parked"}),C("m6","Math Facts","daily",{knowledge_type:"concept"}),
  C("r1","Roots","weekly")];

{ const c=world(HALF);
  ok("PURE reached: a deck with a monthly card is not reached",c.tchReachedDeck(HALF,"Math Facts").reached===false&&c.tchReachedDeck(HALF,"Math Facts").n===2);
  ok("PURE reached: every on-ladder card graduated (introduction, parked, never-drill left out — mastDeckMastery's count) → reached, n 3",c.tchReachedDeck(DONE,"Math Facts").reached===true&&c.tchReachedDeck(DONE,"Math Facts").n===3);
  ok("PURE reached: a deck with no cards is not reached",c.tchReachedDeck(DONE,"Nothing").reached===false);
  const h=c.tmapStudyHtml("k",s1,"start");
  ok("not yet graduated → no arrival, the closed chest 🏆 at the last stop, no write",h.indexOf("tch-arrive")<0&&/tmap-chest">1\u{1F3C6}</u.test(h)&&h.indexOf("tmap-chest tmap-open")<0&&c.writes.length===0&&!c.hasTrophy("k","treasure_math_facts"));
}
{ const c=world(DONE);
  const h=c.tmapStudyHtml("k",s1,"start");
  ok("all graduated → the arrival card plays: chest, confetti, '⛵ Math Facts — you learned all 3!'",(h.match(/class="tch-arrive"/g)||[]).length===1&&/tch-cf/.test(h)&&h.indexOf("⛵ Math Facts — you learned all 3!")>0&&/\u{1F4B0} Yay!/u.test(h));
  ok("…and the map's last stop is the OPEN chest 💰 for that deck only (Roots stays closed)",/tmap-chest tmap-open">3\u{1F4B0}</u.test(h)&&/tmap-chest">\u{1F3C6}</u.test(h));
  ok("the flag is minted ONCE at trophies/k/treasure_math_facts, through mintTrophy, no points",c.writes.length===1&&c.writes[0].p==="trophies/k/treasure_math_facts"&&c.writes[0].v.type==="treasure"&&c.writes[0].v.key==="Math Facts"&&c.writes[0].v.n===3&&/^\d{4}-\d{2}-\d{2}$/.test(c.writes[0].v.date)&&c.writes[0].v.emoji==="➗"&&!("points" in c.writes[0].v));
  const h2=c.tmapStudyHtml("k",s1,"start");
  ok("the same card drawn again (a re-render) → the arrival stays on that card, still one write",h2.indexOf("tch-arrive")>0&&c.writes.length===1);
  const d=c.tmapStudyHtml("k",s1,"done");
  ok("the next card (after the sitting) → no arrival, the chest stays open, still one write",d.indexOf("tch-arrive")<0&&/tmap-open">3\u{1F4B0}</u.test(d)&&c.writes.length===1);
  const s=c.tmapStudyHtml("k",s1,"start");
  ok("…and the start card the next time → still no arrival, still open, twice run = once",s.indexOf("tch-arrive")<0&&/tmap-chest tmap-open/.test(s)&&c.writes.length===1);
  ok("the treasure record stays out of kidTrophies (no cup) and is in kidTreasures",c.kidTrophies("k").length===0&&c.kidTreasures("k").length===1);
}
{ // another device: the flag is already there → no arrival, no write, open chest even after a new card joins the deck
  const items=DONE.concat([C("m9","Math Facts","daily")]);
  const c=world(items,{trophies:{k:{treasure_math_facts:{type:"treasure",key:"Math Facts",name:"Math Facts",n:3,date:"2026-11-08"}}}});
  const h=c.tmapStudyHtml("k",s1,"start");
  ok("flagged on another device → no arrival here, no write; the chest stays open even with a new card on the deck",h.indexOf("tch-arrive")<0&&c.writes.length===0&&/tmap-chest tmap-open">3\u{1F4B0}</u.test(h));
}
{ const c=world(DONE,{dry:true}); const h=c.tmapStudyHtml("k",s1,"start");
  ok("dry run: the moment shows, NOTHING is minted (no db write, no in-memory flag)",h.indexOf("tch-arrive")>0&&c.writes.length===0&&!c.hasTrophy("k","treasure_math_facts"));
  c.tmapStudyHtml("k",s1,"done"); const h2=c.tmapStudyHtml("k",s1,"start");
  ok("…and it plays once per page life in dry run",h2.indexOf("tch-arrive")<0&&c.writes.length===0); }
{ const c=world(DONE,{mom:true}); const h=c.tmapStudyHtml("k",s1,"start");
  ok("Mom mode: open chest shown, no arrival, no mint (her look never uses up the kid's moment)",/tmap-chest tmap-open/.test(h)&&h.indexOf("tch-arrive")<0&&c.writes.length===0); }
{ const c=world(DONE,{loaded:false}); const h=c.tmapStudyHtml("k",s1,"start");
  ok("before the trophies listener delivered: open chest, no arrival, no mint",/tmap-chest tmap-open/.test(h)&&h.indexOf("tch-arrive")<0&&c.writes.length===0);
  c.setTL(true); const h2=c.tmapStudyHtml("k",s1,"start");
  ok("…once it has: the backfill mints that deck's flag (one write) and the arrival plays",h2.indexOf("tch-arrive")>0&&c.writes.length===1); }
{ const c=world(DONE); const h=c.tmapStudyHtml("k",s1,"run");
  ok("while a sitting runs → nothing drawn, nothing minted",h===""&&c.writes.length===0); }

// ── the shelf row + Scores ──
{ const T={k:{
    treasure_spelling:{type:"treasure",key:"Spelling",name:"Spelling",emoji:"\u{1F524}",n:40,date:"2026-12-02",ts:"x"},
    treasure_math_facts:{type:"treasure",key:"Math Facts",name:"Math Facts",emoji:"➗",n:30,date:"2026-11-08",ts:"x"},
    treasure_german:{type:"treasure",key:"German",name:"German",emoji:"\u{1F5E3}️",n:25,date:"2027-03-15",ts:"x"},
    session_x:{type:"session",key:"x",name:"Fall Session",ts:"10:00 AM Nov 1",points:100}}};
  const c=world([],{trophies:T});
  const sh=c.tchShelfHtml("k");
  const at=["Math Facts","Spelling","German"].map(n=>sh.indexOf('<div class="tch-tag">'+n+'</div>'));
  ok("shelf row: '🏴‍☠️ Treasures', one chest per flagged deck, in the order reached (date)",/\u{1F3F4}‍☠️ Treasures/u.test(sh)&&(sh.match(/class="tch"/g)||[]).length===3&&at.every((x,i)=>x>0&&(i===0||x>at[i-1])),at);
  ok("each chest: the deck's emoji in the lid medallion, the date on tap ('reached Nov 8')",/class="tch-emo">➗</.test(sh)&&/onclick="tchTap\(this\)"/.test(sh)&&/class="tch-dt">reached Nov 8</.test(sh)&&/reached Mar 15/.test(sh));
  ok("its own kind: no trophy SVG, no ribbon, no book spine in the row; a sea board under it",!/<svg|troGc|tro-bk|tro-row/.test(sh)&&/class="tch-sea"/.test(sh));
  ok("kidTrophies keeps the session cup, without the chests",c.kidTrophies("k").length===1&&c.kidTrophies("k")[0].type==="session");
  ok("no treasures → no row",c.tchShelfHtml("nobody")==="");
  const sc=c.tchScoresHtml("k");
  ok("Scores: one line per deck — '🏴‍☠️ Math Facts treasure reached Nov 8' first",(sc.match(/treasure reached/g)||[]).length===3&&sc.indexOf("\u{1F3F4}‍☠️ Math Facts treasure reached Nov 8")>0&&sc.indexOf("Math Facts")<sc.indexOf("German"));
  ok("Scores: nothing for a kid with none",c.tchScoresHtml("nobody")==="");
  ok("names are escaped on the shelf",(()=>{ const w=world([],{trophies:{k:{treasure_b:{type:"treasure",name:"<b>Roots",date:"2026-11-08"}}}}); return w.tchShelfHtml("k").indexOf("<b>Roots")<0; })());
}
// ── the deck key and emoji ──
{ const c=world([]);
  ok("deck key: Firebase-safe slug",c.tchDeckKey("Math Facts")==="math_facts"&&c.tchDeckKey("Nouns & Pronouns")==="nouns_pronouns"&&c.tchDeckKey("…")==="deck"&&c.tchId("German")==="treasure_german");
  ok("lid emoji: by name, else a one-deck session's emoji, else a gem",c.tchDeckEmoji("Spelling",[])==="\u{1F524}"&&c.tchDeckEmoji("Zzz",[{kind:"deck",decks:["Zzz"],emoji:"\u{1F98A}"}])==="\u{1F98A}"&&c.tchDeckEmoji("Zzz",[])==="\u{1F48E}"&&c.tchDeckEmoji("Science Facts",[])==="\u{1F52C}"&&c.tchDeckEmoji("Countries",[])==="\u{1F30D}"&&c.tchDeckEmoji("Parts of Speech",[])==="\u{1F48E}"&&c.tchDeckEmoji("Vocabulary Words",[])==="\u{1F4DD}");
}
// ── the Scores card (the real scpCardHtml) carries the line ──
{ const c={console,JSON,Object,Array,String,Number,Math,tchScoresHtml:k=>k==="ava"?'<div>TREASURE-LINE</div>':''};
  vm.createContext(c);
  vm.runInContext(["scpE","scpKidCol","scpKidName","scpN"].map(n=>{ try{ return fnText(n); }catch(e){ return ""; } }).join("\n")+"\nfunction scpE(s){return String(s);} function scpKidCol(){return '#000';} function scpKidName(k){return k;}\n"+fnText("scpCardHtml"),c);
  const h=vm.runInContext("scpCardHtml",c)({kid:"ava",any:false,right:{w7:{}},min:{w7:{}}});
  ok("scpCardHtml (nothing logged yet) still shows the treasure line inside the card",/TREASURE-LINE<\/div><\/div>$/.test(h));
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
