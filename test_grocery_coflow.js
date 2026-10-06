/* 🧾 Checkout flow (her asks 2026-10-06): store mode sticks until checkout · receipt on the checkout screen · receipt vs what she entered ·
 * a choice for each extra · leftovers keep/remove/move.  run: node test_grocery_coflow.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// GROCERY_LIST_START"), b=src.indexOf("// GROCERY_LIST_END");
const fn=name=>{ const i=src.indexOf("function "+name+"("); return src.slice(i,src.indexOf("\n}",i)+2); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
function mk(){
  const writes=[], toasts=[], pantry=[], pop={innerHTML:""};
  const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isNaN,Date,RegExp,Set,Map,navigator:{},setTimeout:()=>0,
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["remove",p])})},
    HA_LS:{getItem:()=>null,setItem:()=>{}}, mwToast:m=>toasts.push(m), esc:s=>String(s==null?"":s), momHere:()=>true, dadAwardOk:()=>false, kitPinGate:()=>{},
    kitOrderList:()=>({need:[],usuals:{}}), _todayStr:()=>"2026-10-06", kitCapKey:()=>"k", panAdd:(n,z,q,m)=>{ pantry.push([n,z,q,m]); return "pa"+pantry.length; },
    kitStaples:{}, kitBuyLog:{}, kitPantry:{}, gwParseDate:s=>new Date(s+"T12:00:00"), tab:"moms-plan", renderAll:()=>{},
    document:{getElementById:id=>id==="gr-pop"?pop:null,createElement:()=>pop,body:{appendChild:()=>{}}}};
  vm.createContext(ctx); vm.runInContext(fn("kitSlug"),ctx); vm.runInContext(src.slice(a,b),ctx); ctx.grRepaint=()=>{};
  if(typeof ctx.grPutDraw==="function") ctx.grPutDraw=()=>{};
  vm.runInContext(`grData.stores={foodlion:{name:"Food Lion",color:"#d00"},aldi:{name:"Aldi",color:"#00f"}};
    grData.items={g1:{name:"Ground beef",sec:"meat",stores:["foodlion"],done:true,doneTs:1,paid:9.5,qty:1},g2:{name:"Paper towels",sec:"household",stores:["foodlion"],done:true,doneTs:1},
      g3:{name:"Rice",sec:"pantry",stores:["foodlion"]},g4:{name:"Eggs",sec:"dairy"}};`,ctx);
  return {ctx,writes,toasts,pantry,pop,run:e=>vm.runInContext(e,ctx),data:()=>vm.runInContext("grData",ctx)};
}
console.log("── 🏃 store mode stays on until checkout ──");
{ const T=mk(); T.run("grBig=true; grStore='foodlion'"); T.run("grBigToggle()");
  ok("leaving store mode with a cart asks first (still in store mode)", T.run("grBig")===true&&/still shopping/.test(T.pop.innerHTML)&&/Check out/.test(T.pop.innerHTML)&&/Keep shopping/.test(T.pop.innerHTML)&&/keep my cart for later/.test(T.pop.innerHTML));
  T.run("grBigLeave()"); ok("'Leave store mode — keep my cart' leaves, cart intact", T.run("grBig")===false&&T.data().items.g1.done===true);
  T.run("grData.items.g1.done=false; grData.items.g2.done=false; grBig=true; grBigToggle()"); ok("an empty cart leaves straight away", T.run("grBig")===false);
}
{ const T=mk(); T.run("grBig=true; grStore='foodlion'; grCheckoutOpen('foodlion'); grCheckoutGo()");
  ok("checking out ends store mode", T.run("grBig")===false);
}
console.log("── 📸 the receipt from the checkout screen ──");
{ const T=mk(); T.run("grStore='foodlion'; grCheckoutOpen('foodlion')");
  ok("the checkout screen offers the receipt", /📸 Add the receipt/.test(T.pop.innerHTML));
  T.run("grCoSet('other',true)"); T.run("grCoReceipt()");
  ok("it opens the receipt reader, held from the checkout", /📸 Read a receipt/.test(T.pop.innerHTML)&&T.run("_grRc.fromCo")===true&&T.run("_grRc.coSid")==="foodlion");
  T.run("grRcptCancel()");
  ok("Cancel goes back to the checkout screen with her choices kept", /🧾 Checkout at Food Lion/.test(T.pop.innerHTML)&&T.run("_grCo.other")===true);
}
console.log("── ✅ the receipt checked against what she entered ──");
const RCPT={store:"FOOD LION 1234",date:"2026-10-06",total:21.5,items:[{line:"GRND BEEF 80/20",name:"Ground beef",price:9.98,qty:2,regular:null,sale:false},
  {line:"LAYS CHIPS",name:"Potato chips",price:3.49,regular:null,sale:false},{line:"PARTY BALLOONS",name:"Balloons",price:4.99,regular:null,sale:false}]};
{ const T=mk(); T.run("grStore='foodlion'; grCheckoutOpen('foodlion'); grCoReceipt(); grRcptLoad("+JSON.stringify(RCPT)+"); grRcptDraw()");
  const h=T.pop.innerHTML, rows=T.run("_grRc.rows");
  ok("the receipt is the checkout's store", T.run("_grRc.sid")==="foodlion");
  ok("matched: ground beef → the list item; chips + balloons → extras", rows[0].match==="i:g1"&&rows[1].match==="x"&&rows[2].match==="x");
  ok("asks about the price she typed vs the receipt", /You typed <b>\$9\.50<\/b> · receipt says <b>\$9\.98<\/b>/.test(h));
  ok("asks about the amount (list ×1, receipt ×2)", /List said <b>×1<\/b> · receipt says <b>×2<\/b>/.test(h));
  ok("an extra asks where it goes (chips default: Pantry)", /Where does it go\?/.test(h)&&/🥫 Pantry/.test(h));
  ok("a checked-off item missing from the receipt is asked about", /Checked off, but not on this receipt \(1\)/.test(h)&&/Paper towels/.test(h));
  T.run("grRcptSet(0,'pu','mine'); grRcptSet(2,'xz','none'); grRcptNo('i:g2','back')");
  T.run("grRcptSave()");
  const d=T.data();
  ok("'Keep mine' saves her typed price, not the receipt's", T.run("grUsual('Ground beef','foodlion')")===9.5);
  ok("the price is saved once (no typed copy left for checkout to save again)", d.items.g1&&d.items.g1.paid===undefined, d.items.g1);
  ok("the amount follows the receipt by default (×2)", d.items.g1.qty===2);
  ok("'Didn't get it' puts paper towels back on the list", d.items.g2&&!d.items.g2.done);
  ok("the chips extra goes to the pantry", T.pantry.some(p=>p[0]==="Potato chips"));
  ok("'Not for the house' keeps the balloons out of the pantry and buy history", !T.pantry.some(p=>p[0]==="Balloons")&&!(T.ctx.kitBuyLog["2026-10-06"]||{}).balloons);
  ok("…its price is still saved", T.run("grUsual('Balloons','foodlion')")===4.99);
  ok("saving goes on to the checkout screen with the receipt total", /🧾 Checkout at Food Lion/.test(T.pop.innerHTML)&&/value="21\.50"/.test(T.pop.innerHTML)&&/From the receipt/.test(T.pop.innerHTML));
}
{ const T=mk(); T.run("grStore='foodlion'; _grRc={imgs:[]}; grRcptLoad("+JSON.stringify(RCPT)+"); grRcptSave()");
  ok("a receipt read from the list button also lands on the checkout screen", /🧾 Checkout/.test(T.pop.innerHTML)&&/From the receipt/.test(T.pop.innerHTML));
}
console.log("── 📝 leftovers: keep / remove / move ──");
{ const T=mk(); T.run("grStore='foodlion'; grCheckoutOpen('foodlion')");
  ok("the checkout lists what wasn't checked off (Rice, Eggs)", /Not checked off \(2\)/.test(T.pop.innerHTML)&&/Rice/.test(T.pop.innerHTML)&&/Eggs/.test(T.pop.innerHTML));
  ok("Keep is the default", /<option value="keep" selected>Keep on the list/.test(T.pop.innerHTML));
  ok("the move list offers her other stores (Aldi) but not this one", /Move to Aldi/.test(T.pop.innerHTML)&&!/Move to Food Lion/.test(T.pop.innerHTML));
  T.run("grCoLeftSet('i:g3','aldi'); grCoLeftSet('i:g4','remove'); grCheckoutGo()");
  const d=T.data();
  ok("the cart cleared (beef + towels off the list)", !d.items.g1&&!d.items.g2);
  ok("Rice moved to Aldi and remembers it", d.items.g3&&JSON.stringify(d.items.g3.stores)==='["aldi"]'&&JSON.stringify(d.home.rice)==='["aldi"]');
  ok("Eggs removed", !d.items.g4);
}
{ const T=mk(); T.run("grStore='foodlion'; grCheckoutOpen('foodlion'); grCoLeftAll('sort'); grCheckoutGo()");
  const d=T.data(); ok("'All of them → To sort' flags every leftover", d.items.g3.sort===true&&d.items.g4.sort===true&&!d.items.g3.stores);
}
{ const T=mk(); T.run("grStore='foodlion'; grCheckoutOpen('foodlion'); grCheckoutGo()");
  const d=T.data(); ok("untouched leftovers just stay on the list", d.items.g3&&JSON.stringify(d.items.g3.stores)==='["foodlion"]'&&d.items.g4&&!d.items.g4.sort);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
