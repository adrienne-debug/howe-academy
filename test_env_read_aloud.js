/*
 * Node tests — 🔊 ENVREADALOUD: the kid's read-aloud switch, Envirothon only (her decision 2026-10-28: a kid-controlled
 * read-aloud switch for Envirothon ONLY, not the other Howe study sessions).
 *   · the setting: mastery/<kid>_settings/envReadAloud = "auto" | "off" (absent = off), ONE targeted set; dry run and the site's
 *     demo keep it in memory only;
 *   · the switch on the 🌿 study start (that session only), on the check-in / final screen (with a 🔊 Read it), in the kid's ⚙️
 *     on the Envirothon site (not the parent's);
 *   · Auto: the 🌿 card's front through mastSpeak when it appears (the prompt, never the answer); each check-in question and its
 *     lettered choices when the question appears (Next, Back; not on a pick); ID Flash's name after the answer. Off: nothing on its
 *     own, the 🌿 type card's name-after-Check included; 🔊 taps still read. Speech stops on Next / Back / Quit;
 *   · every other study session, the session-level audio setting and all other speech behave exactly as before (the real
 *     mstAutoPlayCurrent / mstCheckTyped run with and without the block, same calls).
 *   run: node test_env_read_aloud.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const LIB = require(path.join(__dirname, "envirothon.js"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 300) : "")); } };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
const block = src.slice(a, b);
const ra = src.indexOf("// ENVREADALOUD_START"), rb = src.indexOf("// ENVREADALOUD_END");
const RBLK = src.slice(ra, rb);

console.log("── the block ──");
ok("ENVREADALOUD present once, right after ENVTEST_END, inside STARTER_UNITS (the Envirothon edition keeps it)", ra > a && rb < b && src.indexOf("// ENVREADALOUD_START", ra + 1) < 0 && src.slice(src.indexOf("// ENVTEST_END"), ra).trim() === "// ENVTEST_END");
ok("her decision and the date are cited", /2026-10-28/.test(RBLK) && /Envirothon ONLY/.test(RBLK));
ok("no Howe kid's name in the block", !/lincoln|ellis|lucy|julian/i.test(RBLK));
ok("ONE database write in the block: mastery/<kid>_settings/envReadAloud, guarded by db && !_dryRun() and never in the demo", (RBLK.match(/db\.ref\(/g) || []).length === 1 && /else if\(typeof db!=="undefined"&&db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)\) db\.ref\("mastery\/"\+kid\+"_settings\/envReadAloud"\)\.set\(mode\);/.test(RBLK) && /if\(envRaDemo\(\)\)/.test(RBLK));
ok("all speech goes through mastSpeak (no own engine calls besides the cancel)", (RBLK.match(/mastSpeak\(/g) || []).length === 1 && !/new SpeechSynthesisUtterance|\.speak\(/.test(RBLK));
ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0);

// ── a tiny world: STARTER_UNITS (ENVUNIT + ENVTEST + ENVREADALOUD) + the real mstAutoPlayCurrent / mstCheckTyped / mstBack / mstQuit ──
function world(o) {
  o = o || {};
  const G = { masteryData: o.mastery || {}, unitStudies: o.unitStudies || {}, writes: [], said: [], played: [], cancels: 0, pauses: 0, dry: !!o.dry, demo: !!o.demo, toasts: [], renders: 0, now: 1800000000000, els: {}, confirmAns: true };
  const db = o.noDb ? null : { ref(p) { return { set(v) { G.writes.push(["set", p, v]); }, update(v) { G.writes.push(["update", p, v]); }, transaction(fn) { G.writes.push(["transaction", p, fn(null)]); return Promise.resolve({}); } }; } };
  const helpers = 'const MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"]; const MAST_MASTERY_TIER_DEFAULT="monthly"; function mastIsNeverDrill(){ return false; }\n' + fn("mastTierAtLeast") + "\n";
  const study = o.noBlock ? block.slice(0, block.indexOf("// ENVREADALOUD_START")) + block.slice(block.indexOf("// ENVREADALOUD_END")) : block;
  const api = new Function("G", "db", "LIB", "RealDate", `
    const masteryData=G.masteryData, currData={subjects:{}}; let unitStudies=G.unitStudies; let tab="mastery";
    const window={ HoweEnvirothon: LIB, speechSynthesis:{ cancel(){ G.cancels++; } }, _ttsAudio:{ pause(){ G.pauses++; } } };
    const _els=G.els; const document={ getElementById:id=>_els[id]||null, createElement:()=>({ style:{}, _h:"", set innerHTML(v){ this._h=v; }, get innerHTML(){ return this._h; }, parentNode:null }), head:{ appendChild(){} },
      body:{ appendChild(el){ _els[el.id]=el; el.parentNode={ removeChild(){ delete _els[el.id]; } }; } } };
    const location={ hostname:"localhost" }; function Date(...a){ return a.length?new RealDate(...a):new RealDate(G.now); } Date.now=()=>G.now;
    function momHere(){ return false; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function envsDemo(){ return G.demo; } function envsToast(m){ G.toasts.push(m); }
    function renderUnits(){} function renderAll(){ G.renders++; } const HA_LS={ setItem(){} }; function confirm(){ return G.confirmAns; }
    function setInterval(){ return 1; } function clearInterval(){} function _todayStr(){ return "2027-01-20"; }
    function mastDefKeyOk(p){ return !/[.#$\\[\\]\\/]/.test(p); } function mastDefKey(p){ return String(p); }
    function mastGateChapter(){ return null; } function mastFullBank(){ return {}; }
    let _ttsSeq=0; function mastSpeak(t,opts){ G.said.push(opts&&opts.spell?"spell:"+t:t); }
    function mastGetDefAudio(k,n){ return !!(G.recs&&G.recs[n]); } function mastPlayDefAudio(n){ G.played.push(n); }
    let masteryKid="kid1", mstState=null, mstSid=null, mstTyped="", mstChecked=null, mstHist=[], mstRedo=[], mstFlipped=false;
    function mstCurrent(st){ return st&&st.card; } function mstIsSpellCard(c){ return !!(c&&c.spell); } function mstIsRuleCard(c){ return !!(c&&c.rule); }
    function mstCardMode(c){ return (c&&c.mode)||"rec"; } function mstCardDef(c){ return (c&&c.def)||""; } function mstCardPic(c){ return (c&&c.pic)||""; }
    function mastCatFace(d){ return (G.faces&&G.faces[d])||"desc"; } function mstTypeAnsOn(s,c){ return !!(s&&s.typeAnswer); }
    function mstSessions(){ return G.sessions||[]; } function _mastRe(){ G.re=(G.re||0)+1; } function mstTypedOk(t,n){ return String(t).toLowerCase()===String(n).toLowerCase(); }
    function mstPersist(){} function mstNavReset(){ mstHist=[]; mstRedo=[]; } function mstSerialize(s){ return s; } function mstRestore(s){ return s; }
    ${helpers}
    ${study}
    ${fn("mstAutoPlayCurrent")}
    ${fn("mstCheckTyped")}
    ${fn("mstBack")}
    ${fn("mstQuit")}
    ${fn("envsSettingsHtml").replace(/^function envsSettingsHtml\(\)\{/, "function envsSettingsHtml(){ const _envs=G.envs;")}
    function envsKidColor(){ return "#123456"; } function envsEsc(v){ return String(v); } function envsLicenseLine(){ return "lic"; }
    return { G, ENV_SESSION_SID, envUnitRecord, envtOpen, envtPick, envtNext, envtBack, envtQuit, envtFinish, envtClose, envtHtml, envtStatus,
      envRaMode:typeof envRaMode==="function"?envRaMode:null, envRaSet:typeof envRaSet==="function"?envRaSet:null, envRaToggleHtml:typeof envRaToggleHtml==="function"?envRaToggleHtml:null,
      envRaStartHtml:typeof envRaStartHtml==="function"?envRaStartHtml:null, envRaFront:typeof envRaFront==="function"?envRaFront:null, envRaReadQ:typeof envRaReadQ==="function"?envRaReadQ:null,
      envRaFlashSaid:typeof envRaFlashSaid==="function"?envRaFlashSaid:null, envRaQText:typeof envRaQText==="function"?envRaQText:null,
      mstAutoPlayCurrent, mstCheckTyped, mstBack, mstQuit, envsSettingsHtml,
      get state(){ return envtState; }, set mst(v){ mstState=v; }, set sid(v){ mstSid=v; }, set typed(v){ mstTyped=v; }, get checked(){ return mstChecked; }, set hist(v){ mstHist=v; },
      ov(){ return _els["envtest-ov"]?_els["envtest-ov"].innerHTML:null; } };`
  ).call(null, G, db, LIB, globalThis.Date);
  return api;
}
const K = "kid1";
const ENV = { sid: "envirothon", name: "Envirothon", audio: undefined }, DAILY = { sid: "daily", name: "Daily Study", audio: "front" };

console.log("\n── the setting: one targeted path, default off ──");
{ const w = world();
  ok("no record → off; a junk value → off", w.envRaMode(K) === "off" && (w.G.masteryData.kid1_settings = { envReadAloud: "loud" }, w.envRaMode(K) === "off"));
  w.envRaSet(K, "auto");
  ok("Auto: ONE set mastery/kid1_settings/envReadAloud = 'auto'; in memory; a redraw", w.G.writes.length === 1 && w.G.writes[0][0] === "set" && w.G.writes[0][1] === "mastery/kid1_settings/envReadAloud" && w.G.writes[0][2] === "auto" && w.envRaMode(K) === "auto" && w.G.renders === 1);
  w.envRaSet(K, "off"); w.envRaSet(K, "whatever");
  ok("Off (and anything else) writes 'off'; switching stops any speech", w.G.writes.length === 3 && w.G.writes.slice(1).every(x => x[1] === "mastery/kid1_settings/envReadAloud" && x[2] === "off") && w.envRaMode(K) === "off" && w.G.cancels >= 3);
  ok("the rest of the kid's settings untouched (the same object, one key added)", Object.keys(w.G.masteryData.kid1_settings).join() === "envReadAloud");
  ok("no kid → nothing", w.envRaSet("", "auto") === false && w.G.writes.length === 3);
  const d = world({ dry: true }); d.envRaSet(K, "auto"); ok("dry run: in memory only", d.G.writes.length === 0 && d.envRaMode(K) === "auto");
  const m = world({ demo: true }); m.envRaSet(K, "auto"); ok("the site's demo: in memory only, the toast says 'would set'", m.G.writes.length === 0 && m.envRaMode(K) === "auto" && /demo: would set mastery\/kid1_settings\/envReadAloud/.test(m.G.toasts[0]));
  const n = world({ noDb: true }); ok("no database yet: in memory, nothing thrown", n.envRaSet(K, "auto") === true && n.envRaMode(K) === "auto"); }

console.log("\n── the switch: 🌿 study start only, Auto · Off ──");
{ const w = world(); const h = w.envRaToggleHtml(K);
  ok("'🔊 Read aloud:' with Auto and Off buttons; Off pressed by default", /\u{1F50A} Read aloud:/u.test(h) && /envRaSet\('kid1','auto'\)[^>]*aria-pressed="false"/.test(h) && /envRaSet\('kid1','off'\)[^>]*aria-pressed="true"/.test(h) && />Auto</.test(h) && />Off</.test(h));
  w.G.masteryData.kid1_settings = { envReadAloud: "auto" }; ok("Auto pressed when saved", /envRaSet\('kid1','auto'\)[^>]*aria-pressed="true"/.test(w.envRaToggleHtml(K)));
  ok("the 🌿 session's start shows it; every other session's start shows nothing", /envra-toggle/.test(w.envRaStartHtml(K, ENV)) && w.envRaStartHtml(K, DAILY) === "" && w.envRaStartHtml(K, null) === "" && w.envRaStartHtml("", ENV) === "");
  ok("hook: renderMastStudy draws it inside the session header, one guarded line", /Done today: [^\n]*\n  if\(typeof envRaStartHtml==="function"\) h\+=envRaStartHtml\(kid,session\);[^\n]*\n  h\+='<\/div>';/.test(src)); }

console.log("\n── the 🌿 session: Auto reads the card's front when it appears; Off reads nothing on its own ──");
{ const w = world(); w.sid = "envirothon";
  const show = (card, ses) => { w.G.said.length = 0; w.mst = { card }; w.mstAutoPlayCurrent(ses || ENV); return w.G.said.slice(); };
  const rec = { name: "Cambium", def: "the growing layer", mode: "rec" }, pick = { name: "Cambium", def: "x", mode: "pick" }, ideas = { name: "Cambium", def: "x", mode: "ideas" },
    type = { name: "Cambium", def: "the growing layer under the bark", mode: "type" }, picQ = { name: "White oak · leaf", deck: "Forestry · ID", pic: "p.jpg", mode: "pick" }, picD = { name: "Riffle", deck: "Aquatic Ecology · Terms", pic: "p.jpg", mode: "rec" };
  w.G.faces = { "Forestry · ID": "name" };
  ok("Off (the default): nothing speaks on a flip, pick, key-ideas or type card; the old speech is stopped", [rec, pick, ideas, type, picQ].every(c => show(c).length === 0) && w.G.cancels >= 5);
  w.G.masteryData.kid1_settings = { envReadAloud: "auto" };
  ok("Auto: a flip / pick / key-ideas card reads its name", show(rec).join() === "Cambium" && show(pick).join() === "Cambium" && show(ideas).join() === "Cambium");
  ok("Auto: a type card reads the definition (the prompt), never the name (the answer)", show(type).join() === "the growing layer under the bark");
  ok("Auto: a 'what is this?' picture card reads nothing (the name is the answer); a picture card with its name on the front reads the name", show(picQ).length === 0 && show(picD).join() === "Riffle");
  ok("Auto: Mom's session-level audio 'off' still silences the 🌿 session", show(rec, Object.assign({}, ENV, { audio: "off" })).length === 0);
  ok("Auto is per kid: another kid's Off stays off", (w.G.masteryData.kid2_settings = { envReadAloud: "off" }, w.envRaMode("kid2") === "off"));
  ok("envRaFront: the face the kid sees", w.envRaFront(ENV, rec) === "Cambium" && w.envRaFront(ENV, type) === "the growing layer under the bark" && w.envRaFront(ENV, picQ) === "" && w.envRaFront(Object.assign({}, ENV, { typeAnswer: true }), type) === "Cambium" && w.envRaFront(ENV, null) === "");
  // the type card's name after Check
  const chk = (mode, ses) => { const w2 = world(); w2.G.sessions = [ses]; w2.sid = ses.sid; if (mode) w2.G.masteryData.kid1_settings = { envReadAloud: mode }; w2.mst = { card: type }; w2.typed = "cambium"; w2.mstCheckTyped(); return { said: w2.G.said.slice(), ok: w2.checked && w2.checked.ok }; };
  ok("🌿 type card, Off: Check grades it and says nothing", (r => r.ok === true && r.said.length === 0)(chk(null, ENV)));
  ok("🌿 type card, Auto: Check says the name (the answer, now that it's answered)", (r => r.ok === true && r.said.join() === "Cambium")(chk("auto", ENV)));
  // Back / Quit stop the speech in the 🌿 session only
  const nav = (sid, f) => { const w3 = world(); w3.sid = sid; w3.mst = { card: rec }; w3.hist = [{ card: rec }]; const c0 = w3.G.cancels; w3[f](); return w3.G.cancels - c0; };
  ok("← Back and Quit stop the 🌿 session's speech", nav("envirothon", "mstBack") === 1 && nav("envirothon", "mstQuit") === 1);
  ok("…and touch nothing in another session", nav("daily", "mstBack") === 0 && nav("daily", "mstQuit") === 0);
  ok("Next: every new card goes through mstAutoPlayCurrent, which hushes first in the 🌿 session (Off included)", (() => { const w4 = world(); w4.mst = { card: rec }; const c0 = w4.G.cancels; w4.mstAutoPlayCurrent(ENV); return w4.G.cancels === c0 + 1 && w4.G.said.length === 0; })()); }

console.log("\n── every other session: exactly as before (with the block vs. without it) ──");
{ const cards = [{ name: "Haus", mode: "rec" }, { name: "Hund", mode: "type", def: "dog" }, { name: "because", spell: true }, { name: "<u>E.T.</u> came", rule: true }, { name: "Katze", mode: "pick", def: "cat" }, { name: "Maus", mode: "rec", rec: true }];
  const run = (noBlock, ses, mode) => { const w = world({ noBlock }); w.G.recs = { Maus: true }; if (mode) w.G.masteryData.kid1_settings = { envReadAloud: mode }; const out = [];
    cards.forEach(c => { w.G.said.length = 0; w.G.played.length = 0; w.mst = { card: c }; w.mstAutoPlayCurrent(ses); out.push(w.G.said.join("|") + "/" + w.G.played.join("|")); });
    w.G.sessions = [ses]; w.sid = ses.sid; w.G.said.length = 0; w.mst = { card: { name: "Hund", mode: "type", def: "dog" } }; w.typed = "hund"; w.mstCheckTyped(); out.push("check:" + w.G.said.join("|"));
    return { out: out.join(" · "), cancels: w.G.cancels }; };
  const before = run(true, DAILY), after = run(false, DAILY), afterAuto = run(false, DAILY, "auto"), afterOff = run(false, Object.assign({}, DAILY, { audio: "off" }), "auto"), beforeOff = run(true, Object.assign({}, DAILY, { audio: "off" }));
  ok("Daily Study (audio front): the same speech, card for card, with or without ENVREADALOUD — and the kid's Auto changes nothing there", before.out === after.out && after.out === afterAuto.out && before.out === "Haus/ · / · spell:because/ · / · / · /Maus · check:Hund", before.out);
  ok("…and nothing is cancelled there", after.cancels === 0 && afterAuto.cancels === 0);
  ok("a session with audio 'off': silent before and after", beforeOff.out === afterOff.out && /^(\/ · )+\/ · check:$/.test(afterOff.out), afterOff.out);
  const back = (noBlock) => { const w = world({ noBlock }); w.G.recs = {}; w.mst = { card: { name: "Haus" } }; w.mstAutoPlayCurrent(Object.assign({}, ENV)); return w.G.said.join("|"); };
  ok("without the block the 🌿 session would speak a flip card's name on its own (the old default); with it, Off keeps it quiet", back(true) === "Haus" && back(false) === "");
  ok("the hooks: one guarded line each, tagged 🔊 ENVREADALOUD (mstAutoPlayCurrent first line, the Check speech, Back, Quit, the start, the check-in bar / redraw / close, ID Flash answer + Next, the site's ⚙️)", (src.match(/\/\/ 🔊 ENVREADALOUD/g) || []).length === 11 &&
    /function mstAutoPlayCurrent\(session\)\{\n  if\(typeof envRaAutoPlay==="function"&&envRaAutoPlay\(session\)\) return;/.test(src) &&
    /if\(ses&&ses\.audio!=="off"&&!\(typeof envRaQuiet==="function"&&envRaQuiet\(ses\)\)\)\{ if\(mastGetDefAudio\(masteryKid,cur\.name\)\) mastPlayDefAudio\(cur\.name\); else mastSpeak\(cur\.name\); \}/.test(src) &&
    /function mstBack\(\)\{\n  if\(typeof envRaNav==="function"\) envRaNav\(\);/.test(src) && /function mstQuit\(\)\{ if\(typeof envRaNav==="function"\) envRaNav\(\);/.test(src)); }

console.log("\n── the check-in / final: the switch, 🔊 Read it, Auto reads each question and its choices ──");
function enrolledWorld(o) { const w = world(o); const u = w.envUnitRecord(); u.enrolled = { kid1: true }; w.G.unitStudies.nc_envirothon = u; w.G.masteryData.kid1_settings = Object.assign({ cat_hold: {} }, w.G.masteryData.kid1_settings || {}); return w; }
{ const w = enrolledWorld(); const q = n => w.envRaQText(LIB.tests.forestry.pre.items[n]);
  ok("the question text: the question, then 'A. … B. …' choices", /^\S/.test(q(1)) && q(1).indexOf(LIB.tests.forestry.pre.items[1].q) === 0 && / A\. /.test(q(1)) && / D\. /.test(q(1)) && !/ E\. /.test(q(1)));
  w.envtOpen(K, "forestry", "pre");
  ok("Off (default): the question screen opens silent, with the switch and a '🔊 Read it' button", w.G.said.length === 0 && /envra-toggle/.test(w.ov()) && /onclick="envRaReadQ\(\)"/.test(w.ov()) && /Read it/.test(w.ov()));
  w.envRaReadQ(); ok("🔊 Read it reads the question and its choices on a tap (Off too)", w.G.said.length === 1 && w.G.said[0] === q(0));
  w.envtPick(0); w.envtNext(); ok("Off: Next shows question 2 and reads nothing", w.state.i === 1 && w.G.said.length === 1);
  w.envtQuit(); const c0 = w.G.cancels;
  w.G.masteryData.kid1_settings.envReadAloud = "auto"; w.G.said.length = 0; w.envtOpen(K, "forestry", "pre");
  ok("Auto: question 1 and its choices are read when it appears", w.G.said.length === 1 && w.G.said[0] === q(0) && w.G.cancels > c0);
  w.envtPick(0); ok("a pick redraws the same question: not read again", w.G.said.length === 1);
  w.envtNext(); ok("Next → question 2 is read", w.G.said.length === 2 && w.G.said[1] === q(1));
  w.envtPick(1); w.envtBack(); ok("← Back → question 1 again, read again", w.state.i === 0 && w.G.said.length === 3 && w.G.said[2] === q(0));
  const c1 = w.G.cancels; w.envtQuit(); ok("Quit stops the speech", w.G.cancels > c1 && w.state === null);
  w.G.said.length = 0; w.envtOpen(K, "forestry", "pre"); const f = w.state.form;
  f.items.forEach((it, i) => { const k = Array.isArray(it.ans) ? it.ans : [it.ans]; k.forEach(x => w.envtPick(x)); w.envtNext(); });
  ok("each of the 15 questions read once as it appeared; the result screen reads nothing and stops the speech", w.G.said.length === 15 && !!w.state.done && !/envRaReadQ/.test(w.ov()));
  const c2 = w.G.cancels; w.envtClose(); ok("Done stops the speech", w.G.cancels > c2);
  w.G.masteryData.kid1_settings.envReadAloud = "off"; w.G.writes.length = 0; w.G.masteryData.kid1_tests = {}; w.envtOpen(K, "forestry", "pre"); w.envRaSet(K, "auto");
  ok("switching on the check-in screen saves the one path and redraws the test (still question 1, state kept)", w.G.writes.length === 1 && w.G.writes[0][1] === "mastery/kid1_settings/envReadAloud" && w.state && w.state.i === 0 && /envRaSet\('kid1','auto'\)[^>]*aria-pressed="true"/.test(w.ov()));
  w.envtQuit(); }

console.log("\n── ⚡ ID Flash: the name after the answer (Auto) ──");
{ const w = world();
  ok("Off: nothing", w.envRaFlashSaid(K, "White oak") === false && w.G.said.length === 0);
  w.G.masteryData.kid1_settings = { envReadAloud: "auto" }; ok("Auto: the item's name", w.envRaFlashSaid(K, "White oak") === true && w.G.said.join() === "White oak");
  ok("hooks: envFlashAnswer says it after the redraw; Next stops it", /if\(typeof _mastRe==="function"\) _mastRe\(\);\n  if\(typeof envRaFlashSaid==="function"\) envRaFlashSaid\(envFlash\.kid,c\.item\);/.test(src) && /function envFlashNextCard\(\)\{\n  if\(!envFlash\|\|!envFlash\.ans\) return;\n  if\(typeof envRaHush==="function"\) envRaHush\(\);/.test(src)); }

console.log("\n── the Envirothon site: the kid's ⚙️ has the switch, the parent's doesn't ──");
{ const w = world();
  w.G.envs = { kid: "kid1", role: "kid", email: "" }; const k = w.envsSettingsHtml();
  w.G.envs = { kid: "kid1", role: "parent", email: "p@x" }; const p = w.envsSettingsHtml();
  ok("kid: the switch with a one-line note", /envra-toggle/.test(k) && /Auto reads each card and each check-in question out loud/.test(k));
  ok("parent: no switch (the PIN card instead)", !/envra-toggle/.test(p) && /Parent PIN/.test(p)); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
