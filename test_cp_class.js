/*
 * Node tests — 🏫 CPCLASS, the class record and its look (DESIGN_class_platform_2026-10-28.md §3, §9, §13 row 2, §15; her words
 * 2026-10-28: "the teacher can change that and it reflects on the students and the parents' page, and then they don't have that option
 * at all … customize it by the name and maybe the emoji and then the color that she wants it to be … per class" · "give her lots of
 * options because this will also be used for other classes").
 *   · where the block sits, how it is hooked (every hook typeof-guarded), Howe / DeWalt inert;
 *   · cpTextOn: all 42 swatches reach 4.5 : 1 with the words they get, and over the whole color range one of white / black always does;
 *   · the bars: kid, parent, teacher, admin read the class's emoji, title and color, with black words on a light color;
 *   · 🏫 Class setup in the demo: "Eco Club", 🦉, a light yellow ▸ Save ▸ the Kid and Parent bars read it with dark words; nothing
 *     changes before Save; Cancel; the brand lock;
 *   · every save is one targeted update at classes/<cid> with that card's fields only; the teacher can't set the name or the lock date;
 *   · the lock date per class (envsLockState, the closed card, the label), the season on the © line, + Class, the labels / features
 *     helpers, the per-child rules.
 * Uses the world from test_env_site.js (the real ENVSITE + ENVCONSOLE + ENVCLASSSET + CPCLASS blocks).     run: node test_cp_class.js
 */
const fs=require("fs"), path=require("path");
const {world,src,CPC,REPO}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,400):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const CID="ms-science-2026";
function demo(role){ const w=world({fam:FAM,search:"?demo=1&role="+(role||"teacher")}); w.envSiteDemoBoot(); w.renderAll(); return w; }
function last(w){ return w._envs.writes[w._envs.writes.length-1]; }
function bar(h){ const i=h.indexOf('<div class="envs-top'); return i<0?"":h.slice(i,h.indexOf('<div class="envs-chips"',i)); }
function liveConsole(role){ const w=world({fam:FAM}); w._envs.role=role||"teacher"; w._envs.uid="t1"; w._envc.sdb=w.firebase.database(); w._envc.cid="c1"; w._envs.cid="c1";
  w._envc.cls={name:"C1",title:"Envirothon",teacher:"t1",students:{fam_k:true}}; w._envc.students={fam_k:{meta:{name:"Kay L.",familyId:"fam",kid:"k"},class:"c1"}}; return w; }
