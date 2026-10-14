/*
 * ✅ KC_LISTS — Kids' Corner "My Lists" (her ask 2026-10-13, DeWalt family): a third toggle button, 📆 Today | ✅ My Lists | 🗓 Month,
 * remembered per kid per device; My Lists shows ALL of today's checklists on one page, big, via the existing kcChoresHTML rows.
 * The view writes nothing of its own — every tick is the Schedule tab's own toggleMorningStep / toggleRtStep / toggleSlot.
 *   run:  node test_kc_lists.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const A=src.indexOf("// KC_LISTS_START"), B=src.indexOf("// KC_LISTS_END");
ok("the block is marked", A>0&&B>A);
const block=src.slice(A,B);
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };

console.log("No new writes");
ok("no db.ref( inside the block", block.indexOf("db.ref(")<0);
ok("no .set( / .update( / .remove( / .push( inside the block", !/\.(set|update|remove|push)\(/.test(block));
ok("the block only stores the mode in localStorage through HA_LS (ha_kc_mode)", /HA_LS\.setItem\("ha_kc_mode"/.test(block)&&!/localStorage/.test(block));
ok("the lists are the existing kcChoresHTML rows (not rebuilt)", /h\+=kcChoresHTML\(k\);/.test(block)&&!/rtSlotHTML\(|mrIndividualHTML\(/.test(block));
// (the 🧽 Cleaning Day panel is a Howe-only feature so far — a family copy without CLEANINGDAY has no hhCleanPanelHTML to draw)
ok("kcChoresHTML itself is untouched and still draws hhCleanPanelHTML (where the feature exists), mrIndividualHTML and rtSlotHTML", (()=>{ const c=fn("kcChoresHTML"); const hasClean=/function hhCleanPanelHTML\(/.test(src); return (!hasClean||/hhCleanPanelHTML\(k,_todayStr\(\),_todayDay\)/.test(c))&&/mrIndividualHTML\(k\)/.test(c)&&/rtSlotHTML\(slot,k\)/.test(c)&&/setTimeout\(renderAll,30\)/.test(c); })());

function mk(o){
  o=o||{}; const store=Object.assign({},o.store||{}), calls=[];
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,
    HA_LS:{getItem:k=>(k in store)?store[k]:null, setItem:(k,v)=>{ store[k]=String(v); }, removeItem:k=>{ delete store[k]; }},
    store, calls, window:{scrollTo:()=>{}},
    kcKid:o.kcKid||null, kcAddIso:"x", kcConfirmDel:"y",
    KID_COLOR:{lucy:"#aa0000",julian:"#00aa00",taylor:"#0000aa"}, SCHOOL_KIDS:["lincoln","ellis","lucy"],
    renderAll:()=>calls.push(["render"]),
    day:"monday", _todayDay:"thursday",
    bankBalance:()=>o.bal===undefined?42:o.bal,
    activeSlots:()=>o.slots||["morning","afternoon","evening"],
    morningComplete:(k,d)=>{ calls.push(["mc",k,d]); return !!o.mrDone; },
    rtSlotDone:(k,s,d)=>{ calls.push(["rt",k,s,d]); return !!o.rtDone; },
    kcChoresHTML:k=>{ calls.push(["chores",k,vm.runInContext("day",ctx)]); return '<div id="rows">ROWS</div>'; },
    kcTodayHTML:k=>{ calls.push(["today",k]); return "TODAY"; },
    calRenderMonthPreview:a=>{ calls.push(["month",a.who,a.little]); return "MONTH"; },
    _kcTint:()=>"#eee", esc:s=>String(s)};
  vm.createContext(ctx);
  vm.runInContext(fn("kcLittle")+"\n"+block,ctx);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}

console.log("The toggle");
{ const c=mk(); const h=c.kcCalToggleHTML("lucy");
  ok("three buttons: Today, My Lists, Month — each tap names the kid", /kcCalSet\('today','lucy'\)[^>]*>\u{1F4C6} Today</u.test(h)&&/kcCalSet\('lists','lucy'\)[^>]*>✅ My Lists</u.test(h)&&/kcCalSet\('month','lucy'\)[^>]*>\u{1F5D3} Month</u.test(h), h);
  ok("a big kid with nothing remembered starts on Today (Today filled with their colour)", /kcCalSet\('today','lucy'\)" style="[^"]*background:#aa0000;color:#fff/.test(h)&&/kcCalSet\('lists','lucy'\)" style="[^"]*background:#fff;color:#aa0000/.test(h));
  ok("no 🔀 anywhere", src.indexOf("🔀")<0);
}
console.log("Remembered per kid per device");
{ const c=mk({kcKid:"lucy"});
  c.kcCalSet("lists","lucy");
  ok("kcCalSet('lists', kid) stores {lucy:'lists'} in the ha_kc_mode JSON map", JSON.parse(c.store.ha_kc_mode).lucy==="lists", c.store);
  ok("…and that kid now reads lists; another kid on the same device still reads today", c.kcCalGet("lucy")==="lists"&&c.kcCalGet("ellis")==="today");
  ok("…and the tap re-rendered and cleared the add/delete state", c.calls.some(x=>x[0]==="render")&&c.get("kcAddIso")===null&&c.get("kcConfirmDel")===null);
  c.kcCalSet("month","ellis"); ok("a second kid's choice lives beside the first", (()=>{ const m=JSON.parse(c.store.ha_kc_mode); return m.lucy==="lists"&&m.ellis==="month"; })(), c.store);
  c.kcCalSet("bogus","lucy"); ok("an unknown mode lands on today", c.kcCalGet("lucy")==="today");
  ok("the toggle highlights the remembered mode", /kcCalSet\('month','ellis'\)" style="[^"]*background:#0000aa|background:#2B7A78;color:#fff/.test(c.kcCalToggleHTML("ellis")));
  const d=mk({kcKid:"lucy"}); d.kcCalSet("lists"); ok("kcCalSet without a kid (old kcGo call) uses the picked kid", JSON.parse(d.store.ha_kc_mode).lucy==="lists"&&d.kcCalGet()==="lists");
  const e=mk({store:{ha_kc_mode:JSON.stringify({lucy:"lists"})}}); ok("a fresh page reads the map back from the device", e.kcCalGet("lucy")==="lists");
  const f=mk({store:{ha_kc_mode:"not json"}}); ok("a broken map is ignored, not fatal", f.kcCalGet("lucy")==="today");
  const g=mk({store:{ha_kc_calmode:"month"}}); ok("a device already on Month (old ha_kc_calmode key) stays on Month until a kid taps", g.kcCalGet("lucy")==="month");
}
console.log("Little kids");
{ const c=mk(); ok("a little kid (not school-age) lands on My Lists the first time", c.kcCalGet("julian")==="lists");
  ok("…while a school-age kid does not", c.kcCalGet("lucy")==="today");
  c.kcCalSet("today","julian"); ok("a little kid can keep the page as it is — their own tap wins", c.kcCalGet("julian")==="today"&&JSON.parse(c.store.ha_kc_mode).julian==="today");
  const d=mk({store:{ha_kc_calmode:"month"}}); ok("a little kid's first time beats the old per-device Month key", d.kcCalGet("julian")==="lists");
}
console.log("The My Lists page");
{ const c=mk(); const h=c.kcListsHTML("lucy");
  const ch=c.calls.find(x=>x[0]==="chores");
  ok("the view calls kcChoresHTML(k) once, for that kid", ch&&ch[1]==="lucy"&&c.calls.filter(x=>x[0]==="chores").length===1, c.calls);
  ok("…with day=_todayDay set before the rows draw (what kcOpenList does)", ch&&ch[2]==="thursday"&&c.get("day")==="thursday");
  ok("the rows sit inside <div class=\"kc-big\">", /<div class="kc-big">[\s\S]*<div id="rows">ROWS<\/div>/.test(h));
  ok("the strip shows the ⭐ balance and N of M lists done from morningComplete / rtSlotDone", /⭐ 42</.test(h)&&/0 of 3 lists done/.test(h)&&c.calls.some(x=>x[0]==="mc"&&x[1]==="lucy"&&x[2]==="thursday")&&c.calls.some(x=>x[0]==="rt"&&x[1]==="lucy"&&x[2]==="afternoon"&&x[3]==="thursday"), h);
  ok("not all done → no All done banner", !/All done!/.test(h));
  ok("a big 📖 My school cards › button flips the mode back to today", /kcCalSet\('today','lucy'\)"[^>]*>\u{1F4D6} My school cards ›</u.test(h));
  const d=mk({mrDone:true,rtDone:true}); const h2=d.kcListsHTML("lucy");
  ok("every active list done → 3 of 3 and All done! 🎉", /3 of 3 lists done/.test(h2)&&/All done! \u{1F389}/u.test(h2), h2);
  const e=mk({mrDone:true,rtDone:false,slots:["morning","evening"]}); ok("the count follows activeSlots (a chores pause shrinks M)", /1 of 2 lists done/.test(e.kcListsHTML("lucy")));
  const f=mk({slots:[]}); ok("no active lists at all → not 'All done'", !/All done!/.test(f.kcListsHTML("lucy")));
}
console.log("One body for Kids' Corner and the General tablet");
{ const c=mk(); c.kcCalSet("lists","lucy"); c.calls.length=0;
  ok("mode lists → the My Lists page", /kc-big/.test(c.kcModeBodyHTML("lucy"))&&c.calls.some(x=>x[0]==="chores"));
  c.kcCalSet("today","lucy"); c.calls.length=0; ok("mode today → kcTodayHTML", c.kcModeBodyHTML("lucy")==="TODAY"&&c.calls.some(x=>x[0]==="today"));
  c.kcCalSet("month","lucy"); c.calls.length=0; ok("mode month → the month preview, little flag passed", /MONTH/.test(c.kcModeBodyHTML("lucy"))&&c.calls.some(x=>x[0]==="month"&&x[1]==="lucy"&&x[2]===false));
  ok("renderKidsCorner draws the toggle then kcModeBodyHTML", /h\+=kcCalToggleHTML\(k\);\s*\n\s*h\+=kcModeBodyHTML\(k\);/.test(src));
  ok("the General tablet's My Day branch draws the same toggle and body", /kcCalToggleHTML\(kid\)\s*\n\s*\+kcModeBodyHTML\(kid\)\+'<\/div>';/.test(src));
  ok("no caller is left on the old no-kid kcCalGet()", !/kcCalGet\(\)/.test(src.replace(block,"")));
  ok("the Kids' Corner header has a line for the lists mode", /\(kcCalGet\(k\)==="lists"\)\?'Your lists for today/.test(src));
}
console.log("CSS — big only under .kc-big");
{ const css=src.slice(0,src.indexOf("</style>"));
  ok("the item checkbox (inline 20px) is overridden to 36–40px under .kc-big", /\.kc-big \.sl-checkbox\{width:3[6-9]px!important;height:3[6-9]px!important/.test(css)||/\.kc-big \.sl-checkbox\{width:40px!important;height:40px!important/.test(css));
  ok(".kc-big .mr-step is padded ~16px with min-height 60px", /\.kc-big \.mr-step\{[^}]*padding:16px[^}]*min-height:60px/.test(css));
  ok(".kc-big .sl-slot-name is 18–20px", /\.kc-big \.sl-slot-name\{font-size:(18|19|20)px/.test(css));
  ok(".kc-big .mr-steps has no left indent; .mr-pts 14px; .cadtag smaller or hidden", /\.kc-big \.mr-steps\{margin-left:0/.test(css)&&/\.kc-big \.mr-pts\{font-size:14px/.test(css)&&/\.kc-big \.cadtag\{(display:none|font-size:[0-9.]+px)/.test(css));
  const big=css.split("\n").filter(l=>/kc-big/.test(l));
  ok("every kc-big rule is scoped under .kc-big (nothing leaks to the Schedule tab or the pop-up)", big.length>0&&big.every(l=>/^\.kc-big /.test(l)||/^\/\* KC_LISTS/.test(l)), big);
  ok("the base rows are exactly as before", /^\.mr-step\{display:flex;align-items:center;gap:10px;padding:8px 12px;/m.test(css)&&/^\.sl-checkbox\{width:24px;height:24px;/m.test(css)&&/^\.sl-slot-name\{font-size:14px;font-weight:600\}/m.test(css)&&/^\.mr-steps\{margin:-2px 0 8px 34px;/m.test(css)&&/^\.mr-pts\{font-size:11px;/m.test(css)&&/^\.cadtag\{font-size:10px;/m.test(css));
  ok("the rules sit next to the .kc-little rules", css.indexOf(".kc-big ")>css.indexOf(".kc-little .cal-sheet")&&css.indexOf(".kc-big ")<css.indexOf(".kc-quick{"));
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
