/*
 * 🃏 DRILLADD (slice 4 of DESIGN_drill_rows_curriculum_2026-11-19.md, §3.4 / §3.5 / §3.7 / §4; her picks 2026-11-22:
 * new kinds are added from Curriculum first, and the name on this side is "Card practice"). Against code sliced out of
 * index.html — RETRWEEK + RETRFAM, GWRETR, retrSlotMinutes, the Mastery panel's editor with RETRSAVE + DRILLSAVE, DRILLROWS,
 * DRILLDAYS, DRILLADD, the ADDFLOW block and the real ceOpenAdd / ceRenderAddSheet, the real mastMatchDecks:
 *   0. the block, its three ADDFLOW hooks and the empty chip; outside them the drill + Add code is unchanged (stripped compare)
 *   1. daKindsFrom (pure): can run by data — cards, Match decks, ladder; greyed with a reason; already-on kinds left out;
 *      an old-style drills subject keeps Daily Drill off the list
 *   2. the data readers: cards the drill can assemble, the Match game's own deck list (masteryKid put back), §5.1's test
 *   3. room and placement are drDaysMap's: daRoom / daPlan agree with drDaysMap tap by tap (random plans), never a
 *      duplicate, never more kinds on a day than drDaysMap allows
 *   4. what Mom sees: A subject · 🃏 Card practice at the top of step 1; the form — kinds, one line each, Mon–Fri pre-lit on
 *      the days with room, full days named, Save; no name, device, minutes or tracking
 *   5. Save → exactly one targeted update() of {week, week2} at mastery/retrievalPlan/<kid> (never settings), the live pass
 *      queued, the Mastery panel's copy dropped, the sheet closed; nothing is written before Save
 *   6. Mom only; ?dryrun=1 sends nothing to the database
 *   7. the empty-state chip opens this form; "add cards →" opens Mastery ▸ 🃏 Cards on this child
 *   run:  node test_drill_add.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + String(typeof x === "string" ? x : JSON.stringify(x)).slice(0, 700) + ")" : "")); } }
function fnIn(s, name) { const sig = "function " + name + "("; const i = s.indexOf(sig); if (i < 0) throw new Error("not found " + name); let d = 0; for (let k = s.indexOf("{", i); k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}") { d--; if (!d) return s.slice(i, k + 1); } } throw new Error("unbalanced " + name); }
const fn = name => fnIn(src, name);
function sliceIn(s, a, b) { const i = s.indexOf(a), j = s.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error("marker " + a); return s.slice(i, j + b.length); }
const slice = (a, b) => sliceIn(src, a, b);
const RETRWEEK0 = slice("// RETRWEEK_START", "// RETRWEEK_END");
const GWRETR = slice("// GWRETR_START", "// GWRETR_END");
const DRILLROWS = slice("// DRILLROWS_START", "// DRILLROWS_END");
const DRILLDAYS = slice("// DRILLDAYS_START", "// DRILLDAYS_END");
const DRILLADD = slice("// DRILLADD_START", "// DRILLADD_END");
const ADDFLOW = slice("// ADDFLOW_START", "// ADDFLOW_END");
const ADMIN = src.slice(src.indexOf("let retrAdminLocal=null;"), src.indexOf("// ── P4: schedule day-card strip"));
const clone = x => JSON.parse(JSON.stringify(x));
const J = JSON.stringify;
const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const DAYS = ["mon", "tue", "wed", "thu", "fri"];
const DEF_RE = /const RETR_WEEK_DEFAULT=\{[\s\S]*?\n\s*lincoln:\{[^}]*\}\};/;
if (!DEF_RE.test(RETRWEEK0)) throw new Error("RETR_WEEK_DEFAULT shape changed");
const wk = (mon, tue, wed, thu, fri) => ({ mon, tue, wed, thu, fri });
const card = (subject, status, x) => Object.assign({ id: subject + "_" + Math.random().toString(36).slice(2, 7), subject, status: status || "active", prompt: "p" + Math.random() }, x || {});
const deck = (subject, n, status) => Array.from({ length: n }, () => card(subject, status));

// The feature taken out again: the block, the three ADDFLOW hook lines, the empty chip's door and the two DRILLROWS notes.
// DRILLTHREE (slice 9) is taken out first, the same way on both sides (test_drill_three.js's stripThree; a no-op on a tree without it).
const { stripThree } = require("./test_drill_three.js");
function strip(s) {
  s = stripThree(s);
  const a = s.indexOf("// DRILLADD_START"), b = s.indexOf("// DRILLADD_END");
  if (a >= 0 && b > a) s = s.slice(0, a) + s.slice(b + "// DRILLADD_END\n".length);
  return s
    .replace('function afReset(){ if(typeof daReset==="function") daReset(); afStep=1;', "function afReset(){ afStep=1;")
    .replace(/\n  if\(typeof daOn!=="undefined"&&daOn&&typeof daSheetHTML==="function"\) return daSheetHTML\(kid,col\);[^\n]*/, "")
    .replace(/\n    if\(typeof daChoiceHTML==="function"\) h\+=daChoiceHTML\(kid,false\);[^\n]*/, "")
    .replace(`h+='<button class="dr-empty" onclick="daOpen(\\''+esc(arg)+'\\')" style="`, `h+='<button class="dr-empty" onclick="'+go+'" style="`)
    .replace("— set it up</button>';   // DRILLADD (slice 4): the empty chip opens ＋ Add subject ▸ 🃏 Card practice\n", "— set it up</button>';\n")
    .replace("// a greyed line opens Mastery ▸ Settings ▸ 🔁 Retrieval Plan on this child (the empty chip: Card practice, DRILLADD).", "// a greyed line or the empty chip opens Mastery ▸ Settings ▸ 🔁 Retrieval Plan on this child.");
}