const run=async()=>{
console.log("── where it sits, how it is hooked ──");
{ const a=src.indexOf("// CPCLASS_START"), b=src.indexOf("// CPCLASS_END"), c=src.indexOf("// ENVCLASSSET_END");
  ok("CPCLASS right after ENVCLASSSET_END, once", a>0&&b>a&&src.indexOf("// CPCLASS_START",a+1)<0&&src.slice(c,a).trim()==="// ENVCLASSSET_END");
  ok("the block only declares (nothing runs at boot)", CPC.split("\n").every(l=>!l.trim()||/^(\/\/|function |const |let | |})/.test(l)));
  ok("her words and the date are in the block header", /2026-10-28/.test(CPC)&&/the teacher can change that and it reflects on the students/.test(CPC)&&/lots of options/.test(CPC));
  ok("no Howe kid name as a code literal; no 🔀", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(CPC)&&src.indexOf("\u{1F500}")<0);
  const out=src.slice(0,a)+src.slice(b), hooks=out.split("\n").filter(l=>/🏫 CPCLASS/.test(l));
  ok("14 tagged lines outside the block, every one typeof-guarded", hooks.length===14&&hooks.every(l=>/typeof cp\w+==="function"/.test(l)), hooks.map(l=>l.trim().slice(0,60)));
  const inFn=(f,re)=>{ const i=src.indexOf(f); return i>=0&&re.test(src.slice(i,src.indexOf("\n}\n",i))); };
  ok("the bars: envsKidHtml, envsParentHtml, envConsoleHtml each draw through cpTopHtml (the old bar stays as the fallback)", ["function envsKidHtml(","function envsParentHtml(","function envConsoleHtml("].every(f=>inFn(f,/typeof cpTopHtml==="function"\)\?cpTopHtml\(/)&&inFn(f,/<div class="envs-top" style="background:/)));
  ok("the lock date: envsLockState, envsAutoLockLabel; the class arriving: envsReadShared, envcPickClass", inFn("function envsLockState(",/cpLockKey\(lockAt\)/)&&/function envsAutoLockLabel\(\)\{ return \(typeof cpLockLabel/.test(src)&&inFn("function envsReadShared(",/cpClassIn\(\)/)&&inFn("function envcPickClass(",/cpClassIn\(\)/));
  ok("the season: the © line and the closed card", /function envsLicenseLine\(\)\{[^\n]*cpSeason\(\)/.test(src)&&inFn("function envsCard(",/cpSeason\(\)\)\|\|ENVS_SEASON\)\+' '\+envsEsc\(\(typeof cpBrand/));
  ok("the console: the 🏫 chip before ⚙️ Class settings, its screen, + Class, the demo seed", inFn("function envConsoleHtml(",/chips\.splice\(chips\.findIndex\(x=>x\[0\]==="classset"\),0,\["setup"/)&&inFn("function envConsoleHtml(",/v==="setup"&&typeof cpSetupHtml==="function"/)&&inFn("function envcAdminHtml(",/cpAdminClassHtml\(\)/)&&/function envcClassAdd\(\)\{ if\(!envcAdmin\(\)\) return; if\(typeof cpClassAdd==="function"\)/.test(src)&&/function envcDemoStart\(data\)\{[^\n]*cpDemoStart\(data\)/.test(src));
  ok("the Color card and envsSetColor are not this PR's (CPGEAR removes them): both untouched", /function envsSetColor\(\)/.test(src)&&/function envsSettingsHtml\(\)\{\n  const kid=_envs\.kid, col=envsKidColor\(kid\);/.test(src)&&!/cp\w+\(/.test(src.slice(src.indexOf("function envsSettingsHtml("),src.indexOf("function envsSetPin(")))); }

console.log("\n── Howe, DeWalt: inert ──");
{ for(const fid of ["howe","dewalt","burris"]){ const w=world({fam:{familyId:fid,roster:[]}}), cp=w.cp;
    ok(fid+": every CPCLASS entry says no (no bar, no screen, no form, no lock key, no class)", cp.cpTopHtml("kid","Maya")===""&&cp.cpSetupHtml()===""&&cp.cpAdminClassHtml()===""&&cp.cpClassIn()===false&&cp.cpLockKey()===""&&cp.cpCls()===null&&cp.cpSave("look")===false&&cp.cpClassAdd()===false);
    ok(fid+": nothing created, no CSS, no listener, no read, no write", w.G.created.length===0&&w.G.listeners.length===0&&w.G.reads.length===0&&w.G.writes.length===0&&w.G.content===""); }
  const w=world({fam:{familyId:"howe",roster:[]}});
  ok("Howe: envsLockState reads the site's own date exactly as before (no class)", w.envsLockState(null,"20270424").locked===false&&w.envsLockState(null,"20270425").why==="auto"&&w.envsAutoLockLabel()==="Apr 24, 2027"); }

console.log("\n── cpTextOn: readable on any color ──");
{ const w=world({fam:FAM}), cp=w.cp;
  ok("the palette: 21 hues, each a dark and a light shade = 42 swatches, all different", cp.CP_HUES.length===21&&new Set(cp.CP_HUES.flatMap(x=>[x[1],x[2]])).size===42&&cp.CP_HUES.every(x=>cp.cpHex(x[1])===x[1]&&cp.cpHex(x[2])===x[2]));
  ok("the hues the design names, in its order", cp.CP_HUES.map(x=>x[0].toLowerCase()).join(" ")==="red orange amber yellow lime green forest emerald teal cyan sky blue indigo violet purple fuchsia pink rose brown slate stone");
  const bad=[]; cp.CP_HUES.forEach(x=>{ if(cp.cpTextOn(x[1])!=="#ffffff"||cp.cpContrast(x[1],"#ffffff")<4.5) bad.push(x[0]+" dark"); if(cp.cpTextOn(x[2])!=="#000000"||cp.cpContrast(x[2],"#000000")<4.5) bad.push(x[0]+" light"); });
  ok("every dark shade takes white words and every light shade black words, each at least 4.5 : 1", !bad.length, bad);
  let min=99, minA=99, at="", atA=""; for(let r=0;r<=255;r+=15) for(let g=0;g<=255;g+=15) for(let b=0;b<=255;b+=15){ const h="#"+[r,g,b].map(v=>v.toString(16).padStart(2,"0")).join(""), c=cp.cpContrast(h,cp.cpTextOn(h)), a=cp.cpContrast(h,cp.cpAccentOn(h)); if(c<min){ min=c; at=h; } if(a<minA){ minA=a; atA=h; } }
  for(let v=0;v<=255;v++){ const h="#"+[v,v,v].map(x=>x.toString(16).padStart(2,"0")).join(""), c=cp.cpContrast(h,cp.cpTextOn(h)); if(c<min){ min=c; at=h; } }
  ok("over the whole color range (5,832 colors + every grey) the picked words reach at least 4.58 : 1", min>=4.58, {min,at});
  ok("…and the wordmark's \"Academy\" at least 4.5 : 1", minA>=4.5, {minA,atA});
  ok("the words are pure black, never the app's near-black", cp.cpTextOn("#fef08a")==="#000000"&&cp.cpTextOn("#14532d")==="#ffffff");
  ok("today's green keeps today's indigo \"Academy\"; a mid green a paler one; a light color the dark indigo", cp.cpAccentOn("#14532d")==="#a5b4fc"&&cp.cpAccentOn("#2d6a4f")==="#e0e7ff"&&cp.cpAccentOn("#fef08a")==="#312e81");
  ok("cpHex: #RRGGBB in any case → lowercase; anything else → \"\"", cp.cpHex("#FEF08A")==="#fef08a"&&cp.cpHex("fef08a")==="#fef08a"&&cp.cpHex("#fff")===""&&cp.cpHex("red")===""&&cp.cpHex(null)===""); }

console.log("\n── the fields ──");
{ const cp=world({fam:FAM}).cp;
  ok("42 emojis, all different, every one passes cpEmojiOk", cp.CP_EMOJI.length===42&&new Set(cp.CP_EMOJI).size===42&&cp.CP_EMOJI.every(e=>cp.cpEmojiOk(e)), cp.CP_EMOJI.filter(e=>!cp.cpEmojiOk(e)));
  ok("one emoji: 🦉 🏛️ 🇺🇸 👩‍🏫 yes; two emojis, letters, digits, markup, nothing: no", ["\u{1F989}","\u{1F3DB}️","\u{1F1FA}\u{1F1F8}","\u{1F469}‍\u{1F3EB}"].every(e=>cp.cpEmojiOk(e))&&!["\u{1F989}\u{1F989}","ab","A\u{1F989}","7","<b>","",null," "].some(e=>cp.cpEmojiOk(e)));
  ok("a title is 1–40 characters, no markup", cp.cpTitleOk("Eco Club")&&cp.cpTitleOk("x".repeat(40))&&!cp.cpTitleOk("x".repeat(41))&&!cp.cpTitleOk("  ")&&!cp.cpTitleOk("<script>"));
  ok("dates: real ISO days only; the label reads like the site's (Apr 24, 2027)", cp.cpDateOk("2027-04-24")&&!cp.cpDateOk("2027-02-30")&&!cp.cpDateOk("20270424")&&cp.cpDateLabel("2027-04-24")==="Apr 24, 2027"&&cp.cpDateLabel("2026-11-05")==="Nov 5, 2026");
  ok("the brand: a class's own look; a class without one → today's (Envirothon, 🌿, #14532d)", JSON.stringify(cp.cpBrand({title:"Eco Club",emoji:"\u{1F989}",color:"#FEF08A"}))===JSON.stringify({title:"Eco Club",emoji:"\u{1F989}",color:"#fef08a",ink:"#000000",accent:"#312e81"})&&cp.cpBrand({}).title==="Envirothon"&&cp.cpBrand({}).emoji==="\u{1F33F}"&&cp.cpBrand({}).color==="#14532d");
  ok("…a bad title / emoji / color in the record falls back field by field", (b=>b.title==="Envirothon"&&b.emoji==="\u{1F33F}"&&b.color==="#14532d")(cp.cpBrand({title:"<x>",emoji:"ab",color:"blue"})));
  ok("before the class has arrived: the host config's className on the default green", (b=>b.title==="MS Science 2026-27"&&b.color==="#14532d")(cp.cpBrand(null,FAM))&&cp.cpBrand(null,{}).title==="Envirothon");
  ok("§15 the words: the unit's (Station, Check-in, Final…) unless the class renames one", cp.cpLabel("section",{})==="Station"&&cp.cpLabel("post",{})==="Final"&&cp.cpLabel("section",{labels:{section:"Chapter"}})==="Chapter"&&cp.cpLabel("pre",{labels:{pre:"  "}})==="Check-in");
  ok("§15 the features: the class's switch, else the unit's (teams on, mock run off)", cp.cpFeature("teams",{})===true&&cp.cpFeature("mockRun",{})===false&&cp.cpFeature("teams",{features:{teams:false}})===false&&cp.cpFeature("mockRun",{features:{mockRun:true}})===true&&cp.cpFeature("nope",{})===false);
  ok("the season: the class's, then the old year field, then the site's", cp.cpSeason({season:"2027-28"})==="2027-28"&&cp.cpSeason({year:"2026-27"})==="2026-27"&&cp.cpSeason({})==="2026-27"); }

console.log("\n── the bars, in the demo (the sample class's look) ──");
{ const w=demo("teacher");
  ok("the sample class carries a look and a season (title, emoji, color, season, start, goals, goal, lockAt, calendar, features)", (c=>c.title==="Envirothon"&&c.emoji==="\u{1F33F}"&&c.color==="#2d6a4f"&&c.season==="2026-27"&&c.start==="2026-09-15"&&c.goals.length===2&&c.goal.name==="Area"&&c.goal.pct===95&&c.lockAt==="2027-04-24"&&c.calendar.days==="school"&&c.features.teams===true)(w._envc.cls));
  let b=bar(w.G.content);
  ok("teacher bar: Howe Academy, then \"🌿 Envirothon · MS Science 2026-27\" on the class's green, white words, \"8 students\"", /background:#2d6a4f;color:#ffffff/.test(b)&&/Howe <span style="color:#e0e7ff">Academy<\/span>/.test(b)&&/\u{1F33F} Envirothon · MS Science 2026-27<\/div>/u.test(b)&&/>8 students</.test(b)&&/envcView\('settings'\)/.test(b), b);
  w.envsDemoGo("admin"); b=bar(w.G.content); ok("admin bar adds \" · Adrienne\"", /\u{1F33F} Envirothon · MS Science 2026-27 · Adrienne<\/div>/u.test(b), b);
  w.envsDemoGo("kid"); b=bar(w.G.content); ok("kid bar: \"🌿 Maya · Envirothon\", the stars, ⚙️ to the kid's own settings", /background:#2d6a4f;color:#ffffff/.test(b)&&/\u{1F33F} Maya · Envirothon<\/div>/u.test(b)&&/⭐ 27/.test(b)&&/envsView\('settings'\)/.test(b), b);
  w.envsDemoGo("parent"); b=bar(w.G.content); ok("parent bar: \"🌿 Maya’s Envirothon\"", /\u{1F33F} Maya’s Envirothon<\/div>/u.test(b)&&/background:#2d6a4f/.test(b), b);
  ok("the bar's CSS is injected once (black words turn the buttons dark)", w.G.created.filter(e=>e.id==="cp-css").length===1&&/\.envs-top\.cp-ink-dark button\{background:rgba\(0,0,0,\.1\);color:#000\}/.test(w.G.created.find(e=>e.id==="cp-css").textContent)); }

console.log("\n── 🏫 Class setup: Eco Club, 🦉, a light yellow ──");
{ const w=demo("teacher"), cp=w.cp;
  ok("the console has a '🏫 Class setup' chip, right before ⚙️ Class settings (teacher and admin)", /envcView\('setup'\)">\u{1F3EB} Class setup<\/button><button class="" onclick="envcView\('classset'\)/u.test(w.G.content)&&/envcView\('setup'\)/.test(demo("admin").G.content));
  w.envcView("setup"); let h=w.G.content;
  ok("the screen: the look, the season, study days, words and features, when it closes", ["The class’s look","The season","Study days","Words and features","The class closes"].every(t=>h.indexOf(t)>=0));
  ok("the look: a live preview of the student's and the parent's bar, the title box, 42 emojis + any one, 42 swatches + any color, Save", /id="cp-prev"/.test(h)&&(h.match(/class="envs-top( cp-ink-dark)? cp-prev"/g)||[]).length===2&&/id="cp-title"[^>]*value="Envirothon"/.test(h)&&(h.match(/onclick="cpSet\('emoji','/g)||[]).length===42&&/placeholder="or type any one emoji"/.test(h)&&(h.match(/onclick="cpSet\('color','#/g)||[]).length===42&&/id="cp-color" type="color"/.test(h)&&/onclick="cpSave\('look'\)"/.test(h));
  ok("…every swatch shows its own words color (\"Aa\"); the class's swatch is ticked", /style="background:#fef08a;color:#000000"[^>]*>Aa</.test(h)&&/style="background:#991b1b;color:#ffffff"[^>]*>Aa</.test(h)&&/class="on" title="Forest dark"/.test(h));
  ok("the teacher sees the closing date but can't change it or the name", /id="cp-lockat"[^>]*value="2027-04-24" disabled/.test(h)&&/id="cp-name"[^>]*disabled/.test(h)&&!/cpSave\('close'\)/.test(h)&&/closes after <b>Apr 24, 2027<\/b>/.test(h));
  // the taps: type the title, pick 🦉, pick the light yellow
  cp.cpSet("title","Eco Club","prev"); cp.cpSet("emoji","\u{1F989}",true); cp.cpSet("color","#fef08a",true); h=w.G.content;
  ok("the preview follows before Save: \"🦉 Maya · Eco Club\" and \"🦉 Maya’s Eco Club\" on the yellow, black words, contrast shown", /<div class="envs-top cp-ink-dark cp-prev" style="background:#fef08a;color:#000000">/.test(h)&&/\u{1F989} Maya · Eco Club<\/div>/u.test(h)&&/\u{1F989} Maya’s Eco Club<\/div>/u.test(h)&&/Words: <b>black<\/b> · contrast 1[0-9]\.\d : 1/.test(h), h.slice(h.indexOf('id="cp-prev"'),h.indexOf('id="cp-prev"')+900));
  ok("…and the 🦉 and the yellow swatch are ticked", /class="on" onclick="cpSet\('emoji','\u{1F989}',true\)"/u.test(h)&&/class="on" title="Yellow light"/.test(h));
  const n0=w._envs.writes.length; w.envsDemoGo("kid");
  ok("nothing is saved until Save: no write, the kid's bar still reads Envirothon", w._envs.writes.length===n0&&/\u{1F33F} Maya · Envirothon<\/div>/u.test(bar(w.G.content)));
  w.envsDemoGo("teacher"); ok("a look at the Kid view and back keeps what is being set", /id="cp-title"[^>]*value="Eco Club"/.test(w.G.content));
  w.envcView("grid"); w.envcView("setup");
  ok("leaving the screen drops the draft (the screen starts from the class again)", /id="cp-title"[^>]*value="Envirothon"/.test(w.G.content));
  cp.cpSet("title","Eco Club"); cp.cpSet("emoji","\u{1F989}",true); cp.cpSet("color","#fef08a",true);
  ok("Save → ONE update at classes/<cid> with exactly {title, emoji, color} (demo: a \"would update\" toast)", cp.cpSave("look")===true);
  await w.flush();
  ok("…the write record", JSON.stringify(last(w))===JSON.stringify({op:"update",path:"classes/"+CID,val:{title:"Eco Club",emoji:"\u{1F989}",color:"#fef08a"}})&&w._envs.writes.length===n0+1, last(w));
  let b=bar(w.G.content);
  ok("teacher bar: \"🦉 Eco Club · MS Science 2026-27\" on the yellow, black words, the small \"Academy\" dark indigo, \"8 students\" black", /class="envs-top cp-ink-dark" style="background:#fef08a;color:#000000"/.test(b)&&/Howe <span style="color:#312e81">Academy<\/span>/.test(b)&&/\u{1F989} Eco Club · MS Science 2026-27<\/div>/u.test(b)&&/<div style="font-size:11.5px;font-weight:700">8 students<\/div>/.test(b), b);
  w.envsDemoGo("kid"); b=bar(w.G.content);
  ok("Kid bar: \"🦉 Maya · Eco Club\" on the yellow with black words", /class="envs-top cp-ink-dark" style="background:#fef08a;color:#000000"/.test(b)&&/\u{1F989} Maya · Eco Club<\/div>/u.test(b)&&/#312e81/.test(b), b);
  w.envsDemoGo("parent"); b=bar(w.G.content);
  ok("Parent bar: \"🦉 Maya’s Eco Club\" on the yellow with black words", /class="envs-top cp-ink-dark" style="background:#fef08a;color:#000000"/.test(b)&&/\u{1F989} Maya’s Eco Club<\/div>/u.test(b), b);
  w.envsDemoGo("teacher"); w.envcView("setup"); cp.cpSet("color","#9d174d",true); cp.cpSave("look"); await w.flush(); w.envsDemoGo("kid"); b=bar(w.G.content);
  ok("a dark color (berry / pink dark) → white words again", /class="envs-top" style="background:#9d174d;color:#ffffff"/.test(b)&&/\u{1F989} Maya · Eco Club/u.test(b), b);
  w.envsDemoGo("teacher"); w.envcView("setup"); cp.cpSet("title","Changed","prev"); cp.cpCancel("look");
  ok("Cancel puts the card back to the class's", /id="cp-title"[^>]*value="Eco Club"/.test(w.G.content));
  cp.cpEmojiType("ab"); ok("typing letters as the emoji is refused (a toast, the draft keeps 🦉)", cp.cpDraft().emoji==="\u{1F989}");
  cp.cpEmojiType("\u{1F52C}"); ok("typing one emoji takes it", cp.cpDraft().emoji==="\u{1F52C}");
  const n1=w._envs.writes.length; cp.cpSet("title",""); ok("an empty title is refused, nothing written", cp.cpSave("look")===false&&w._envs.writes.length===n1); }

console.log("\n── the brand lock (classes/<cid>/locks/brand, Adrienne's) ──");
{ const w=demo("teacher"), cp=w.cp; w._envc.cls.locks={brand:true}; w.envcView("setup"); const h=w.G.content;
  const look=h.slice(h.indexOf("The class’s look"),h.indexOf("The season"));
  ok("teacher: the look greyed — the title, every emoji, every swatch, the picker and Save disabled; \"🔒 Set by Adrienne\"", /\u{1F512} Set by Adrienne/u.test(look)&&/id="cp-title"[^>]*disabled/.test(look)&&(look.match(/ disabled onclick="cpSet\('emoji'/g)||[]).length===42&&(look.match(/ disabled onclick="cpSet\('color'/g)||[]).length===42&&/id="cp-color"[^>]* disabled/.test(look)&&/cpSave\('look'\)" disabled/.test(look));
  ok("…the other cards stay open", !/cpSave\('season'\)" disabled/.test(h));
  const n=w._envs.writes.length; cp.cpSet("title","Nope"); ok("…and her save is refused", cp.cpSave("look")===false&&w._envs.writes.length===n);
  w.envsDemoGo("admin"); w.envcView("setup"); ok("Adrienne still changes it (\"Locked for the teacher\")", /Locked for the teacher/.test(w.G.content)&&!/cpSave\('look'\)" disabled/.test(w.G.content)&&cp.cpSave("look")===true); }

console.log("\n── every save writes exactly its fields (live teacher) ──");
{ const w=liveConsole("teacher"), cp=w.cp, W=()=>w.G.writes;
  cp.cpSet("title","Eco Club"); cp.cpSet("emoji","\u{1F989}"); cp.cpSet("color","#FEF08A"); cp.cpSave("look"); await w.flush();
  ok("look → update classes/c1 {title, emoji, color}, nothing else", W().length===1&&JSON.stringify(W()[0])===JSON.stringify(["update","classes/c1",{title:"Eco Club",emoji:"\u{1F989}",color:"#fef08a"}]), W());
  ok("…the console's class takes it at once (its bar repaints)", w._envc.cls.title==="Eco Club"&&w._envc.cls.color==="#fef08a");
  const d=cp.cpDraft(); d.season="2026-27"; d.start="2026-09-15"; d.goals=[{name:"Area",date:"2027-03-22",note:""},{name:"",date:"",note:""},{name:"State",date:"2027-04-23",note:"top 7"}]; d.goalName="State"; d.goalPct="90";
  cp.cpSave("season"); await w.flush();
  ok("season → update {season, start, goals (empty rows dropped), goal {name, pct}}", JSON.stringify(W()[1])===JSON.stringify(["update","classes/c1",{season:"2026-27",start:"2026-09-15",goals:[{name:"Area",date:"2027-03-22"},{name:"State",date:"2027-04-23",note:"top 7"}],goal:{name:"State",pct:90}}]), W()[1]);
  ok("…after Save the card shows what was saved (the empty row is gone)", cp.cpDraft().goals.length===2);
  cp.cpSet("days","weekdays"); cp.cpDraft().off={"2026-11-26":true,"bad":true}; cp.cpSave("days"); await w.flush();
  ok("study days → update {calendar:{days, off}} (a bad date dropped)", JSON.stringify(W()[2])===JSON.stringify(["update","classes/c1",{calendar:{days:"weekdays",off:{"2026-11-26":true}}}]), W()[2]);
  cp.cpWord("section","Chapter"); cp.cpWord("post","Station"); cp.cpWord("pre","Check-in"); cp.cpFeat("teams",false); cp.cpSave("words"); await w.flush();
  ok("words → update {labels (only the renamed ones), features (all five)}", JSON.stringify(W()[3])===JSON.stringify(["update","classes/c1",{labels:{section:"Chapter",post:"Station"},features:{teams:false,boards:true,specialists:true,idFlash:true,mockRun:false}}]), W()[3]);
  const n=W().length; cp.cpSet("lockAt","2027-01-01"); cp.cpSet("name","X");
  ok("the teacher can't save the name or the closing date", cp.cpCan("close")===false&&cp.cpSave("close")===false&&W().length===n);
  const bads=[["season",{season:""}],["season",{goals:[{name:"Area",date:""}]}],["season",{goals:[{name:"A",date:"2027-01-01"},{name:"a",date:"2027-02-01"}]}],["season",{goals:[{name:"A",date:"2027-01-01"}],goalPct:"0"}],["days",{days:"sometimes"}],["words",{labels:{section:"x".repeat(31)}}]];
  ok("refused, nothing written: no season · a goal with no date · two goals with one name · a 0% target · an unknown study-days choice · a 31-letter word", bads.every(([p,o])=>!cp.cpCheck(p,Object.assign(cp.cpDraftOf({}),o)).ok)&&W().length===n);
  const a=liveConsole("admin"); a.cp.cpSet("name","MS Science 2026-27"); a.cp.cpSet("lockAt","2027-04-30"); a.cp.cpSave("close"); await a.flush();
  ok("Adrienne: close → update {name, lockAt}", JSON.stringify(a.G.writes[0])===JSON.stringify(["update","classes/c1",{name:"MS Science 2026-27",lockAt:"2027-04-30"}]), a.G.writes);
  const dr=liveConsole("teacher"); dr.G.dry=true; dr.cp.cpSave("look"); await dr.flush(); ok("dry run → nothing written", dr.G.writes.length===0); }

console.log("\n── the lock date per class ──");
{ const w=world({fam:FAM}), L=w.envsLockState;
  ok("a class's lockAt replaces the site's date: past it → closed (auto); on it → open", L(null,"20270301","2027-02-28").why==="auto"&&L(null,"20270228","2027-02-28").locked===false);
  ok("…a later lockAt keeps the class open past the site's date", L(null,"20270501","2027-05-31").locked===false&&L(null,"20270601","2027-05-31").locked===true);
  ok("…an admin's reopen counts after the class's own date", L({locked:false,at:Date.UTC(2027,2,5)},"20270310","2027-02-28").why==="reopened"&&L({locked:false,at:Date.UTC(2027,1,5)},"20270310","2027-02-28").locked===true);
  ok("…no lockAt / a bad one → the site's date (2027-04-24)", L(null,"20270425",null).why==="auto"&&L(null,"20270424","not a date").locked===false);
  w._envs.role="kid"; w._envs.cls={lockAt:"2027-02-28",season:"2026-27"};
  ok("with no third argument it reads the current class's lockAt; the label follows", w.cp.cpLockKey()==="20270228"&&w.envsAutoLockLabel()==="Feb 28, 2027");
  w.G.now=Date.UTC(2027,2,2,15); const r=w.cp.cpClassIn();
  ok("the class record arriving past its date → the kid lands on \"season closed\", which names the class's date", r===true&&w.G.created.some(e=>/Season closed/.test(e.innerHTML||"")&&/closes by itself after Feb 28, 2027/.test(e.innerHTML||"")), w.G.created.map(e=>(e.innerHTML||"").slice(0,80)));
  const a=world({fam:FAM}); a._envs.role="admin"; a._envs.cls={lockAt:"2027-02-28"}; a.G.now=Date.UTC(2027,2,2,15); ok("…Adrienne still gets in", a.cp.cpClassIn()===false&&!a.G.created.some(e=>/Season closed/.test(e.innerHTML||"")));
  const k=world({fam:FAM}); k._envs.role="kid"; k._envs.kid="maya"; k._envs.sid="envirothon_maya"; k._envs.cid="c1"; k.G.remote["classes/c1"]={name:"C1",title:"Eco Club",emoji:"\u{1F989}",color:"#fef08a",lockAt:"2027-04-24"};
  k.envsReadShared(); ok("live kid: envsReadShared's class listener brings the look (and the date) in", k._envs.cls&&k._envs.cls.title==="Eco Club"&&!k.G.created.some(e=>/Season closed/.test(e.innerHTML||"")));
  ok("…the kid's bar reads it", /\u{1F989} Maya · Eco Club<\/div>/u.test(k.envsKidHtml())&&/background:#fef08a;color:#000000/.test(k.envsKidHtml()));
  const f=world({fam:FAM}); f._envs.role="kid"; f._envs.kid="maya"; ok("…before the class has arrived: the host config's className on the default green", /background:#14532d;color:#ffffff/.test(f.envsKidHtml())&&/\u{1F33F} Maya · MS Science 2026-27<\/div>/u.test(f.envsKidHtml()));
  const s=world({fam:FAM}); s._envs.role="kid"; s._envs.cls={name:"C1",season:"2027-28"};
  ok("the © line names the class's season", /licensed to C1 for the 2027-28 season/.test(s.envsLicenseLine())); }

console.log("\n── Adrienne's + Class ──");
{ const cp=world({fam:FAM}).cp;
  const c=cp.cpNewClass({id:"Eco Club 2027!",name:"Eco Club",teacher:"uid_t",title:"Eco Club",season:"2027-28",start:"2027-01-11",goalName:"Spring fair",goalDate:"2027-05-01",lockAt:"2027-05-02"});
  ok("the form → classes/<id> = {name, title, emoji, color, season, start, goals, goal, lockAt, students, teacher} (the id cleaned)", c.ok&&c.cid==="ecoclub2027"&&JSON.stringify(c.rec)===JSON.stringify({name:"Eco Club",title:"Eco Club",emoji:"\u{1F33F}",color:"#14532d",season:"2027-28",year:"2027-28",area:8,division:"ms",students:{},start:"2027-01-11",goals:[{name:"Spring fair",date:"2027-05-01"}],goal:{name:"Spring fair",pct:95},lockAt:"2027-05-02",teacher:"uid_t"}), c);
  ok("blank title / season → today's (Envirothon, 2026-27); no id or name / a bad date / a goal with no date → refused", (x=>x.ok&&x.rec.title==="Envirothon"&&x.rec.season==="2026-27"&&!x.rec.lockAt)(cp.cpNewClass({id:"a",name:"A"}))&&!cp.cpNewClass({name:"A"}).ok&&!cp.cpNewClass({id:"a",name:"A",lockAt:"soon"}).ok&&!cp.cpNewClass({id:"a",name:"A",goalName:"Area"}).ok);
  const w=demo("admin"); w.envcView("admin"); const h=w.G.content;
  ok("Admin ▸ Classes: + Class takes the id, name, teacher, title, season, first study day, a goal date and the closing date (prefilled Apr 24, 2027)", ["envc-cls-id","envc-cls-name","envc-cls-teacher","cp-new-title","cp-new-season","cp-new-start","cp-new-goal","cp-new-goaldate","cp-new-lockat"].every(id=>h.indexOf('id="'+id+'"')>=0)&&/id="cp-new-lockat"[^>]*value="2027-04-24"/.test(h)&&/onclick="envcClassAdd\(\)"/.test(h));
  [["envc-cls-id","eco-club"],["envc-cls-name","Eco Club"],["envc-cls-teacher","uid_t2"],["cp-new-title","Eco Club"],["cp-new-season","2027-28"],["cp-new-lockat","2027-05-02"]].forEach(x=>w.el(x[0],x[1]));
  w.envcClassAdd(); await w.flush();
  ok("+ Class → ONE multi-path update: classes/eco-club and teachers/uid_t2/classes/eco-club", (r=>r.op==="update"&&r.path==="/"&&JSON.stringify(Object.keys(r.val))===JSON.stringify(["classes/eco-club","teachers/uid_t2/classes/eco-club"])&&r.val["classes/eco-club"].title==="Eco Club"&&r.val["classes/eco-club"].lockAt==="2027-05-02")(last(w)), last(w));
  const t=demo("teacher"); ok("a teacher has no + Class", t.cp.cpAdminClassHtml()===""&&t.cp.cpClassAdd()===false); }

console.log("\n── the rules (envirothon/SITE_RULES.json): classes/<cid> per child ──");
{ const R=JSON.parse(fs.readFileSync(path.join(REPO,"envirothon","SITE_RULES.json"),"utf8")).rules.classes.$cid;
  const T=/classes\/'\+\$cid\+'\/teacher'\)\.val\(\) == auth\.uid/, ADM="auth != null && root.child('admins/'+auth.uid).val() == true";
  ok("the whole class: Adrienne only (no cascade for the teacher)", R[".write"]===ADM);
  ok("the teacher writes title, emoji, color — refused while locks/brand is true", ["title","emoji","color"].every(k=>T.test(R[k][".write"])&&/classes\/'\+\$cid\+'\/locks\/brand'\)\.val\(\) != true/.test(R[k][".write"])));
  ok("…and season, start, goals, goal, calendar, labels, features, students, teams, settings", ["season","start","goals","goal","calendar","labels","features","students","teams","settings"].every(k=>T.test(R[k][".write"])&&!/locks\/brand/.test(R[k][".write"])));
  ok("name, teacher, lockAt and locks: no teacher write", ["name","teacher","lockAt","locks"].every(k=>!R[k]||!R[k][".write"]));
  ok("shapes: title 1–40 · emoji ≤ 16, no letters / digits · color #rrggbb · dates YYYY-MM-DD · pct 1–100", /length <= 40/.test(R.title[".validate"])&&/length <= 16/.test(R.emoji[".validate"])&&/A-Za-z0-9/.test(R.emoji[".validate"])&&/\^#\[0-9a-fA-F\]\{6\}\$/.test(R.color[".validate"])&&/\[0-9\]\{4\}-/.test(R.start[".validate"])&&/\[0-9\]\{4\}-/.test(R.lockAt[".validate"])&&/pct'\)\.val\(\) <= 100/.test(R.goal[".validate"])&&/hasChildren\(\['name','date'\]\)/.test(R.goals.$i[".validate"]));
  ok("calendar: days is one of the four, off/<date> = true, nothing else; labels / features only the known keys", /'school'.*'noWeekends'.*'weekdays'.*'every'/.test(R.calendar.days[".validate"])&&R.calendar.$other[".validate"]===false&&/newData\.val\(\) == true/.test(R.calendar.off.$date[".validate"])&&/section\|sections\|pre\|post\|item\|concept/.test(R.labels.$k[".validate"])&&/teams\|boards\|specialists\|idFlash\|mockRun/.test(R.features.$k[".validate"])&&/isBoolean/.test(R.features.$k[".validate"]));
  ok("the class's settings keep ENVCLASSSET's lock check", /settings\/locks\/'\+\$name/.test(R.settings.$part.$name[".validate"]));
  const setup=fs.readFileSync(path.join(REPO,"envirothon","SITE_SETUP.md"),"utf8");
  ok("SITE_SETUP.md explains 🏫 Class setup, locks/brand and lockAt", /Class setup/.test(setup)&&/locks\/brand/.test(setup)&&/lockAt/.test(setup)); }

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
};
run().catch(e=>{ console.log("  FAIL- threw: "+(e&&e.stack||e)); process.exit(1); });
