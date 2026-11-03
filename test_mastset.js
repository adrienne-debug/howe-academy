/* 🧠 MASTSET — the Mastery tab's Mom tools move to Mom's Day ▸ School ▸ Mastery ▸ Settings (her yes 2026-11-02): HQ gets 🔁 Retrieval Plan
 * (the Admin view's one real panel) and 🃏 Cards (＋ Add a card, Problem words, Editor in Chief); the Mastery page loses the Admin tab and
 * those buttons; Log asks for the code only with the Mom switch off; Edit List honours the switch.   run: node test_mastset.js */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); return src.slice(i,src.indexOf("\n}",i)+2); };
const a=src.indexOf("// MASTSET_START"), b=src.indexOf("// MASTSET_END"); const block=src.slice(a,b);
ok("MASTSET block is marked once, right before renderMastery", a>0&&b>a&&src.split("// MASTSET_START").length===2&&/\/\/ MASTSET_END\nfunction renderMastery\(el\)\{/.test(src));
ok("every inline <script> still compiles", (()=>{ const re=/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m,n=0; while((m=re.exec(src))){ n++; try{ new vm.Script(m[1]); }catch(e){ console.log("    script #"+n+": "+e.message); return false; } } return n>0; })());
ok("no family or kid name in the block", !/lincoln|ellis|lucy|julian|howe|dewalt|burris/i.test(block));

console.log("── the Mastery page ──");
{ const ri=fn("_renderMasteryInner");
  ok("header: no Problem words, ＋ or Editor in Chief buttons any more", !/pwOpen\(masteryKid\)|onclick="mastOpenAdd\(\)"|eicPanelOpen\(\\'\'\+masteryKid/.test(ri)&&/MASTSET \(her yes 2026-11-02\): Problem words, ＋ add a card and Editor in Chief left this header/.test(ri));
  ok("tabs: Drills · 📚 Study · Sprint · 🎮 Games · Scores · Heat Map — no Admin", /mastSetView\(\\'drill\\'\)">Drills<[\s\S]*mastSetView\(\\'study\\'\)[\s\S]*mastSetView\(\\'sprint\\'\)[\s\S]*gamesOpen\(\)[\s\S]*mastSetView\(\\'scores\\'\)[\s\S]*mastSetView\(\\'heatmap\\'\)">Heat Map</.test(ri)&&!/mastSetView\(\\'admin\\'\)/.test(ri));
  ok("the Admin view page is gone (no PIN box, no signpost, no Retrieval Plan here); a remembered 'admin' view lands on Drills", !/mast-admin-pin|renderMastAdmin\(\)|retrAdminHtml\(\)/.test(ri)&&/if\(mastView==="admin"\) mastView="drill";/.test(ri));
  ok("the add form is still drawn here when open (shared helper)", /if\(mastAddMode\) h\+=mastAddFormHtml\(\);/.test(ri)&&!/mast-add-preview/.test(ri));
  ok("the retired functions stay for the record (other tests and doors read them)", /^function renderMastAdmin\(\)\{/m.test(src)&&/^function mastAdminCheckPin\(val\)\{/m.test(src)); }

console.log("── the shared add form ──");
{ const f=fn("mastAddFormHtml");
  ok("mastAddFormHtml: the kid's emoji, the whole form, returns html", /^function mastAddFormHtml\(\)\{\n  const emoji=MAST_KID_EMOJI\[masteryKid\];\n  let h='';\n/.test(f)&&/mast-add-hdr/.test(f)&&/mast-add-preview/.test(f)&&/\n  return h;\n\}$/.test(f)); }

console.log("── Mastery HQ: the two new pills ──");
{ const pills=fn("_mhqExtraPills"), view=fn("_mhqExtraView"), hq=fn("renderMasteryHQ");
  ok("🔁 Retrieval Plan and 🃏 Cards sit at the END of the pill row (after Import)", /_mhqImportPill\(\) : ""\) \+\n\s*_mhqPill\("\\u\{1F501\} Retrieval Plan", mhqView === "retr", "mhqSetView\('retr'\)"\) \+[^\n]*\n\s*_mhqPill\("\\u\{1F0CF\} Cards", mhqView === "cards", "mhqSetView\('cards'\)"\);/.test(pills));
  ok("…and route to their pages", /if \(mhqView === "retr"\) return _mhqRenderRetr\(kid\);/.test(view)&&/if \(mhqView === "cards"\) return _mhqRenderCards\(kid\);/.test(view)&&/mhqView==="rules"\|\|mhqView==="retr"\|\|mhqView==="cards"\) h\+=/.test(hq));
  ok("🔁 Retrieval Plan = the Admin view's panel (retrAdminHtml), per kid, with a line of plain words", /function _mhqRenderRetr\(kid\)\{[\s\S]*retrieval plan[\s\S]*try\{ h\+=retrAdminHtml\(\); \}catch\(e\)\{/.test(src));
  const cw=(o)=>{ const env={masteryData:{kidA_settings:{eic:!!o.eic}}, mastAddMode:!!o.add, mhqEsc:s=>String(s), mhqArgEsc:s=>String(s), cap:s=>s.charAt(0).toUpperCase()+s.slice(1), mastAddFormHtml:()=>"<FORM>"}; const keys=Object.keys(env); return new Function(...keys,fn("_mhqRenderCards")+"\nreturn _mhqRenderCards;")(...keys.map(k=>env[k]))("kidA"); };
  ok("🃏 Cards: ＋ Add a card · 📝 Problem words (this kid) · ✏️ Editor in Chief only when the kid has it on", /b\("mastOpenAdd\(\)"/.test(fn("_mhqRenderCards"))&&/onclick="mastOpenAdd\(\)"[^>]*>\uFF0B Add a card<\/button><button onclick="pwOpen\('kidA'\)"[^>]*>\u{1F4DD} Problem words<\/button><button onclick="eicPanelOpen\('kidA'\)"[^>]*>\u270F\uFE0F Editor in Chief<\/button>/u.test(cw({eic:true}))&&!/eicPanelOpen/.test(cw({eic:false})));
  ok("…＋ opens the form right there", /<FORM>$/.test(cw({add:true}))&&!/<FORM>/.test(cw({}))); }

console.log("── Log and Edit List ──");
{ ok("mastStartLog: Kids' Corner gate, then the drill gate, then Mom's code gate, in that order", /^function mastStartLog\(\)\{ if\(typeof kcLogGate==="function"&&!kcLogGate\(\)\) return; if\(typeof mpDrillGate==="function"&&!mpDrillGate\(masteryKid\)\) return; if\(typeof mastLogMomGate==="function"&&!mastLogMomGate\(\)\) return; _mastResumed="";/m.test(src));
  const gate=(o)=>{ const log=[]; const env={tab:o.tab||"mastery", momHere:()=>!!o.mom, kitPinGate:(then,why)=>{ log.push(why); }, mastStartLog:()=>log.push("start")}; const keys=Object.keys(env); const r=new Function(...keys,fn("mastLogMomGate")+"\nreturn mastLogMomGate();")(...keys.map(k=>env[k])); return {r,log}; };
  ok("Mastery tab, switch off → the code door opens and Log waits", (()=>{ const g=gate({}); return g.r===false&&/enter the code once/.test(g.log[0]); })());
  ok("Mastery tab, switch on → Log just starts", gate({mom:true}).r===true&&gate({mom:true}).log.length===0);
  ok("any other page (Kids' Corner has its own door) → untouched", gate({tab:"kids"}).r===true&&gate({tab:"moms-plan"}).r===true);
  ok("the door's own yes turns the switch on, then Log runs (kitPinGate → pinOk → haMomOn → then())", /function kitPinGate\(then,why,opts\)\{\n  if\(typeof momHere==="function"&&momHere\(\)\)\{ then\(\); return; \}/.test(src));
  ok("Edit List: switch on → a plain ✏️ Edit List button (no PIN); off → the 🔒 PIN link as before", /if\(momHere\(\)\)\{ h\+='<button onclick="mastListEditMode=true;_mastRe\(\)"[^>]*>\\u270F\\uFE0F Edit List<\/button><\/div>'; \}/.test(src)&&/else \{\n    h\+='<button onclick="document\.getElementById\(\\'mast-list-pin-wrap\\'\)/.test(src)); }
ok("the HQ map's Mastery row opens School ▸ Mastery ▸ Settings", /case "mastery": mpSchoolOpen\('mhq'\); return;/.test(fn("momHQGo")));
ok("no Firebase writes in the block", !/db\.|\.ref\(/.test(block));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