// kida has a sprint ladder, kidb has none (the RETRFAM rule). o.items = {kid:[cards]}, o.owned = {kid:[ids]}.
function world(o, SRC) {
  o = o || {};
  const S = SRC || src;
  const F = n => fnIn(S, n), SL = (a, b) => sliceIn(S, a, b);
  const writes = [], sets = [], queued = [], nav = [], log = [], renders = [], toasts = [], closes = [], seenKids = [];
  const wrap = { id: "ce-sheet-wrap", style: {}, innerHTML: "", querySelector() { return null; } };
  const env = {
    console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, parseFloat, isNaN, RegExp, Error, Date,
    masteryKid: o.masteryKid || "kidz",
    masteryData: Object.assign({ retrievalPlan: clone(o.plan || {}) }, clone(o.items || {})),
    currData: { subjects: clone(o.subjects || {}), lessons: {} },
    ROSTER: ["kida", "kidb"], KID_COLOR: { kida: "#0ea5e9", kidb: "#e11d48" },
    cap: k => ({ kida: "Kid A", kidb: "Kid B" })[k] || k, esc, cw: k => k,
    retrTracks: k => (k === "kida" ? [{ key: "t" }] : []),
    retrSettings: () => ({ sprint_seconds: 60, sprint_rounds: 2, review_count: 3, slot_min_drill: 5, slot_min_match: 10 }),
    mastMeasuredDrillMin: () => null,
    mastIsNeverDrill: i => i.kt === "concept" || i.kt === "transfer",
    mstOwnedIds: k => new Set(((o.owned || {})[k]) || []),
    _matchEligible: it => { seenKids.push(env.masteryKid); return !(it && it.dir === "prod"); },
    momHere: () => o.mom !== false,
    _dryRun: () => !!o.dry,
    HA_LS: { setItem: () => log.push("ls"), getItem() { return null; } },
    retrLiveQueue: k => { queued.push(k); env._pend.push(k); return true; },
    retrLivePending: k => env._pend.indexOf(k) >= 0, _pend: [],
    _mastRe: () => log.push("repaint"),
    renderAll: () => renders.push("all"),
    gwShowToast: m => toasts.push(m),
    ceCloseSheet: () => closes.push(1), ceCloseTimer: null, ceAddMsg: "",
    mhqKid: "kidb", mhqView: "week", mhqDeck: null, mpSchoolOpen: t => nav.push(t),
    requestAnimationFrame: () => {}, setTimeout: () => 1, clearTimeout: () => {},
    alert: m => log.push("alert:" + m),
    document: {
      body: { style: {}, appendChild() {} },
      getElementById: id => (id === "ce-sheet-wrap" ? wrap : null),
      createElement: () => ({ style: {}, querySelector() { return null; } }),
    },
    writes, sets, queued, nav, log, renders, toasts, closes, seenKids, wrap,
  };
  if (o.db !== false) env.db = { ref: p => ({
    update: v => writes.push({ p, v: clone(v) }),
    set: v => sets.push({ p, v }), remove: () => sets.push({ p, remove: true }) }) };
  else env.db = null;
  const RETRWEEK = SL("// RETRWEEK_START", "// RETRWEEK_END").replace(DEF_RE, "const RETR_WEEK_DEFAULT=" + J(o.defaults || {}) + ";");
  const hasAdd = S.indexOf("// DRILLADD_START") >= 0;
  vm.createContext(env);
  vm.runInContext(F("retrSlotMinutes") + "\n" + RETRWEEK + "\n" + SL("// GWRETR_START", "// GWRETR_END") + "\n"
    + S.slice(S.indexOf("let retrAdminLocal=null;"), S.indexOf("// ── P4: schedule day-card strip")) + "\n"
    + SL("// DRILLROWS_START", "// DRILLROWS_END") + "\n" + SL("// DRILLDAYS_START", "// DRILLDAYS_END") + "\n"
    + (hasAdd ? SL("// DRILLADD_START", "// DRILLADD_END") + "\n" : "")
    + "let ceAddKid=null; let ceAddForm={};\n" + F("ceOpenAdd") + "\n" + F("ceRenderAddSheet") + "\n" + F("mastMatchDecks") + "\n"
    + SL("// ADDFLOW_START", "// ADDFLOW_END")
    + "\n;this.__admin=()=>retrAdminLocal;this.__setAdmin=v=>{retrAdminLocal=v;};"
    + "this.__da=()=>(" + (hasAdd ? "{on:daOn,kind:daKind,days:daDays,msg:daMsg" : "{on:false") + ",af:afStep,kid:ceAddKid});"
    + "this.RETR_SLOT_TITLE=RETR_SLOT_TITLE;", env);
  env.html = () => wrap.innerHTML;
  return env;
}
// The days lit / offered in the form.
const litIn = h => { const out = []; h.replace(/class="ce-chip da-day( sel)?"[^>]*onclick="daToggleDay\('(\w+)'\)"/g, (m, on, d) => { if (on) out.push(d); }); return out; };
const fullIn = h => { const out = []; h.replace(/class="ce-chip da-day da-full"[^>]*>(\w+) · full</g, (m, d) => out.push(d)); return out; };
const kindsIn = h => { const out = []; h.replace(/class="ce-chip da-kind( sel)?" onclick="daPickKind\('(\w+)'\)"/g, (m, s, k) => out.push(k + (s ? "*" : ""))); return out; };
const greyIn = h => { const out = []; h.replace(/class="ce-chip da-grey"[^>]*>([^<]*)</g, (m, t) => out.push(t)); return out; };

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("0. the block and its hooks");
{
  ok("DRILLADD_START / _END once each, right after DRILLDAYS_END", src.split("// DRILLADD_START").length === 2 && src.split("// DRILLADD_END").length === 2
    && src.indexOf("// DRILLDAYS_END\n// DRILLADD_START") >= 0);
  ok("the block cites her picks, the date, the design and the slice", /2026-11-22/.test(DRILLADD) && /Card practice/.test(DRILLADD) && /DESIGN_drill_rows_curriculum_2026-11-19\.md/.test(DRILLADD) && /slice 4/.test(DRILLADD));
  ok("no 🔀 anywhere in index.html", src.indexOf("\u{1F500}") < 0);
  ok("the block's one write is drDaysWrite (→ drPlanWrite); no db.ref, no settings, no set()", (DRILLADD.match(/drDaysWrite\(/g) || []).length === 1 && !/db\.ref|\.set\(|retrievalPlan\/|settings:/.test(DRILLADD.replace(/^\/\/.*$/gm, "")));
  ok("placement is drDaysMap's — the block never copies the two-slot rule (no week2[…] / b[day] logic of its own)", !/week2\[|\["week2"\]|\bb\[d\]/.test(DRILLADD) && (DRILLADD.match(/drDaysMap\(/g) || []).length >= 3);
  ok("…and never says \"two\" (the limit lives in drDaysMap's slots, for the three-a-day slice)", !/\btwo a day|\bhas two\b|already has two/.test(DRILLADD.replace(/^\/\/.*$/gm, "")));
  ok("ADDFLOW hooks: afReset resets the form, afSheetHTML hands over to it, step 1 draws the choice", /function afReset\(\)\{ if\(typeof daReset==="function"\) daReset\(\); afStep=1;/.test(ADDFLOW)
    && /function afSheetHTML\(kid,f,col\)\{\n  if\(typeof daOn!=="undefined"&&daOn&&typeof daSheetHTML==="function"\) return daSheetHTML\(kid,col\);/.test(ADDFLOW)
    && /if\(afStep===1\)\{\n    if\(typeof daChoiceHTML==="function"\) h\+=daChoiceHTML\(kid,false\);[^\n]*\n    if\(typeof famWhoRowHTML/.test(ADDFLOW));
  ok("the empty chip's door is daOpen", /class="dr-empty" onclick="daOpen\(\\''\+esc\(arg\)\+'\\'\)"/.test(DRILLROWS));
  const S0 = strip(src);
  ok("stripped: no trace of the feature left", !/DRILLADD|daOpen|daReset|daSheetHTML|daChoiceHTML/.test(S0));
  ok("stripped: the regions it touches are whole again (the hooks' own test pins still hold)", /function afReset\(\)\{ afStep=1;/.test(S0) && /class="dr-empty" onclick="'\+go\+'"/.test(S0));
  // Against origin/main, the same strip on both sides (still true after this branch is merged).
  let main = ""; try { main = cp.execSync("git show origin/main:index.html", { cwd: __dirname, encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }); } catch (e) { main = ""; }
  if (main) {
    const M0 = strip(main);
    const regions = [["// ADDFLOW_START", "// ADDFLOW_END"], ["// DRILLROWS_START", "// DRILLROWS_END"], ["// DRILLDAYS_START", "// DRILLDAYS_END"], ["// DRILLSAVE_START", "// DRILLSAVE_END"], ["// RETRWEEK_START", "// RETRWEEK_END"]];
    const diff = regions.filter(r => sliceIn(S0, r[0], r[1]) !== sliceIn(M0, r[0], r[1])).map(r => r[0]);
    ok("stripped, ADDFLOW / DRILLROWS / DRILLDAYS / DRILLSAVE / RETRWEEK are byte-identical to origin/main's (stripped the same way)", diff.length === 0, diff);
    ok("stripped, ceOpenAdd / ceRenderAddSheet / ceAddSave / drPlanWrite / retrLiveQueue are byte-identical to origin/main's", ["ceOpenAdd", "ceRenderAddSheet", "ceAddSave", "drPlanWrite", "retrLiveQueue"].every(n => fnIn(S0, n) === fnIn(M0, n)));
  } else console.log("  (origin/main not readable here — compare skipped)");
  // Without the feature, step 1 draws exactly what it drew before; with it, the same plus the one choice row.
  const a = world({}, S0), b = world({});
  a.run = c => vm.runInContext(c, a); b.run = c => vm.runInContext(c, b);
  a.run("ceOpenAdd('kida')"); b.run("ceOpenAdd('kida')");
  const row = '<div class="ce-chips da-choice" style="margin-bottom:6px"><div class="ce-chip sel" onclick="daChoose(false)">A subject</div><div class="ce-chip" onclick="daChoose(true)">\u{1F0CF} Card practice</div></div>';
  ok("step 1 with the feature = step 1 without it + the choice row (nothing else differs)", b.html().replace(row, "") === a.html() && b.html().indexOf(row) > 0, b.html().slice(0, 600));
}

console.log("1. daKindsFrom — can run, by data");
{
  const w = world();
  const K = i => w.daKindsFrom(i).map(x => x.kind + (x.ok ? "" : ":" + x.why)).join(" ");
  ok("cards + a Match deck + a ladder → all four, fixed order", K({ cards: 9, matchDecks: 1, ladder: true }) === "drill match sprint recheck");
  ok("no ladder → Sprint and Re-checks are not listed (§7)", K({ cards: 9, matchDecks: 1, ladder: false }) === "drill match");
  ok("no cards at all → Drill and Match greyed: needs cards", K({ cards: 0, matchDecks: 0, ladder: false }) === "drill:cards match:cards");
  ok("cards but no deck Match can play → Match greyed: needs a deck", K({ cards: 3, matchDecks: 0, ladder: false }) === "drill match:deck");
  ok("a ladder still lists Sprint / Re-checks with no cards (the ladder is what they run)", K({ cards: 0, matchDecks: 0, ladder: true }) === "drill:cards match:cards sprint recheck");
  ok("a kind already on the week is left out", K({ has: { drill: true, sprint: true }, cards: 9, matchDecks: 2, ladder: true }) === "match recheck");
  ok("every kind on → nothing to list", K({ has: { drill: true, match: true, sprint: true, recheck: true }, cards: 9, matchDecks: 2, ladder: true }) === "");
  ok("an old-style drills subject running → no Daily Drill", K({ old: "Drills", cards: 9, matchDecks: 1, ladder: false }) === "match");
  ok("…not even greyed", K({ old: "Drills", cards: 0, matchDecks: 0, ladder: false }) === "match:cards");
  ok("nothing known → greyed Drill / Match only", K(undefined) === "drill:cards match:cards");
}

console.log("2. the data readers");
{
  const items = { kida: [card("Math", "active"), card("Math", "introduction"), card("Math", "parked"), card("Math", "retired"), card("Big ideas", "active", { kt: "concept" }), card("Owned", "active", { id: "own1" })] };
  const w = world({ items, owned: { kida: ["own1"] } });
  ok("active + being introduced count; parked, retired, concept and study-held do not", w.daCardCount("kida") === 2, w.daCardCount("kida"));
  ok("a child with no cards → 0", w.daCardCount("kidb") === 0);
  ok("object-shaped card lists count too", world({ items: { kidb: { a: card("X"), b: card("X", "parked") } } }).daCardCount("kidb") === 1);
  const m = world({ items: { kida: deck("Math", 4).concat(deck("Words", 3)), kidb: deck("Colors", 5, "introduction") }, masteryKid: "kidz" });
  ok("Match decks = the game's own list (4+ playable in a deck)", m.daMatchDeckCount("kida") === 1 && m.daMatchDeckCount("kidb") === 1);
  ok("…read for that child (masteryKid swapped) and put back after", m.seenKids.every(k => k === "kida" || k === "kidb") && m.masteryKid === "kidz");
  const p = world({ items: { kida: deck("Math", 4).map(c => Object.assign(c, { dir: "prod" })) } });
  ok("cards Match can't play (production-only) → no deck", p.daMatchDeckCount("kida") === 0);
  const sub = (x) => Object.assign({ display: "Drills", tracking: "daily" }, x);
  const D = subs => world({ subjects: { kidb: subs } }).daOldDrills("kidb");
  ok("§5.1: drills, every day, not paused, no study link → its name", D({ drills: sub() }) === "Drills");
  ok("…drills_x counts", D({ drills_l: sub({ display: "Fact drills" }) }) === "Fact drills");
  ok("…paused → no", D({ drills: sub({ paused: true }) }) === "");
  ok("…a study link → no (it opens that study)", D({ drills: sub({ study: "s1" }) }) === "");
  ok("…not every-day tracking → no", D({ drills: sub({ tracking: "sequenced" }) }) === "");
  ok("…drillsheet is not a drills subject", D({ drillsheet: sub() }) === "");
  ok("…no subjects → no", D({}) === "");
}

console.log("3. room and placement are drDaysMap's");
{
  const w = world();
  // DRILLTHREE (her pick 2026-11-22 "Allow three"): a day is full with THREE other kinds (week, week2, week3)
  let r = w.daRoom(wk("sprint", "match", "off", "drill", "off"), { mon: "recheck", wed: "sprint" }, "drill", { mon: "match", tue: "recheck" });
  ok("a day with three other kinds is full (names them); a free slot or the kind itself = room", r.mon.join() === "sprint,recheck,match" && r.tue === true && r.wed === true && r.thu === true && r.fri === true, r);
  let p = clone(w.daPlan(wk("sprint", "match", "off", "off", "off"), { mon: "recheck" }, "drill", DAYS, { mon: "match" }));
  ok("daPlan places on every day with room, refuses the full one", J(p.on) === J(["tue", "wed", "thu", "fri"]) && J(p.full) === J(["mon"]) && p.changed, p);
  ok("…week = all five days, the free first slot used first; week2 takes the second", J(p.week) === J(wk("sprint", "match", "drill", "drill", "drill")) && J(p.week2) === J({ mon: "recheck", tue: "drill" }), p);
  p = clone(w.daPlan({}, {}, "match", ["mon", "wed"]));
  ok("nothing saved → the whole row, off stored as \"off\"", J(p.week) === J(wk("match", "off", "match", "off", "off")) && J(p.week2) === "{}", p);
  p = clone(w.daPlan(wk("drill", "off", "off", "off", "off"), {}, "drill", ["mon"]));
  ok("already there → not changed", p.changed === false && J(p.on) === J(["mon"]), p);
  const a = wk("sprint", "off", "off", "off", "off"), b = { mon: "match" }, a0 = J(a), b0 = J(b);
  w.daPlan(a, b, "drill", DAYS); w.daRoom(a, b, "drill");
  ok("pure: the inputs are not changed", J(a) === a0 && J(b) === b0);
  // random: daPlan = drDaysMap applied day by day; daRoom = drDaysMap's own answer
  const KS = ["drill", "match", "sprint", "recheck", "off"], pick = x => x[Math.floor(Math.random() * x.length)];
  let bad = 0, n = 0;
  for (let i = 0; i < 600; i++) {
    const w1 = {}, w2 = {}, w3 = {}; DAYS.forEach(d => { if (Math.random() < .9) w1[d] = pick(KS); if (Math.random() < .5) w2[d] = pick(KS); if (Math.random() < .5) w3[d] = pick(KS); });   // DRILLTHREE: + w3
    const kind = pick(KS.slice(0, 4)), days = DAYS.filter(() => Math.random() < .7);
    const room = w.daRoom(w1, w2, kind, w3), plan = w.daPlan(w1, w2, kind, days, w3);
    let A = w1, B = w2, C = w3; const on = [];
    days.forEach(d => { const r = w.drDaysMap(A, B, d, kind, true, C); if (r.ok) { A = r.week; B = r.week2; C = r.week3; on.push(d); } });
    const ref = w.drDaysMap(A, B, "", kind, true, C);
    n++;
    if (J(plan.week) !== J(ref.week) || J(plan.week2) !== J(ref.week2) || J(plan.week3) !== J(ref.week3) || J(plan.on) !== J(on)) bad++;
    if (DAYS.some(d => (room[d] === true) !== w.drDaysMap(w1, w2, d, kind, true, w3).ok)) bad++;
    DAYS.forEach(d => { const ks = [plan.week[d], plan.week2[d], plan.week3[d]].filter(k => k && k !== "off"); if (new Set(ks).size !== ks.length) bad++; });
    if (plan.on.some(d => plan.week[d] !== kind && plan.week2[d] !== kind && plan.week3[d] !== kind)) bad++;
  }
  ok("600 random plans: daPlan = drDaysMap tap by tap, daRoom = drDaysMap's answer, never a duplicate, the kind on every placed day", bad === 0, { bad, n });
}

console.log("4. what Mom sees");
{
  const items = { kida: deck("Math", 6), kidb: deck("Colors", 2) };
  const w = world({ items, plan: { kida: { week: wk("sprint", "off", "sprint", "match", "recheck"), week2: { mon: "match" }, week3: { mon: "recheck" } } } });   // DRILLTHREE: Mon full = three kinds
  w.run = c => vm.runInContext(c, w);
  w.run("ceOpenAdd('kida')");
  const s1 = w.html();
  ok("＋ Add subject opens on step 1 with A subject · 🃏 Card practice at the top", /What is it\?/.test(s1) && s1.indexOf("da-choice") > 0 && s1.indexOf("da-choice") < s1.indexOf("What is it called?") && /class="ce-chip sel" onclick="daChoose\(false\)">A subject</.test(s1) && /onclick="daChoose\(true\)">\u{1F0CF} Card practice</u.test(s1));
  w.run("daChoose(true)");
  const h = w.html();
  ok("Card practice swaps the form: title, the child, the choice with Card practice picked", /class="ce-sheet-title">Card practice</.test(h) && /New for Kid A/.test(h) && /class="ce-chip sel" onclick="daChoose\(true\)"/.test(h));
  ok("no name, device, minutes or tracking to fill in", !/ce-add-name|<input|<textarea|ce-stepper|What kind\?|device|Starts at/.test(h));
  ok("kinds this child can run and doesn't have: Daily Drill (picked first), Re-checks is on already, Sprint / Match too", J(kindsIn(h)) === J(["drill*"]), kindsIn(h));
  ok("…each with its one line and minutes", /You show the cards, Kid A answers\. About 5 min\./.test(h));
  ok("Mon–Fri pre-lit on every day with room; Monday (Sprint + Match + Re-checks) is full and named", J(litIn(h)) === J(["tue", "wed", "thu", "fri"]) && J(fullIn(h)) === J(["Mon"]) && /Monday is full: \u{1F3C3} Sprint, \u{1F3AF} Match &amp; Play and \u{1F4C5} Sprint Re-checks\./u.test(h), { lit: litIn(h), full: fullIn(h) });
  ok("Save and Cancel", /onclick="daSave\(\)">Save</.test(h) && /onclick="daClose\(\)">Cancel</.test(h));
  ok("the backdrop closes it; the sheet keeps the class afMount re-opens in place", /<div class="ce-sheet" onclick="if\(event\.target===this\)daClose\(\)">/.test(h));
  w.run("daToggleDay('wed')");
  ok("a day tap leaves it out (nothing saved)", J(litIn(w.html())) === J(["tue", "thu", "fri"]) && w.writes.length === 0);
  w.run("daToggleDay('mon')");
  ok("a full day can't be lit", J(litIn(w.html())) === J(["tue", "thu", "fri"]));
  w.run("daToggleDay('wed')");
  ok("…and back on", J(litIn(w.html())) === J(["tue", "wed", "thu", "fri"]));
  w.run("daChoose(false)");
  ok("A subject → back to step 1 of the subject form", /What is it\?/.test(w.html()) && w.__da().on === false && w.__da().af === 1);

  const b = world({ items: { kidb: deck("Colors", 2) } }); b.run = c => vm.runInContext(c, b);
  b.run("ceOpenAdd('kidb');daChoose(true)");
  const hb = b.html();
  ok("no ladder: no Sprint / Re-checks; cards but no Match deck → Match greyed with the reason and the door", J(kindsIn(hb)) === J(["drill*"]) && greyIn(hb).length === 1 && /\u{1F3AF} Match &amp; Play — Needs 4 or more cards in one deck first — /u.test(hb) && /onclick="daCards\('kidb'\)"[^>]*>add cards →</.test(hb), { k: kindsIn(hb), g: greyIn(hb) });
  ok("nothing saved yet → all five days lit", J(litIn(hb)) === J(DAYS));
  b.run("daPickKind('match')");
  ok("a greyed kind can't be picked (the form keeps a kind that runs)", b.__da().kind === "match" && J(kindsIn(b.html())) === J(["drill*"]));

  const e = world(); e.run = c => vm.runInContext(c, e);
  e.run("ceOpenAdd('kidb');daChoose(true)");
  const he = e.html();
  ok("no cards at all: Drill and Match greyed \"Needs cards first — add cards →\"; no day buttons, no Save", greyIn(he).length === 2 && (he.match(/Needs cards first — <a[^>]*onclick="daCards\('kidb'\)"[^>]*>add cards →<\/a>/g) || []).length === 2 && !/da-day/.test(he) && !/daSave/.test(he), he);

  const o = world({ items: { kidb: deck("Colors", 6) }, subjects: { kidb: { drills: { display: "Drills", tracking: "daily" } } } }); o.run = c => vm.runInContext(c, o);
  o.run("ceOpenAdd('kidb');daChoose(true)");
  const ho = o.html();
  ok("old-style Drills subject running → Daily Drill not offered, one plain line says why", J(kindsIn(ho)) === J(["match*"]) && /“Drills” already runs every day as a subject, so \u{1F0CF} Daily Drill isn’t offered here — that would put two drill cards on a day\./u.test(ho), kindsIn(ho));
  ok("…and no switch offer (that is slice 7)", !/[Ss]witch/.test(ho));

  const f = world({ items: { kidb: deck("Colors", 6) }, plan: { kidb: { week: wk("drill", "drill", "drill", "drill", "drill"), week2: wk("match", "match", "match", "match", "match") } } }); f.run = c => vm.runInContext(c, f);
  f.run("ceOpenAdd('kidb');daChoose(true)");
  ok("every kind it can run already on → says so, no Save", /Every kind of card practice Kid B can run is already on the week/.test(f.html()) && !/daSave/.test(f.html()));

  const g = world({ items: { kida: deck("Math", 6) }, plan: { kida: { week: wk("sprint", "sprint", "sprint", "sprint", "sprint"), week2: wk("match", "match", "match", "match", "match"), week3: wk("recheck", "recheck", "recheck", "recheck", "recheck") } } }); g.run = c => vm.runInContext(c, g);   // DRILLTHREE: three a day = full
  g.run("ceOpenAdd('kida');daChoose(true)");
  const hg = g.html();
  ok("every day full → one line, Save can't be used", J(litIn(hg)) === "[]" && fullIn(hg).length === 5 && /Every day already has its practice cards/.test(hg) && /onclick="daSave\(\)" disabled/.test(hg));
  ok("…Save there writes nothing", g.daSave() === false && g.writes.length === 0);

  ok("phone width: no fixed widths in the form; chips wrap", !/(?:^|[;"])(?:min-)?width:\s*\d{3,}px/.test(h) && /white-space:normal/.test(h));
}

console.log("5. Save");
{
  const plan = { kida: { settings: { gate_pct: 80 }, week: wk("sprint", "off", "sprint", "match", "recheck"), week2: { mon: "match" } } };
  const w = world({ items: { kida: deck("Math", 6) }, plan }); w.run = c => vm.runInContext(c, w);
  w.__setAdmin({ kid: "kida", week: wk("off", "off", "off", "off", "off") });
  w.run("ceOpenAdd('kida');daChoose(true);daToggleDay('fri');daToggleDay('mon')");   // DRILLTHREE: Mon (two kinds) has room now — left out here, so this stays the two-row save
  ok("nothing written while she picks", w.writes.length === 0 && w.sets.length === 0 && w.queued.length === 0);
  ok("Save → true", w.daSave() === true);
  ok("one targeted update() at mastery/retrievalPlan/kida; no set() / remove()", w.writes.length === 1 && w.writes[0].p === "mastery/retrievalPlan/kida" && w.sets.length === 0, w.writes);
  const v = w.writes[0].v;
  ok("payload is exactly {week, week2} — never settings", J(Object.keys(v).sort()) === J(["week", "week2"]), v);
  ok("week = the whole row, Drill in the free first slot (Tue); week2 takes it beside the others (Wed, Thu); Fri left out", J(v.week) === J(wk("sprint", "drill", "sprint", "match", "recheck")) && J(v.week2) === J({ mon: "match", wed: "drill", thu: "drill" }), v);
  ok("the stored plan mirrors it; settings untouched", J(w.masteryData.retrievalPlan.kida.week) === J(v.week) && w.masteryData.retrievalPlan.kida.settings.gate_pct === 80);
  ok("the live pass is queued for that child", J(w.queued) === J(["kida"]));
  ok("the Mastery panel's copy for that child is dropped (stale-copy trap)", w.__admin() === null);
  ok("the sheet closes and the page repaints", w.closes.length === 1 && w.__da().on === false && w.__da().af === 0 && w.renders.length >= 1);
  ok("toast names the kind, the child and the days", w.toasts.length === 1 && /✓ \u{1F0CF} Daily Drill is on Kid A’s week — Tue Wed Thu\. This week’s cards update in a moment\./u.test(w.toasts[0]), w.toasts);
  ok("the builder now makes Drill on those days (its own reader)", ["tue", "wed", "thu"].every(d => w.retrDayKinds("kida", d).indexOf("drill") >= 0) && w.retrDayKinds("kida", "fri").indexOf("drill") < 0 && w.retrDayKinds("kida", "mon").length === 2);
  ok("…and the purple strip shows the new line", /drDaysOpen\('kida','drill'\)"[^>]*>\u{1F0CF} Daily Drill · Tue Wed Thu/u.test(w.drStripChips("kida")), w.drStripChips("kida"));

  const n = world({ items: { kidb: deck("Colors", 6) } }); n.run = c => vm.runInContext(c, n);
  n.run("ceOpenAdd('kidb');daChoose(true);daPickKind('match')");
  ok("a no-ladder child with nothing saved: Match Mon–Fri", n.daSave() === true && J(n.writes[0].v) === J({ week: wk("match", "match", "match", "match", "match"), week2: {} }), n.writes);
  ok("…the child is now in the rhythm (RETRFAM's rule)", n.retrOn("kidb") === true);

  const d = world({ items: { kida: deck("Math", 6) }, defaults: { kida: wk("sprint", "match", "sprint", "match", "recheck") } }); d.run = c => vm.runInContext(c, d);
  d.run("ceOpenAdd('kida');daChoose(true)");
  ok("a child on the built-in starting days: Save writes the whole row as the builder reads it, plus Drill", d.daSave() === true && J(d.writes[0].v) === J({ week: wk("sprint", "match", "sprint", "match", "recheck"), week2: wk("drill", "drill", "drill", "drill", "drill") }), d.writes);

  const z = world({ items: { kida: deck("Math", 6) } }); z.run = c => vm.runInContext(c, z);
  z.run("ceOpenAdd('kida');daChoose(true);['mon','tue','wed','thu','fri'].forEach(daToggleDay)");
  ok("no day lit → not saved, says why", z.daSave() === false && z.writes.length === 0 && /Pick at least one day\./.test(z.html()));
  ok("Save off the Card practice form does nothing", (() => { const q = world({ items: { kida: deck("Math", 6) } }); vm.runInContext("ceOpenAdd('kida')", q); return q.daSave() === false && q.writes.length === 0; })());
}

console.log("6. Mom only; dry run");
{
  const w = world({ mom: false, items: { kida: deck("Math", 6) } }); w.run = c => vm.runInContext(c, w);
  w.run("ceOpenAdd('kida')");
  ok("not Mom → no Card practice choice on step 1", !/da-choice/.test(w.html()));
  ok("…daOpen / daChoose refuse", w.daOpen("kida") === false && w.run("daChoose(true)") === false && w.__da().on === false);
  w.run("daOn=true;ceAddKid='kida'");
  ok("…Save refuses, nothing written", w.daSave() === false && w.writes.length === 0 && w.queued.length === 0);
  const d = world({ dry: true, items: { kida: deck("Math", 6) } }); d.run = c => vm.runInContext(c, d);
  d.run("ceOpenAdd('kida');daChoose(true)");
  ok("?dryrun=1 → Save mirrors locally, sends nothing to the database", d.daSave() === true && d.writes.length === 0 && d.sets.length === 0);
  const nd = world({ db: false, items: { kida: deck("Math", 6) } }); nd.run = c => vm.runInContext(c, nd);
  nd.run("ceOpenAdd('kida');daChoose(true)");
  ok("no database → nothing sent", nd.daSave() === true && nd.writes.length === 0);
}

console.log("7. the doors");
{
  const w = world({ items: { kida: deck("Math", 6) } }); w.run = c => vm.runInContext(c, w);
  const chips = w.drStripChips("kida");
  ok("the empty-state chip opens Card practice", /class="dr-empty" onclick="daOpen\('kida'\)"/.test(chips), chips);
  ok("daOpen → the Add sheet on Card practice for that child", w.daOpen("kida") === true && w.__da().on === true && w.__da().kid === "kida" && /class="ce-sheet-title">Card practice</.test(w.html()));
  ok("…closing it and opening ＋ Add subject again starts on a subject (the form is reset)", (w.run("daClose()"), w.run("ceOpenAdd('kida')"), w.__da().on === false && /What is it\?/.test(w.html())));
  const g = world(); g.run = c => vm.runInContext(c, g);
  g.run("ceOpenAdd('kidb');daChoose(true);daCards('kidb')");
  ok("add cards → Mastery on that child, the 🃏 Cards view; the sheet closed; nothing written", g.mhqKid === "kidb" && g.mhqView === "cards" && J(g.nav) === '["mhq"]' && g.__da().on === false && g.writes.length === 0);
  const h = world({ items: { kida: deck("Math", 6), kidb: deck("Colors", 6) }, plan: { kida: { week: wk("drill", "off", "off", "off", "off") } } });
  ok("a child with a running line keeps its line; the strip shows no empty chip (unchanged)", !/dr-empty/.test(h.drStripChips("kida")) && /dr-row/.test(h.drStripChips("kida")));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
