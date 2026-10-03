/*
 * 🍎 The Mom / All agenda lunch row follows Settings ▸ School Day Times (her ask 2026-10-03).
 * It was hard-coded "1:00 PM · Lunch · 1–2pm" — wrong for DeWalt (lunch 12–1).
 *   run: node test_agenda_lunch.js
 */
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
function fn(name){ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0,st=false; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{"){d++;st=true;} else if(src[k]==="}"){d--; if(st&&d===0) return src.slice(i,k+1);} } }
let pass=0,fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} };
const toMin=t=>{ const m=String(t||"").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if(!m) return NaN; let h=+m[1]; const ap=(m[3]||"").toUpperCase(); if(ap==="PM"&&h!==12)h+=12; if(ap==="AM"&&h===12)h=0; return h*60+(+m[2]); };
const fromMin=v=>{ let h=Math.floor(v/60),m=v%60; const ap=h>=12?"PM":"AM"; let hh=h%12; if(hh===0)hh=12; return hh+":"+String(m).padStart(2,"0")+" "+ap; };
const mk=sd=>new Function("toMin","fromMin","rulesData",fn("_agLunchFmt")+fn("_agLunchRow")+"return _agLunchRow;")(toMin,fromMin,{schoolDay:sd});
const txt=r=>r&&r.html.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
let R=mk({lunchStart:"12:00 PM",lunchEnd:"1:00 PM"})("monday","mom");
ok("DeWalt 12–1: row at 12:00 PM reading 'Lunch · 12–1pm'", R.s===720 && /12:00 PM .*Lunch · 12–1pm/.test(txt(R)), txt(R));
R=mk({lunchStart:"1:00 PM",lunchEnd:"2:00 PM"})("monday","all");
ok("Howe 1–2: unchanged text 'Lunch · 1–2pm' at 1:00 PM", R.s===780 && /1:00 PM .*Lunch · 1–2pm/.test(txt(R)) && /all-agenda-row/.test(R.html) && /grid-column:2\/-1/.test(R.html), txt(R));
R=mk({lunchStart:"11:30 AM",lunchEnd:"12:15 PM"})("monday","mom");
ok("11:30–12:15 → '11:30am–12:15pm'", /Lunch · 11:30am–12:15pm/.test(txt(R)), txt(R));
R=mk({lunchStart:"12:00 PM",lunchEnd:"1:00 PM",overrides:{wednesday:{lunchStart:"12:30 PM",lunchEnd:"1:30 PM"}}});
ok("per-day override wins on that day only", R("wednesday","mom").s===750 && /12:30–1:30pm/.test(txt(R("wednesday","mom"))) && R("tuesday","mom").s===720);
ok("no settings → the old 1–2 default", mk({})("monday","mom").s===780);
ok("a broken window (end before start) → no row", mk({lunchStart:"1:00 PM",lunchEnd:"12:00 PM"})("monday","mom")===null);
ok("both agendas use it — no hard-coded 1:00 lunch left in either", ["momAgendaHtml","allAgendaHtml"].every(n=>{ const f=fn(n); return /_agLunchRow\(day,"(all|mom)"\)/.test(f)&&f.indexOf("13*60")<0&&f.indexOf("1–2pm")<0; }));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
