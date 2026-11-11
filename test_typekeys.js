/*
 * ⌨️ TYPEKEYS (her report 2026-11-10: "the decimal questions will not allow me to add a . … when needing to type german
 * words in we dont always have the special characters needed"). (1) The games' number pad (games.js) gets "." / "," / "-"
 * when the game's own number backs use them — it was 1–9, 0, ⌫, ✔ only, so 3.5 could never be typed. (2) A row of the
 * DECK's special letters under the Study session's typed-answer boxes — never the card's, never in answer order.
 *   run:  node test_typekeys.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const games=fs.readFileSync(path.join(__dirname,"games.js"),"utf8");
const src=require("./test_src.js")(path.join(__dirname,"index.html"));
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }

// ── by text ──
const a=html.indexOf("// TYPEKEYS_START"), b=html.indexOf("// TYPEKEYS_END");
ok("one TYPEKEYS block in index.html, right after MST_TYPEANS_END",a>0&&b>a&&html.indexOf("// TYPEKEYS_START",a+1)<0&&html.lastIndexOf("// MST_TYPEANS_END",a)>0&&a-html.lastIndexOf("// MST_TYPEANS_END",a)<40);
const blk=html.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("the block cites her words and the date",/her report 2026-11-10/.test(blk)&&/add a \. when needing to type/.test(blk));
ok("writes nothing (no db, no storage)",!/\bdb\b|firebase|localStorage|sessionStorage|_dryRun/.test(code));
ok("no kid's name and no language name as logic",!/lincoln|ellis|lucy|julian|german|spanish|french|deutsch/i.test(code));
ok("no 🔀 anywhere in index.html",html.indexOf("\u{1F500}")<0);
// the two Study typed-answer boxes carry the row, from the card's DECK (never its name or answer)
const tIn=html.indexOf('<input id="mst-type-in"'), tAns=html.indexOf('<input id="mst-typeans-in"');
const lineAfter=i=>{ const e=html.indexOf("\n",i); return html.slice(e+1,html.indexOf("\n",e+1)); };
ok("⌨️ Type it (mst-type-in): the deck's letters under the box, from the names side",/typeKeysRowHtml\("mst-type-in",typeKeysForDeck\(card\.deck,"name"\)\)/.test(lineAfter(tIn)));
ok("⌨️ Type the answer (mst-typeans-in): the deck's letters under the box, from the answers side",/typeKeysRowHtml\("mst-typeans-in",typeKeysForDeck\(card\.deck,"def"\)\)/.test(lineAfter(tAns)));
// A. nothing on the typed boxes blocks "." — plain text boxes, no numeric keyboard, no key filter
const inTag=i=>html.slice(i,html.indexOf(">",i));
[["mst-type-in",tIn],["mst-typeans-in",tAns]].forEach(([id,i])=>{
  const tag=inTag(i);
  ok(id+": a plain text box (type=text, no inputmode=numeric, no pattern) — '.' types",/type="text"/.test(tag)&&!/inputmode="numeric"|type="number"|pattern=/.test(tag));
  ok(id+": its only key handler is Enter → Check (no key filter)",(tag.match(/onkeydown="[^"]*"/)||[""])[0].replace(/if\(event\.key===\\'Enter\\'\)\{event\.preventDefault\(\);mstCheck(Typed|TypeAns)\(\);\}/,"")==='onkeydown=""');
});
// A. the games' number pads
const pads=games.match(/\["1","2","3","4","5","6","7","8","9","back","0","ok"\][^\n]{0,80}/g)||[];
ok("all 5 game number pads (Go Fish, Jeopardy, Connect 4, Sure?, Kaboom) add typeKeysPadFor(st)",pads.length===5&&pads.every(p=>/\.concat\(typeof typeKeysPadFor==="function"\?typeKeysPadFor\(st\):\[\]\)\.forEach\(/.test(p)),pads.length);
["buildGofishHtml","buildJeopHtml","buildFourHtml","buildSureHtml","buildKaboomHtml"].forEach(f=>{
  const i=games.indexOf("function "+f+"("), j=games.indexOf("\nfunction ",i+10), body=games.slice(i,j);
  ok(f+": its pad sees this game's own state as st",/const st=[a-zA-Z]+State/.test(body)&&/typeKeysPadFor\(st\)/.test(body));
});
["gofishKey","jeopKey","fourKey","sureKey","kaboomKey"].forEach(f=>{
  const i=games.indexOf("function "+f+"("), body=games.slice(i,games.indexOf("\n}",i)+2);
  ok(f+": the key handler adds whatever key it is given (so '.' and '-' go in)",/t\.typed\+=ch/.test(body)&&!/\\d|\[0-9\]|isNaN/.test(body));
});

// ── run the block ──
const ctx={console,Math,Array,Object,JSON,Number,String,RegExp,WeakMap,Error};
vm.createContext(ctx);
vm.runInContext(blk+"\nthis.typeKeysFrom=typeKeysFrom;this.typeKeysPadExtra=typeKeysPadExtra;this.typeKeysPadFor=typeKeysPadFor;this.typeKeysForDeck=typeKeysForDeck;this.typeKeysRowHtml=typeKeysRowHtml;this.typeKeysIns=typeKeysIns;",ctx);
const F=ctx.typeKeysFrom, J=x=>JSON.stringify(Array.from(x));

// B. pure key derivation
const german=["der Hund","die Tür","das Mädchen","schön","die Straße","Österreich","der Bär","die Übung","Äpfel","grün","heiß","fünf"];
ok("German deck → the umlauts and ß, small letters sorted then capitals",J(F(german))===J(["ä","ö","ß","ü","Ä","Ö","Ü"]),F(german));
ok("English deck → nothing",F(["the dog","a cat","Who's there?","don't","rock-n-roll","\"quoted\""]).length===0);
const spanish=["¿Cómo estás?","¡Hola!","el niño","la canción","el café","sí","el árbol","Él","el pingüino","aquí"];
const sp=F(spanish);
ok("Spanish deck → its accents, ñ, ü, É and ¿ ¡ (¿ ¡ last)",["á","é","í","ñ","ó","ü","É","¿","¡"].every(c=>sp.indexOf(c)>=0)&&sp.slice(-2).every(c=>c==="¿"||c==="¡")&&sp.indexOf("É")>sp.indexOf("ü"),sp);
ok("French deck → its accents and ç",["à","â","ç","é","è","ê","ë","î","ô","ù"].every(c=>F(["à la","château","garçon","été","père","fête","Noël","île","hôtel","où"]).indexOf(c)>=0));
ok("ASCII punctuation, digits and math/typography signs are never offered",F(["3.5","-4","1/2","a.b, c; d: e!","(x)","7×8","56÷7","½","“yes”","‘no’","…","−3","café"]).join("")==="é");
ok("NFD input (decomposed é) still gives one é key",J(F(["café"]))===J(["é"]));
// > 12 distinct → the 12 most frequent, then sorted
const many=[]; const letters="àáâãäåæçèéêëìíîï"; // 16 distinct
for(let k=0;k<letters.length;k++) for(let r=0;r<=k;r++) many.push(letters[k]);   // later letters more frequent
const top=F(many);
ok("more than 12 distinct → 12 kept",top.length===12,top.length);
ok("…the 12 most frequent (the 4 rarest dropped)",!"àáâã".split("").some(c=>top.indexOf(c)>=0)&&"äåæçèéêëìíîï".split("").every(c=>top.indexOf(c)>=0),top);
ok("…and sorted, not in frequency order",J(top)===J(top.slice().sort((x,y)=>x.localeCompare(y))));
ok("a smaller cap is honoured",F(many,3).length===3);
// no leak of the current card
ok("typeKeysFrom takes the deck's list and a cap — nothing about a current card",/^function typeKeysFrom\(strs,cap\)/.test(blk.slice(blk.indexOf("function typeKeysFrom("))));
ok("the same deck in any order → the same keys (never answer order)",J(F(german))===J(F(german.slice().reverse()))&&J(F(german))===J(F(german.slice(5).concat(german.slice(0,5)))));
ok("one card's letters alone are not what is shown (ü-only card still gets the deck's full row)",J(F(german))!==J(F(["die Tür"])));
// typeKeysForDeck over the bank + sitting: the same row whichever card is current
ctx.masteryKid="k1";
ctx.masteryData={k1:[
  {id:"g1",subject:"Deck A",prompt:"die Tür",answer:"door"},{id:"g2",subject:"Deck A",prompt:"schön",answer:"pretty"},
  {id:"g3",subject:"Deck A",prompt:"heiß",answer:"hot"},{id:"g4",subject:"Deck A",prompt:"Äpfel",answer:"apples"},
  {id:"e1",subject:"Deck B",prompt:"dog",answer:"Hund"},{id:"m1",subject:"Math",prompt:"7÷2",answer:"3.5"}]};
ctx.mastGetDef=()=>""; ctx.mastCustomDef=()=>"";
vm.runInContext("function mstCardDef(c){ const it=(masteryData[masteryKid]||[]).find(i=>i.id===c.id); return it?it.answer:''; }",ctx);
const rows=[];
["g1","g2","g3","g4"].forEach(cur=>{ ctx.mstState={cur:cur,cards:{n1:{deck:"Deck A",name:"der Löwe"}}}; vm.runInContext("_typeKeysDeckMemo={k:null,st:null,keys:[]}",ctx); rows.push(J(ctx.typeKeysForDeck("Deck A","name"))); });
ok("Study: the same row on every card of the deck (bank + this sitting's new cards)",rows.every(r=>r===rows[0])&&rows[0]===J(["ö","ß","ü","Ä"]),rows[0]);
ok("Study: an English-answer side (Deck A's meanings) → no keys",ctx.typeKeysForDeck("Deck A","def").length===0);
ok("Study: a math deck → no keys",ctx.typeKeysForDeck("Math","def").length===0&&ctx.typeKeysForDeck("Math","name").length===0);
ok("Study: another deck's letters never leak in",ctx.typeKeysForDeck("Deck B","name").length===0);

// A. the number pad's extras
const P=x=>J(ctx.typeKeysPadExtra(x));
ok("decimal backs → '.'",P(["3.5","7","12","0.25"])===J(["."]));
ok("comma-decimal backs → ','",P(["3,5","4"])===J([","]));
ok("negative backs → '-'",P(["-4","2"])===J(["-"]));
ok("both → '.' and '-'",P(["-0.5","3"])===J([".","-"]));
ok("whole numbers only → the pad as it was",P(["7","56","100"])==="[]");
ok("word backs and fractions don't add keys",P(["Hund","1/2","3 1/2","a.b"])==="[]");
// typeKeysPadFor over each game's state shape (kinds · cells · turns · jar · pile)
ctx._whichBack=i=>String(i.answer||"");
ctx.masteryData={k2:[{id:"p1",answer:"3.5"},{id:"p2",answer:"7"},{id:"p3",answer:"-2"},{id:"p4",answer:"Hund"},{id:"x9",answer:"0.25"}]};
const gf={kid:"k2",kinds:{p2:"type",p4:"pick"}};
ok("Go Fish / Connect 4 shape (kinds): whole numbers → no extras",J(ctx.typeKeysPadFor(gf))==="[]");
const jp={kid:"k2",cells:[{pid:"p1"},{pid:"p2"}],turns:[]};
ok("Jeopardy shape (cells): a 3.5 square → '.'",J(ctx.typeKeysPadFor(jp))===J(["."]));
const kb={kid:"k2",jar:[{pid:"p2"},{boom:true}],turns:[{pid:"p3"}],pile:["p1"]};
ok("Kaboom shape (jar · turns · pile): → '.' and '-'",J(ctx.typeKeysPadFor(kb))===J([".","-"]));
ok("Sure? shape (turns): a card not in the game (x9) never counts",J(ctx.typeKeysPadFor({kid:"k2",turns:[{pid:"p2"}]}))==="[]");
const keysBefore=Object.keys(kb).join(); ctx.typeKeysPadFor(kb);
ok("the game's state is not touched (memo lives outside it — nothing new is parked)",Object.keys(kb).join()===keysBefore);
ok("no state → no extras",J(ctx.typeKeysPadFor(null))==="[]");
// the judge already compares numbers sensibly — unchanged
const jctx={console,Number,String,Object}; vm.createContext(jctx);
const fracLine=src.slice(src.indexOf("const MST_TYPEANS_FRAC="),src.indexOf("\n",src.indexOf("const MST_TYPEANS_FRAC=")));
vm.runInContext(fracLine+"\n"+fnText("mstNormMath")+"\n"+fnText("mstTypeAnsOk").split("\n// ")[0]+"\nthis.ok=mstTypeAnsOk;",jctx);
ok("judge: 3.5 = 3.5, 3.50 = 3.5, .5 = 0.5, -4 = -4 (number-aware, unchanged)",jctx.ok("3.5","3.5")&&jctx.ok("3.50","3.5")&&jctx.ok(".5","0.5")&&jctx.ok("-4","-4"));
ok("judge: 35 is not 3.5",!jctx.ok("35","3.5"));

// B. the key row
ok("no keys → no row",ctx.typeKeysRowHtml("mst-type-in",[])===""&&ctx.typeKeysRowHtml("mst-type-in",null)==="");
const row=ctx.typeKeysRowHtml("mst-type-in",["ä","ö"]);
const btns=row.match(/<button[^>]*>/g)||[];
ok("one button per key",btns.length===2);
ok("kid-sized: every key at least 44×44",btns.every(t=>/min-width:44px/.test(t)&&/min-height:44px/.test(t)));
ok("a key never takes focus (pointerdown default stopped, tabindex -1) and inserts on pointerdown; a keyboard click still works",btns.every(t=>/tabindex="-1"/.test(t)&&/onpointerdown="if\(event\.button\)return;event\.preventDefault\(\);typeKeysIns\('mst-type-in',this\.dataset\.ch\)"/.test(t)&&/onclick="if\(event\.detail===0\)typeKeysIns/.test(t)));
ok("the drill's look (the box's violet border)",/#c4b5fd/.test(btns[0]));
ok("a key's letter is escaped",/data-ch="&lt;"/.test(ctx.typeKeysRowHtml("x",["<"])));

// B. a tap inserts at the caret, keeps focus, fires input
function fakeBox(v,s,e){
  const el={value:v,selectionStart:s,selectionEnd:e,disabled:false,events:[],focused:0,
    setRangeText(t,a,b,mode){ this.value=this.value.slice(0,a)+t+this.value.slice(b); if(mode==="end"){ this.selectionStart=this.selectionEnd=a+t.length; } },
    dispatchEvent(ev){ this.events.push(ev.type+":"+ev.bubbles); return true; },
    focus(){ this.focused++; ctx.document.activeElement=this; }};
  return el;
}
ctx.Event=function(type,o){ this.type=type; this.bubbles=!!(o&&o.bubbles); };
let box=fakeBox("Mdchen",1,1);
ctx.document={activeElement:box,getElementById:id=>id==="mst-type-in"?box:null};
ctx.typeKeysIns("mst-type-in","ä");
ok("tap ä with the caret after M → Mädchen, caret after ä",box.value==="Mädchen"&&box.selectionStart===2,box.value);
ok("…the box hears the same (bubbling) input event a typed key sends",box.events.join()==="input:true");
ok("…and keeps focus",box.focused===1&&ctx.document.activeElement===box);
box=fakeBox("Tuer",1,3); ctx.document.activeElement=box;
ctx.typeKeysIns("mst-type-in","ü");
ok("a selection is replaced (Tuer, 'ue' selected → Tür)",box.value==="Tür"&&box.selectionStart===2,box.value);
box=fakeBox("gr",0,0); ctx.document.activeElement=null;
ctx.typeKeysIns("mst-type-in","ü");
ok("box not focused yet → the letter goes at the end, then it is focused",box.value==="grü"&&box.focused===1,box.value);
box=fakeBox("x",1,1); box.disabled=true; ctx.typeKeysIns("mst-type-in","ä");
ok("a disabled box is left alone",box.value==="x"&&box.events.length===0);

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
