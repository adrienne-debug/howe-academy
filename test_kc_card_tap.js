/*
 * 👆 KC_CARDTAP — on Kids' Corner a school card's title or body opens what its "📂 Open …" link opens (her yes 2026-11-07,
 * after the diagnosis "tapping the card itself does nothing"). The ✓ box stays the check-off; the body never checks off.
 *   run:  node test_kc_card_tap.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };

// ── kcBodyTap: a fake DOM — the card body, its title, the 📂 link, a button, a field ──
const node=(tag,parent,attrs)=>({tagName:tag,parentElement:parent||null,_a:attrs||{},hasAttribute(k){ return k in this._a; }});
const ctx={tab:"kids",String}; vm.createContext(ctx); vm.runInContext(fn("kcBodyTap"),ctx);
const body=node("DIV",null,{onclick:"x"}), header=node("DIV",body), title=node("DIV",header), detail=node("DIV",body);
const chip=node("SPAN",node("DIV",body),{onclick:"retrSchedGo()"}), btn=node("BUTTON",body), spinTxt=node("SPAN",btn), inp=node("INPUT",body), a=node("A",body);
const tap=(t)=>ctx.kcBodyTap({currentTarget:body,target:t});
console.log("A tap on the card");
ok("on the title → opens", tap(title)===true);
ok("on the body itself → opens", tap(body)===true);
ok("on the detail text → opens", tap(detail)===true);
ok("on the 📂 link → the link's own tap (no double open)", tap(chip)===false);
ok("on a button inside the card (🎰 Spin!, a menu) → that button's own", tap(btn)===false&&tap(spinTxt)===false);
ok("on a field or a link inside → its own", tap(inp)===false&&tap(a)===false);
ctx.tab="schedule";
ok("off Kids' Corner nothing opens from the body", tap(title)===false);
ctx.tab="kids";
ok("a broken event never throws", ctx.kcBodyTap(null)===false&&ctx.kcBodyTap({})===false);

console.log("The card");
const tc=fn("taskCard");
const ret=tc.slice(tc.lastIndexOf("return '<div class=\"task-card '"));
ok("the body tap is drawn only on Kids' Corner, only on a card with a 📂 link, and runs that link's own call (_go)",
  ret.indexOf(`'<div class="card-body"'+((_dlv&&typeof tab!=="undefined"&&tab==="kids")?' onclick="if(kcBodyTap(event))'+_go+'" style="cursor:pointer"':'')+'>'`)>0);
ok("…the same _go the 📂 link uses", /let linkRow=_dlv\?'<div style="margin-top:5px"><span onclick="event\.stopPropagation\(\);'\+_go\+'"/.test(tc));
const iCb=ret.indexOf('\'<div class="task-cb\''), iBody=ret.indexOf('\'<div class="card-body"');
ok("the ✓ box is its own element, before the body and closed before it — a tap on it never reaches the body", iCb>0&&iBody>iCb&&/'<div class="task-cb'[^\n]*\+'<\/div>'\+\n    '<div class="card-body"/.test(ret));
ok("the ✓ box still checks off (tapTask / dadTap), unchanged", /onclick="'\+\(\(typeof dadTapView!=="undefined"&&dadTapView\)\?'dadTap':'tapTask'\)\+'\(\\''\+t\.id\+'\\'\)"/.test(ret));
ok("the body never calls a check-off", !/card-body"[^\n]*(tapTask|dadTap|toggleCheck)/.test(ret));
ok("the greyed missed / dismissed cards get no body tap", (tc.match(/onclick="if\(kcBodyTap\(event\)\)/g)||[]).length===1);
ok("the Morning-list lock is untouched (pointer-events:none on the school list)", fn("kcSchoolHTML").indexOf("pointer-events:none")>0);
ok("no kid names in the block", !/lincoln|ellis|lucy|julian|taylor|kenzie|andrew/i.test(fn("kcBodyTap")));
ok("writes nothing", !/db\.|\.set\(|\.update\(|\.push\(|HA_LS/.test(fn("kcBodyTap")));

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
