/* 🔴 HBREAL — the Mom's Day alerts badge opens its list whenever the Mom switch is really on, even from the kids' Schedule where Mom
 * mode is set aside (her words 2026-11-03: "if the Mom lock is turned on, it should just open up and show, but it still asks for a PIN").
 * run: node test_hb_badge_switch.js */
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const tap=fn("hbListTap");
ok("hbListTap reads the device's real switch state (momHereReal), momHere only as a fallback", /const _on=\(typeof momHereReal==="function"\)\?momHereReal\(\):\(\(typeof momHere==="function"\)&&momHere\(\)\);\n  if\(_on\)\{ hbListOpen\(\); return; \}/.test(tap)&&/HBREAL \(her words 2026-11-03/.test(tap));
function world(o){
  const log=[]; const env={ hbNotMomDevice:()=>false, document:{getElementById:()=>null}, momHereReal:()=>!!o.real, momHere:()=>!!o.here, hbListOpen:()=>log.push("open"), hbListClose:()=>log.push("close"), kitPinGate:(then,why)=>log.push("pin:"+why) };
  const keys=Object.keys(env); new Function(...keys,tap+"\nhbListTap({stopPropagation(){}});")(...keys.map(k=>env[k])); return log;
}
ok("switch on, tapped from the kids' Schedule (Mom mode set aside: momHere false, momHereReal true) → the list opens, no code", world({real:true,here:false}).join()==="open");
ok("switch on anywhere else → opens", world({real:true,here:true}).join()==="open");
ok("switch off → the code once (then the list)", /^pin:The alerts list is for Mom/.test(world({real:false,here:false}).join()));
ok("the old momHere-only door is gone from hbListTap", !/if\(typeof momHere==="function"&&momHere\(\)\)\{ hbListOpen\(\); return; \}/.test(tap));
ok("no Firebase writes", !/db\.|\.ref\(/.test(tap));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
