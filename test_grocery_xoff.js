// 🛒 GR_XOFF (2026-11-01): a one-tap ✕ on every list row takes a double off the list — ticked or not — through the same
// grRemove the ✎ → Remove path uses, so it lands in ↩ Recently cleared as "removed" and is never put away at 🏁 Trip done.
const fs=require("fs"); const src=fs.readFileSync(process.argv[2]||(__dirname+"/index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n);} };
const fn=name=>{ const a=src.indexOf("function "+name+"("); if(a<0) throw new Error("missing "+name); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };

ok("GR_XOFF marker present once", src.split("// GR_XOFF").length===2);

// ── the row ──
const mkRow=(big,qs)=>{
  const body=fn("grRowHTML")+";return grRowHTML;";
  const F=new Function("grQs","grQsSel","grBig","esc","grStoreColor","grStoreName","grTagsHTML","grQsChipsHTML","grPriceLineHTML","grPaidMathHTML","grStepperHTML","grPaidBoxHTML",body);
  return F(qs,{},big,s=>String(s||""),()=>"#000",s=>s,()=>"",()=>"",()=>"",()=>"",()=>"<step>",()=>"<paid>");
};
const row=mkRow(false,false);
const h1=row({id:"a1",name:"Shredded cheddar",sec:"dairy"},true);
ok("item row carries the ✕", h1.includes("✕</button>"));
ok("✕ calls grRemove with the item id", h1.includes("grRemove('a1')"));
ok("✕ has a label", h1.includes('aria-label="Take off the list"'));
ok("✕ sits after ✎", h1.indexOf("✎</button>")>0&&h1.indexOf("✎</button>")<h1.indexOf("✕</button>"));
ok("✕ does not fire the row's move-store tap", h1.includes('event.stopPropagation();grRemove('));
const h2=row({id:"a2",name:"Shredded cheddar",sec:"dairy",done:true,doneTs:1},true);
ok("a ticked (in-cart) row still has the ✕", h2.includes("grRemove('a2')"));
const hv=row({key:"st_s1",name:"Almond milk",virt:"staple",sid:"s1"},true);
ok("a ⭐ staple row has no ✕ (not this change)", !hv.includes("✕</button>"));
const hb=mkRow(true,false)({id:"a3",name:"Eggs",sec:"dairy"},true);
ok("🏃 store mode: no ✕ (shopping thumb can't delete)", !hb.includes("✕</button>"));
ok("🏃 store mode: the circle is still there", hb.includes('aria-label="Put in the cart"'));
const hq=mkRow(false,true)({id:"a4",name:"Eggs",sec:"dairy",sort:true},true);
ok("☐ Sort-several mode: no ✕", !hq.includes("✕</button>"));
ok("normal row still has the circle and ✎", h1.includes('aria-label="Put in the cart"')&&h1.includes("✎</button>"));

// ── the tap: grRemove (unchanged, but this is what the ✕ relies on) ──
const env={writes:[],toasts:[],popClosed:0,repaints:0,saved:0,mom:true};
const grData={items:{a1:{name:"Shredded cheddar",sec:"dairy"},a2:{name:"shredded cheddar",sec:"dairy",done:true,doneTs:5}},cleared:{}};
const body2=fn("grRemove")+fn("grClearedPush")+";return {grRemove,grData};";
const F2=new Function("grData","grGate","grSave","db","grPopClose","mwToast","grRepaint",body2);
const L=F2(grData,then=>{ if(env.mom) then(); else env.gated=true; },()=>env.saved++,{ref:p=>({set:v=>env.writes.push(["set",p,v]),remove:()=>env.writes.push(["remove",p])})},()=>env.popClosed++,m=>env.toasts.push(m),()=>env.repaints++);
L.grRemove("a2");
ok("ticked double is gone from the list", !grData.items.a2);
ok("the other one stays", !!grData.items.a1);
ok("it lands in ↩ Recently cleared as removed", grData.cleared.a2&&grData.cleared.a2.how==="removed");
ok("the cleared copy drops the cart tick (never counts as bought)", grData.cleared.a2.done===undefined&&grData.cleared.a2.doneTs===undefined);
ok("item removed in the database", env.writes.some(w=>w[0]==="remove"&&w[1]==="kitchen/grocery/items/a2"));
ok("cleared row written", env.writes.some(w=>w[0]==="set"&&w[1]==="kitchen/grocery/cleared/a2"));
ok("toast says what went", env.toasts.some(t=>/Removed shredded cheddar/.test(t)));
ok("saved + repainted", env.saved===1&&env.repaints===1);
env.mom=false; L.grRemove("a1");
ok("not Mom/Dad → the gate asks, nothing removed", env.gated===true&&!!grData.items.a1);

// ── 🏁 Trip done never sees a removed item: grDoneRun walks grData.items only ──
const done=fn("grDoneRun");
ok("Trip done reads grData.items (removed rows are not there)", done.includes("Object.keys(grData.items).forEach"));
ok("Trip done does not read the cleared pile", !done.includes("grData.cleared"));

console.log("\n"+pass+" passed, "+fail+" failed"); if(fail) process.exit(1);
