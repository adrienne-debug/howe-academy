/* 🥶 Deep freezer (her ask 2026-11-01: "the big freezer … i def need the difference to know which is which").
 * A 6th kitchen spot beside ❄️ Freezer. Same frozen rules (no package-date clock, put-away restamps the date),
 * a ~1-year shelf life, and unknown spots still fall back to 🥫 Pantry.  run: node test_deep_freezer.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const line=start=>{ const i=src.indexOf(start); if(i<0) throw new Error("missing "+start); return src.slice(i,src.indexOf("\n",i)); };
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const writes=[];
const ctx={console,Math,JSON,Object,Array,String,Number,Date,RegExp,parseInt,isNaN,
  db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["remove",p])})},
  HA_LS:{getItem:()=>null,setItem:()=>{}}, _todayStr:()=>"2026-11-01", grPutDraw:()=>{}, grIsProduceName:()=>false,
  gwParseDate:s=>new Date(s+"T12:00:00"), kitIsoPlus:(iso,n)=>{ const d=new Date(iso+"T12:00:00"); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); },
  kitPantry:{}};
vm.createContext(ctx);
const placesBlock=src.slice(src.indexOf("const GR_PLACES="),src.indexOf("function grPlaceOf("));
vm.runInContext(placesBlock,ctx);
["grPlaceOf","grPanSet","grPutSet","grUseSoonIds","panZoneMeta","panStatus"].forEach(n=>vm.runInContext(fn(n),ctx));
vm.runInContext(line("const PAN_ZONES="),ctx);
vm.runInContext(line("const PAN_ZONE_EMOJI="),ctx);
const R=e=>vm.runInContext(e,ctx);

console.log("── the spot exists everywhere a place is picked ──");
ok("GR_PLACES has 🥶 Deep freezer right after ❄️ Freezer", JSON.stringify(R("GR_PLACES.map(p=>p[0])"))===JSON.stringify(["pantry","fridge","freezer","deepfreezer","counter","household"]), R("GR_PLACES.map(p=>p[0])"));
ok("the label tells the two apart", R("GR_PLACES.find(p=>p[0]==='deepfreezer')[1]")==="🥶 Deep freezer" && R("GR_PLACES.find(p=>p[0]==='freezer')[1]")==="❄️ Freezer");
ok("PAN_ZONES knows it (~1 year)", R("panZoneMeta('deepfreezer')[2]")===365);
ok("an unknown spot still falls back to Pantry", R("panZoneMeta('garage')[0]")==="pantry");
ok("an item saved in the deep freezer stays there on screen", R("grPlaceOf({name:'brisket',zone:'deepfreezer'})")==="deepfreezer");
ok("the little freezer is unchanged", R("grPlaceOf({name:'peas',zone:'freezer'})")==="freezer");
ok("tap-to-cycle includes it", /const z=\["pantry","fridge","freezer","deepfreezer","counter","household"\]/.test(fn("grPanZoneCycle")));
ok("emoji for the toast", R("PAN_ZONE_EMOJI.deepfreezer")==="🥶");

console.log("── frozen rules apply to both freezers ──");
ok("grIsFrozenZone: both freezers yes, fridge no", R("grIsFrozenZone('freezer')&&grIsFrozenZone('deepfreezer')&&!grIsFrozenZone('fridge')"));
ok("a past package date doesn't flag deep-freezer meat as gone", R("panStatus({name:'pork chops',zone:'deepfreezer',useBy:'2025-06-05',addedIso:'2026-10-01'},'2026-11-01')")==="fresh");
ok("…but the same date in the fridge does", R("panStatus({name:'pork chops',zone:'fridge',useBy:'2025-06-05',addedIso:'2026-10-01'},'2026-11-01')")==="gone");
ok("deep freezer keeps ~a year: 200 days old is still fine", R("panStatus({name:'brisket',zone:'deepfreezer',addedIso:'2026-04-15'},'2026-11-01')")!=="gone");
ok("little freezer still ~3 months: 200 days old is old", R("panStatus({name:'peas',zone:'freezer',addedIso:'2026-04-15'},'2026-11-01')")==="gone");
R("kitPantry={a:{name:'roast',zone:'deepfreezer',useBy:'2026-11-02'},b:{name:'milk',zone:'fridge',useBy:'2026-11-02'}}");
ok("use-soon reminders skip the deep freezer", JSON.stringify(R("grUseSoonIds()"))==='["b"]', R("grUseSoonIds()"));
R("kitPantry={c:{name:'steak',zone:'fridge',addedIso:'2026-10-20'}}"); writes.length=0; R("grPutSet('c','deepfreezer')");
ok("putting away into the deep freezer restamps the date", R("kitPantry.c.zone")==="deepfreezer" && R("kitPantry.c.addedIso")==="2026-11-01");
ok("…and writes only that item", writes.length===1&&writes[0][1]==="kitchen/pantry/c", writes);

console.log("── screens ──");
ok("put-away date label says 'Use by' for the deep freezer", /grIsFrozenZone\(pl\)\?'Use by'/.test(fn("grPutDraw")));
ok("'It's in the freezer' button hidden for either freezer", /!grIsFrozenZone\(it\.zone\)\?'<button onclick="grPanMove\(/.test(fn("grPanCheckDraw")));
ok("import help lists deepfreezer", src.indexOf("zones: pantry, fridge, freezer, deepfreezer, counter, household")>0);

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
