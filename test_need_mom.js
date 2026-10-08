/*
 * 🙋 "I need Mom" (2026-10-07) — a kid taps the button on their own schedule, says which card / a short note, and
 * the request (helpRequests/<id> = {kid, at, cardId?, cardTitle?, note?, status}) shows on Mom's Day and the Mom-mode
 * schedule until she taps ✓ Helped. The kid's schedule keeps going — nothing pauses, no card is written.
 * v2 (same evening): a pop-up on Mom's side (Mom mode + Mom's Day open) with 🙋 Help now / ⏭ Help next; "next" goes
 * into the Mom loop as a LAYER over mlNow — the day's lay never changes because of an ask (replayed below).
 *   run:  node test_need_mom.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(process.env.HA_INDEX || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } };
const a = src.indexOf("// ── NEEDMOM_START"), b = src.indexOf("// ── NEEDMOM_END");
ok("NEEDMOM block present", a > 0 && b > a);
const block = src.slice(a, b);
const escLine = src.match(/function esc\(s\)\{[^\n]*\n/)[0];
const capLine = src.match(/function cap\(s\)\{[^\n]*\n/)[0];

function mkEnv(st) {
  const els = {}, writes = [], renders = [], pinAsks = [], toasts = [];
  const document = {
    activeElement: null,
    body: { appendChild: el => { els[el.id] = el; } },
    getElementById: id => els[id] || null,
    createElement: () => { const el = { style: {}, dataset: {}, innerHTML: "", remove() { delete els[el.id]; } }; return el; },
  };
  const ref = p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]), remove: () => writes.push(["remove", p]) });
  const ctx = {
    document, db: { ref }, _dryRun: () => !!st.dry, kitPinGate: (f, why) => pinAsks.push([f, why]),
    momHere: () => st.mom, momHereCards: () => st.mom && st.tab !== "kids",
    renderAll: () => renders.push(1), gwShowToast: m => toasts.push(m),
    ROSTER: ["taylor", "caleb"], KID_NAME: { taylor: "Taylor", caleb: "Caleb" }, KID_COLOR: { taylor: "#e11d48", caleb: "#2563eb" },
    checked: { c_done: true },
    _kcTodayCards: k => k === "taylor" ? [{ id: "c_math", title: "Math <5B>", who: "taylor" }, { id: "c_done", title: "Spelling", who: "taylor" }] : [],
    console, Date, Math, Object, String,
  };
  vm.createContext(ctx);
  new vm.Script(escLine + capLine + block + "\nthis.hrDataGet=()=>hrData;").runInContext(ctx);
  return { ctx, els, writes, renders, pinAsks, toasts };
}

// ── the kid's button ──
{ const st = { mom: false, tab: "kids" }, E = mkEnv(st);
  const btn = E.ctx.hrKidButtonHTML("taylor");
  ok("kid's own view shows 🙋 I need Mom", btn.includes("🙋 I need Mom") && btn.includes("hrAskOpen('taylor')"));
  ok("no button for 'all' / 'mom' / unknown kid", !E.ctx.hrKidButtonHTML("all") && !E.ctx.hrKidButtonHTML("mom") && !E.ctx.hrKidButtonHTML("zed"));
  st.mom = true; st.tab = "schedule";
  ok("Mom looking at a kid's Schedule page → no button (she doesn't ask herself)", E.ctx.hrKidButtonHTML("taylor") === "");
  st.tab = "kids";
  ok("Mom mode inside Kids' Corner still shows the kid's button", E.ctx.hrKidButtonHTML("taylor").includes("I need Mom"));
}

// ── asking ──
{ const st = { mom: false, tab: "kids" }, E = mkEnv(st);
  E.ctx.hrAskOpen("taylor");
  const p = E.els["hr-panel"];
  ok("tap opens 'What do you need help with?'", p && p.innerHTML.includes("What do you need help with?"));
  ok("card picker lists today's cards still to do (escaped), not checked ones", p.innerHTML.includes('value="c_math"') && p.innerHTML.includes("Math &lt;5B&gt;") && !p.innerHTML.includes('value="c_done"'));
  ok("card and note are optional ('Something else' first)", /<option value="">Something else<\/option>/.test(p.innerHTML) && p.innerHTML.includes("(optional)"));
  E.els["hr-card"] = { value: "c_math" }; E.els["hr-note"] = { value: "  stuck on number 4  " };
  E.ctx.hrAskSend();
  ok("send writes ONE record at helpRequests/<id>", E.writes.length === 1 && E.writes[0][0] === "set" && /^helpRequests\/hr_\d{13}_[a-z0-9]+$/.test(E.writes[0][1]), E.writes);
  const r = E.writes[0][2];
  ok("record = kid, time, card, note, open", r.kid === "taylor" && typeof r.at === "number" && r.cardId === "c_math" && r.cardTitle === "Math <5B>" && r.note === "stuck on number 4" && r.status === "open", r);
  ok("popup closes, kid gets a keep-going toast, page repaints", !E.els["hr-panel"] && /Keep going/.test(E.toasts[0] || "") && E.renders.length >= 1);
  ok("nothing pauses: no week/checked/brain-break write", E.writes.every(w => /^helpRequests\//.test(w[1])));
  ok("kid sees their open ask under the button", E.ctx.hrKidButtonHTML("taylor").includes("You asked Mom at") && E.ctx.hrKidButtonHTML("taylor").includes("Math &lt;5B&gt;"));
}
// no card, no note; long note trimmed; a card id that isn't theirs is dropped
{ const E = mkEnv({ mom: false, tab: "kids" });
  const r0 = E.ctx.hrBuild("taylor", "", "", 5);
  ok("bare ask = {kid, at, status} only", JSON.stringify(r0) === JSON.stringify({ kid: "taylor", at: 5, status: "open" }), r0);
  ok("note capped at 140", E.ctx.hrBuild("taylor", "", "x".repeat(300), 5).note.length === 140);
  ok("unknown card id dropped", !("cardId" in E.ctx.hrBuild("taylor", "c_nope", "", 5)));
}
// dry-run stays inert
{ const E = mkEnv({ mom: false, tab: "kids", dry: true });
  E.ctx.hrAskOpen("taylor"); E.els["hr-card"] = { value: "" }; E.els["hr-note"] = { value: "help" }; E.ctx.hrAskSend();
  ok("?dryrun=1 → no write", E.writes.length === 0);
}

// ── Mom's side ──
{ const st = { mom: false, tab: "md" }, E = mkEnv(st), now = Date.now();
  ok("nothing open → no card", E.ctx.hrMomCardHTML() === "");
  const r0 = E.renders.length;
  E.ctx.hrOnValue({
    hr_1: { kid: "caleb", at: now - 60000, status: "open" },
    hr_2: { kid: "taylor", at: now - 30000, status: "open", cardTitle: "Math", note: "<b>stuck</b>" },
    hr_3: { kid: "taylor", at: now - 20000, status: "helped", helpedAt: now },
    hr_4: { kid: "taylor", at: now - 13 * 3600 * 1000, status: "open" },
  });
  ok("a new ask repaints", E.renders.length === r0 + 1);
  const card = E.ctx.hrMomCardHTML();
  ok("Mom card lists both open asks with ✓ Helped", card.includes("Kids need you") && (card.match(/✓ Helped/g) || []).length === 2);
  ok("oldest first; names, card, note (escaped)", card.indexOf("Caleb") < card.indexOf("Taylor") && card.includes("Math") && card.includes("&lt;b&gt;stuck") && !card.includes("<b>stuck"));
  ok("helped and >12 h old asks are not shown", !card.includes("hrHelpedTap('hr_3')") && !card.includes("hrHelpedTap('hr_4')"));
  ok("kid filter (Mom on a kid's schedule page) shows only that kid", E.ctx.hrMomCardHTML("caleb").includes("A kid needs you") && !E.ctx.hrMomCardHTML("caleb").includes("Taylor"));
  const r1 = E.renders.length; E.ctx.hrOnValue(E.ctx.hrDataGet());
  ok("an echo with the same open set doesn't repaint", E.renders.length === r1);
  E.ctx.hrHelpedTap("hr_2");
  ok("✓ Helped outside Mom mode → Mom PIN first, nothing written", E.pinAsks.length === 1 && E.writes.length === 0);
  st.mom = true; E.pinAsks[0][0]();
  ok("✓ Helped writes ONE update {status, helpedAt}", E.writes.length === 1 && E.writes[0][0] === "update" && E.writes[0][1] === "helpRequests/hr_2" && E.writes[0][2].status === "helped" && typeof E.writes[0][2].helpedAt === "number", E.writes);
  ok("row gone from Mom's card; Caleb's still there", !E.ctx.hrMomCardHTML().includes("hrHelpedTap('hr_2')") && E.ctx.hrMomCardHTML().includes("hrHelpedTap('hr_1')"));
  E.ctx.hrHelpedTap("hr_1");
  ok("in Mom mode ✓ Helped goes straight through", E.writes.length === 2 && E.ctx.hrMomCardHTML() === "");
}

// ── wiring ──
ok("listener on helpRequests (newest 60)", /db\.ref\("helpRequests"\)\.orderByKey\(\)\.limitToLast\(60\)\.on\("value",s=>\{ hrOnValue\(s\.val\(\)\); \}\)/.test(src));
const kcs = src.slice(src.indexOf("function kcSchoolHTML("), src.indexOf("function kcSubnav("));
ok("Kids' Corner / My Day school view has the button", kcs.includes("hrKidButtonHTML(k)"));
const rs = src.slice(src.indexOf("function renderSchedule(el){"), src.indexOf("function renderSchedule(el){") + 20000);
ok("Schedule tab: kid's page button (today only)", rs.includes('if(day===_todayDay&&kid!=="all"&&kid!=="mom"){ try{ h+=hrKidButtonHTML(kid); }catch(e){} }'));
ok("Schedule tab: Mom-mode card (today only)", rs.includes("if(day===_todayDay&&momHere()){ try{ const _hr=hrMomCardHTML("));
const md = src.slice(src.indexOf("function renderMomsDay(el){"), src.indexOf("function renderMomsDay(el){") + 8000);
ok("Mom's Day shows the card (with its pop-up marker)", md.includes('h+=hrMomCardHTML(null,"md");'));
ok("every family: no familyId / Howe gate in the block", !/HA_IS_HOWE|familyId|pageOn\(/.test(block.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n")));
ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0);

// ══ v2: the pop-up (Help now / Help next) ══
{ const st = { mom: false, tab: "md" }, E = mkEnv(st), now = Date.now();
  E.ctx.hrOnValue({ hr_a: { kid: "taylor", at: now - 5000, status: "open", cardTitle: "Math", note: "number 4" } });
  ok("kid / non-Mom device without Mom's Day → no pop-up", !E.els["hr-pop"]);
  E.els["hr-md-mark"] = {};   // Mom's Day is on screen
  E.ctx.hrPopMaybe();
  const p = E.els["hr-pop"];
  ok("Mom's Day open → pop-up with name, card, note, Help now / Help next", p && p.innerHTML.includes("Taylor needs you") && p.innerHTML.includes("Math") && p.innerHTML.includes("number 4") && p.innerHTML.includes("🙋 Help now") && p.innerHTML.includes("⏭ Help next"));
  E.ctx.hrNowTap("hr_a");
  ok("Help now outside Mom mode → Mom PIN first, nothing written", E.pinAsks.length === 1 && E.writes.length === 0);
  st.mom = true; E.pinAsks[0][0]();
  ok("Help now writes ONE update {status:'now', decidedAt}", E.writes.length === 1 && E.writes[0][1] === "helpRequests/hr_a" && E.writes[0][2].status === "now" && typeof E.writes[0][2].decidedAt === "number", E.writes);
  ok("pop-up closes once answered", !E.els["hr-pop"]);
  st.tab = "kids"; st.mom = false;
  ok("kid sees 'Mom is coming to help you now!'", E.ctx.hrKidButtonHTML("taylor").includes("coming to help you now"));
  st.mom = true; st.tab = "md";
  ok("Mom's row: helping now + ✓ Helped, no more Help now/next", (() => { const c = E.ctx.hrMomCardHTML(); return c.includes("helping now") && c.includes("✓ Helped") && !c.includes("hrNowTap"); })());
}
{ const st = { mom: true, tab: "schedule" }, E = mkEnv(st), now = Date.now();
  E.ctx.hrOnValue({ hr_b: { kid: "caleb", at: now - 9000, status: "open" }, hr_c: { kid: "taylor", at: now - 4000, status: "open" } });
  ok("Mom mode anywhere → pop-up, oldest ask first", E.els["hr-pop"] && E.els["hr-pop"].dataset.id === "hr_b");
  E.ctx.hrPopLater("hr_b");
  ok("Later → the next ask pops; the first stays on her list", E.els["hr-pop"] && E.els["hr-pop"].dataset.id === "hr_c" && E.ctx.hrMomCardHTML().includes("hrNowTap('hr_b')") && E.writes.length === 0);
  E.ctx.hrNextTap("hr_c");
  ok("Help next (Mom mode) writes {status:'next'} at once", E.writes.length === 1 && E.writes[0][2].status === "next" && !E.els["hr-pop"]);
  st.tab = "kids";
  ok("kid sees 'Mom will help you next'", E.ctx.hrKidButtonHTML("taylor").includes("Mom will help you next"));
  st.tab = "schedule";
  ok("an echo of a decided ask never re-pops", (E.ctx.hrOnValue(E.ctx.hrDataGet()), !E.els["hr-pop"]));
}

// ══ v2: the Mom loop layer — replayed with the real MOMLOOP block ══
const ma = src.indexOf("// MOMLOOP_START"), mb = src.indexOf("// MOMLOOP_END");
const MOMLOOP = src.slice(ma, mb);
const fnSlice = name => { const i = src.indexOf("function " + name); return src.slice(i, src.indexOf("\n}", i) + 2); };
const TIME = fnSlice("toMin") + "\n" + fnSlice("fromMin");
let CID = 0;
const card = (who, time, dur, mom, title) => ({ id: who + "_" + (CID++), who, day: "thursday", mom: mom || "none", time, dur: dur || 20, title: title || (who + " card") });
function loopWorld(o) {
  const tasks = o.tasks, holdWrites = [];
  const ctx = {
    console, ROSTER: ["lucy", "lincoln", "ellis"], KID_NAME: { lucy: "Lucy", lincoln: "Lincoln", ellis: "Ellis" }, KID_COLOR: {},
    db: { ref: p => ({ set: v => holdWrites.push(["set", p, v]), update: v => holdWrites.push(["update", p, v]), remove: () => holdWrites.push(["remove", p]) }) }, WK: "week27",
    _dryRun: () => false, checked: o.checked || {}, momMoves: {},
    getActiveTasks: () => tasks, morningComplete: () => true, bbActive: () => null,
    momHere: () => true, momHereCards: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    document: { activeElement: null, body: { appendChild() {} }, getElementById: () => null, createElement: () => ({ style: {}, dataset: {}, remove() {} }) },
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, Date, RegExp,
  };
  ctx._mlNowOverride = 10 * 60 + 30;
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx);
  vm.runInContext(escLine + capLine + TIME, ctx); vm.runInContext(MOMLOOP, ctx); vm.runInContext(block, ctx);
  vm.runInContext("momLoop=" + JSON.stringify({ cursor: 0, order: ["lucy", "lincoln", "ellis"] }) + ";", ctx);
  if (o.momHold) vm.runInContext("momHold=" + JSON.stringify(o.momHold) + ";", ctx);
  if (o.asks) vm.runInContext("hrData=" + JSON.stringify(o.asks) + ";", ctx);
  const call = e => vm.runInContext(e, ctx);
  return { ctx, call, holdWrites, lay: () => call("mlQueueLay(" + JSON.stringify(tasks) + ")").map(t => t.id + "@" + t.time).join(",") };
}
{
  const NOW = Date.now();
  const mk = () => { CID = 0; return [card("lucy", "10:00 AM", 20, "none", "lucy notebook"), card("lucy", "10:20 AM", 20, "required", "lucy AAS"), card("lucy", "10:40 AM", 20, "required", "lucy math"),
    card("lincoln", "10:00 AM", 30, "none", "lincoln reading"), card("lincoln", "11:00 AM", 25, "required", "lincoln writing"), card("ellis", "10:00 AM", 30, "none"), card("ellis", "11:30 AM", 20, "required", "ellis FLL")]; };
  const hold = { kid: "lucy", id: "lucy_1", day: "thursday" };
  const base = loopWorld({ tasks: mk(), momHold: hold });
  const ask = s => ({ hr_x: { kid: "ellis", at: NOW - 60000, status: s, decidedAt: NOW - 30000, cardTitle: "ellis math" } });
  ["open", "now", "next"].forEach(s => {
    const w = loopWorld({ tasks: mk(), momHold: hold, asks: ask(s) });
    ok("lay unchanged by an ask (" + s + ") — no card moves", w.lay() === base.lay(), [w.lay(), base.lay()]);
    ok("mlNow unchanged by an ask (" + s + ") — the loop's own decision", JSON.stringify(w.call("mlNow()")) === JSON.stringify(base.call("mlNow()")));
  });
  // Help now while Lucy's session is held: Mom shows as helping Ellis, Lucy's hold is kept, Lucy's banner says so.
  { const w = loopWorld({ tasks: mk(), momHold: hold, asks: ask("now") });
    const t = w.call("hrLoopTurn()");
    ok("help now → active help turn for Ellis", t && t.kid === "ellis" && t.mode === "now" && t.active, t);
    ok("strip line: Helping Ellis (help now) + ✓ Helped", w.call("mlStripHTML()").includes("Helping <span") && w.call("mlStripHTML()").includes("Ellis") && w.call("mlStripHTML()").includes("hrHelpedTap('hr_x')"));
    ok("Lucy (held) banner: Mom is helping Ellis for a minute", w.call("mlBannerHTML('lucy')").includes("Mom is helping Ellis"));
    ok("hold kept during help now (resumes after ✓ Helped)", JSON.stringify(w.call("momHold")) === JSON.stringify(hold));
    w.call("hrHelped('hr_x')");
    ok("after ✓ Helped: no help turn, Lucy's banner back to 'You're with Mom'", w.call("hrLoopTurn()") === null && w.call("mlBannerHTML('lucy')").includes("with Mom"));
  }
  // Help next while Lucy's session is held: waits for that card, then the hold is NOT re-pointed at Lucy's next Mom card.
  { const w = loopWorld({ tasks: mk(), momHold: hold, asks: ask("next") });
    const t = w.call("hrLoopTurn()");
    ok("help next during Lucy's session → waiting, after Lucy", t && t.mode === "next" && !t.active && t.after === "lucy", t);
    ok("strip line: Next: Ellis — after this card with Lucy", w.call("mlStripHTML()").includes("Next: <span") && w.call("mlStripHTML()").includes("after this card with Lucy"));
    ok("Lucy's banner unchanged while help waits", w.call("mlBannerHTML('lucy')") === base.call("mlBannerHTML('lucy')"));
    w.call("checked['lucy_1']=true"); w.call("mlOnCheck(getActiveTasks()[1])");
    ok("Lucy's held card checked → hold released, NOT re-pointed at her next Mom card", JSON.stringify(w.call("momHold")) === "{}" && w.holdWrites.some(x => x[0] === "remove") && !w.holdWrites.some(x => x[0] === "set"), w.holdWrites);
    ok("…and the help turn for Ellis is now active", w.call("hrLoopTurn()").active === true);
    ok("early-finish sees Mom as not free for Lucy while helping Ellis", w.call("typeof _efMomFree") === "undefined" || w.call("_efMomFree('lucy')") === false);
  }
  // Control: same check-off with no ask → the existing rule re-points the hold at Lucy's next Mom card.
  { const w = loopWorld({ tasks: mk(), momHold: hold });
    w.call("checked['lucy_1']=true"); w.call("mlOnCheck(getActiveTasks()[1])");
    ok("control (no ask): hold re-pointed at Lucy's next Mom card (her 9/22 rule)", w.call("momHold").id === "lucy_2", w.call("momHold"));
  }
  // No session running: help next starts now; a buffer check-off by the loop kid locks no session.
  { const w = loopWorld({ tasks: mk(), asks: ask("next") });
    ok("no session held → help next is active at once", w.call("hrLoopTurn()").active === true);
    w.call("checked['lucy_0']=true"); w.call("mlOnCheck(getActiveTasks()[0])");
    ok("buffer check while Mom helps Ellis → no session lock", !w.holdWrites.some(x => x[0] === "set"), w.holdWrites);
    const c = loopWorld({ tasks: mk() }); c.call("checked['lucy_0']=true"); c.call("mlOnCheck(getActiveTasks()[0])");
    ok("control (no ask): the same buffer check locks Lucy's session", c.holdWrites.some(x => x[0] === "set"), c.holdWrites);
  }
  ok("cursor never written by a help turn", !/config\/momLoop/.test(JSON.stringify(loopWorld({ tasks: mk(), asks: ask("now") }).holdWrites)));
}
const efSrc = src.slice(src.indexOf("function _efMomFree("), src.indexOf("function _efMomFree(") + 600);
ok("early-finish's 'is Mom free' reads the help turn", efSrc.includes("hrLoopTurn"));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
