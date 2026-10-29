// test_env_sendout_toggle.js — ENVSENDTOGGLE (her ask 2026-10-28): on 📤 Send out, tapping the open station closes it again;
// tapping a different station switches to it (the picked decks reset either way). Slices envcSendPick out of index.html.
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n); } };
const m=src.match(/function envcSendPick\(id\)\{[^\n]*\}/); ok("envcSendPick is in index.html exactly once", !!m && src.split("function envcSendPick(").length===2);
let renders=0; const _envc={send:{station:"",decks:{},to:"class",picked:{}}}; const envcRe=()=>{ renders++; };
const envcSendPick=new Function("_envc","envcRe","return ("+m[0].replace(/^function envcSendPick/,"function")+")")(_envc,envcRe);
envcSendPick("general"); ok("tap General → it opens", _envc.send.station==="general"&&renders===1);
_envc.send.decks={"General Concepts · Terms":true};
envcSendPick("forestry"); ok("tap Forestry while General is open → switches to Forestry, decks reset", _envc.send.station==="forestry"&&Object.keys(_envc.send.decks).length===0&&renders===2);
_envc.send.decks={"Forestry · Terms":true};
envcSendPick("forestry"); ok("tap Forestry again → it closes (no station picked), decks reset", _envc.send.station===""&&Object.keys(_envc.send.decks).length===0&&renders===3);
envcSendPick("forestry"); ok("tap it once more → it opens again", _envc.send.station==="forestry"&&renders===4);
ok("the rest of the send-out row is unchanged (to / picked kept)", _envc.send.to==="class"&&typeof _envc.send.picked==="object");
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
