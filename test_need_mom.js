/*
 * 🙋 "I need Mom" (2026-10-07) — a kid taps the button on their own schedule, says which card / a short note, and
 * the request (helpRequests/<id> = {kid, at, cardId?, cardTitle?, note?, status}) shows on Mom's Day and the Mom-mode
 * schedule until she taps ✓ Helped. The kid's schedule keeps going — nothing pauses, no card is written.
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
ok("Mom's Day shows the card", md.includes("h+=hrMomCardHTML();"));
ok("every family: no familyId / Howe gate in the block", !/HA_IS_HOWE|familyId|pageOn\(/.test(block.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n")));
ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
