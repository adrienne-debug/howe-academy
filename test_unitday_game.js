// 🎲 UNITDAY_GAME — a Game on a unit day (her words 2026-11-11: "use those to build what she's envisioning please" — Sara's games
//   worksheet 2026-11-11: something we all do together, off-screen, rules on the day card, a timer for minute-to-win-it, a scoreboard,
//   one game per day, "just for fun", the option of a notebook page too).
//   Runs the REAL UNITTRACK + CRAFT + DAYCARD + UTADDACT + UNITDAY_EXTRAS + UNITDAY_GAME blocks (and LESSONRES's cleaners) against a
//   fake db that records paths.
//   · the block exists; Save the game writes exactly …/track/days/<i>/game (one set) — plus UTADDACT's activity paths only when
//     "Also a notebook page" is on (one multi-path update); no whole-node set; Mom-only; dry-run inert; no bankDirect anywhere
//   · the day card draws title, ⏱ minutes · 👥 players, the steps, the supplies; the timer only when timer is set, the scoreboard
//     only when score is on (one row per present kid, names from KID_NAME); a day without a game draws byte-identical
//   · the timer's pure tick counts down and stops at zero; the scoreboard's pure steps add / subtract / clear
//   · utResOf (Sunday list / Family group / kids' bring line) and the Days table cell include the game's supplies
//   run: node test_unitday_game.js
const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const UT = cut("// UNITTRACK_START", "// UNITTRACK_END"), CR = cut("// CRAFT_START", "// CRAFT_END"), DC = cut("// DAYCARD_START", "// DAYCARD_END");
const UA = cut("// UTADDACT_START", "// UTADDACT_END"), UX = cut("// UNITDAY_EXTRAS_START", "// UNITDAY_EXTRAS_END");
const GM = cut("// UNITDAY_GAME_START", "// UNITDAY_GAME_END");
const LR = "const LR_PARTS=[\"links\",\"supplies\",\"books\",\"orders\",\"notes\"];\n" + ["lrSafeUrl", "lrList", "lrStr", "lrDate", "lrClean", "lrHost"].map(fn).join("\n");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);
const sha = s => crypto.createHash("sha256").update(String(s)).digest("hex");
const visible = h => h.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const LEAF = { title: "Leaf-blowing race", how: [{ text: "Line up at the start" }, { text: "Blow your leaf with a straw" }, { text: "First across the line wins" }],
  supplies: [{ name: "straws", qty: "4" }, { name: "leaves" }, { name: "tape", kids: false }], minutes: 15, players: "everyone", timer: null, score: true, alsoNotebook: false };
const MINUTE = { title: "Minute to win it: cup stack", how: [{ text: "Stack the cups into a tower" }, { text: "Beat the clock" }], supplies: [{ name: "cups", qty: "10" }], minutes: 10, players: "one at a time", timer: 60, score: false };
const UNIT = () => ({ id: "fall", title: "Fall", emoji: "🍂", decks: [],
  activities: [{ key: "gratitude_hunt", title: "Gratitude hunt", emoji: "🎨", kind: "sheet", points: 5, day: 3 }],
  track: { mode: "seq", perWeek: 4, days: [
    { id: "d1", n: 1, t: "Leaves change", res: { books: [{ title: "Leaf Man" }], supplies: [{ name: "paper", qty: "2" }] },
      craft: { title: "Leaf rubbing", steps: [{ text: "Lay the leaf" }, { text: "Rub with a crayon" }], supplies: [{ name: "crayons" }] },
      snack: { title: "Apple slices", supplies: [{ name: "apples", qty: "3" }] }, note: "Go outside first." },
    { id: "d2", n: 2, t: "Why leaves fall", game: LEAF },
    { id: "d3", n: 3, t: "Thankful", nb: { activity: "gratitude_hunt" } }] } });
function world(o) {
  o = o || {}; const writes = [], intervals = [], chimes = [], unlocks = []; const dom = o.dom || {};
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, Promise, Error, parseInt, isNaN, isFinite, WeakMap, URL,
    unitStudies: { fall: o.unit || UNIT() }, momHere: () => o.mom !== false, _dryRun: () => !!o.dry,
    KID_NAME: { k1: "Ada", k2: "Ben" },
    db: { ref: p => ({ set: v => writes.push(["set", p === undefined ? "" : p, JSON.parse(J(v === undefined ? null : v))]), update: v => writes.push(["update", p === undefined ? "" : p, JSON.parse(J(v))]) }) },
    renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0, confirm: () => true,
    document: { getElementById: id => (id in dom) ? dom[id] : null },
    setInterval: f => { intervals.push(f); return intervals.length; }, clearInterval: () => {},
    bbChime: () => chimes.push(1), bbAudioUnlock: () => unlocks.push(1),
    bankDirect: () => { throw new Error("bankDirect called"); } };
  vm.createContext(ctx);
  vm.runInContext(LR + "\n" + UT + "\n" + CR + "\n" + DC + "\n" + UA + "\n" + UX + "\n" + (o.noGame ? "" : GM), ctx);
  return { ctx, writes, dom, intervals, chimes, unlocks };
}
const G = (c, id, present) => { const u = c.unitStudies.fall; return { day: c.utRef("fall", c.utDay(u, id)), u: u, first: null, present: present || [] }; };
const P_GAME = i => "unitStudies/fall/track/days/" + i + "/game";

console.log("── the block ──");
ok("UNITDAY_GAME is a marked block; its hooks sit in utClean, utResOf, utCellList, the Days row, the day editor and the day card",
  GM.length > 4000 && /ugmCleanInto\(day,d\)/.test(UT) && /ugmSupplies\(d\)/.test(UT) && /ugmSupplyCells\(d\)/.test(UT) && /ugmRowBadge\(d\)/.test(UT) && /ugmEditorHTML\(u,d\)/.test(UT) && /uxSnackCardHTML\(g\); if\(typeof ugmCardHTML==="function"\) h\+=ugmCardHTML\(g\);/.test(DC));
{
  const refs = GM.match(/db\.ref\([^)]*\)\.[a-z]+\(/g) || [];
  ok("the block's db calls are exactly two: …/track/days/<k>/game .set, and one multi-path .update (the notebook toggle)", refs.length === 2 && refs.some(r => /^db\.ref\(base\+"\/game"\)\.set\($/.test(r)) && refs.some(r => /^db\.ref\(\)\.update\($/.test(r)), refs);
  ok("no whole-unit / whole-track / whole-days / activities-list set; no listener", !/ref\("unitStudies\/"\+uid\)|\/track"\)|\/track\/days"\)|\/activities"\)|\.on\(|addEventListener/.test(GM));
  ok("the update carries only …/game, …/activities/<i>, and …/nb", /upd\[base\+"\/game"\]=g; upd\["unitStudies\/"\+uid\+"\/activities\/"\+ai\]=act; if\(nb\) upd\[base\+"\/nb"\]=\{activity:act\.key\};/.test(GM) && (GM.match(/upd\[/g) || []).length === 3);
  ok("writes go through db only when db && !_dryRun; Mom-only on the writer and the editor", /function ugmLive\(\)\{ return !!\(typeof db!=="undefined"&&db\)&&!\(\(typeof _dryRun==="function"\)&&_dryRun\(\)\); \}/.test(GM) && /function ugmSave\(uid,dayId,value\)\{\n  if\(!ugmMom\(\)/.test(GM) && /function ugmEditorHTML\(u,d\)\{\n  if\(!ugmMom\(\)/.test(GM));
  ok("no points: no bankDirect (or any bank/award call) anywhere in the block's code", !/bankDirect|bankPts|awardPoints|addPoints/.test(GM.replace(/^\s*\/\/.*$/mg, "")) && /\bbankDirect\b/.test(src));
  ok("no 🔀 in the block; no kid's name", GM.indexOf("\u{1F500}") < 0 && !/Lincoln|Ellis|Lucy|Julian|Sara\b(?![,'’ ])/.test(GM.replace(/^\/\/.*$/mg, "")));
  ok("nothing autoplays: the interval starts only inside ugmStart (a tap), which unlocks sound first", (GM.match(/setInterval\(/g) || []).length === 1 && /function ugmStart\(key\)\{\n  if\(typeof bbAudioUnlock==="function"\) bbAudioUnlock\(\);[\s\S]*?setInterval\(ugmLoop,250\)/.test(GM));
  ok("the zero flash is under prefers-reduced-motion: no-preference only", /@media \(prefers-reduced-motion: no-preference\)\{\.ugm-zero\{animation:/.test(GM) && (GM.match(/animation:/g) || []).length === 1);
}

console.log("\n── the shape, cleaned ──");
{
  const c = world().ctx, d2 = c.utDay(c.unitStudies.fall, "d2");
  ok("utClean keeps day.game (supplies get kids, | mom → kids:false; timer null left out; score kept)", J(d2.game) === J({ title: "Leaf-blowing race", how: LEAF.how, supplies: [{ name: "straws", kids: true, qty: "4" }, { name: "leaves", kids: true }, { name: "tape", kids: false }], minutes: 15, players: "everyone", score: true }), d2.game);
  ok("unknown players dropped; bad minutes/timer dropped; a game with no name and no steps is no game",
    J(c.ugmClean({ title: "X", players: "cats", minutes: "abc", timer: -5 })) === J({ title: "X" }) && c.ugmClean({ supplies: [{ name: "a" }] }) === null && c.ugmClean(null) === null);
  ok("a prize field (future) is not kept — nothing built for it", !("prize" in c.ugmClean({ title: "X", prize: "candy" })));
}

console.log("\n── a day without a game is unchanged ──");
{
  const a = world({ noGame: true }).ctx, b = world().ctx; const ua = a.unitStudies.fall, ub = b.unitStudies.fall;
  ok("utClean: Day 1 cleans byte-identical with and without the block", J(a.utDay(ua, "d1")) === J(b.utDay(ub, "d1")));
  const ha = sha(a.dcDayHTML(G(a, "d1", ["k1", "k2"]))), hb = sha(b.dcDayHTML(G(b, "d1", ["k1", "k2"])));
  ok("the day card for Day 1 (craft + snack, no game) hashes the same with and without the block", ha === hb, [ha, hb]);
  ok("the Days table row for Day 1 is byte-identical; utResOf for Day 1 is identical", a.utRowHTML(ua, a.utDay(ua, "d1"), false) === b.utRowHTML(ub, b.utDay(ub, "d1"), false) && J(a.utResOf([a.utDay(ua, "d1")])) === J(b.utResOf([b.utDay(ub, "d1")])));
  ok("no 🎲 Game section on Day 1's card", !/\u{1F3B2} Game/u.test(b.dcDayHTML(G(b, "d1"))) && b.ugmCardHTML(G(b, "d1")) === "");
}

console.log("\n── the day card ──");
{
  const c = world().ctx; const h = c.dcDayHTML(G(c, "d2", ["k1", "k2", "k1"])), v = visible(h);
  ok("draws 🎲 Game with the title, \"⏱ 15 min · 👥 Everyone together\", the steps as a numbered list, the supplies",
    /\u{1F3B2} Game/u.test(h) && /Leaf-blowing race/.test(v) && /⏱ 15 min · \u{1F465} Everyone together/u.test(v) && /<ol[^>]*>\s*<li[^>]*>Line up at the start<\/li><li[^>]*>Blow your leaf with a straw<\/li><li[^>]*>First across the line wins<\/li><\/ol>/.test(h) && /\u{1F392} 4 straws · leaves · tape/u.test(v), v);
  ok("no timer on a game without one", !/data-ugm-timer/.test(h) && !/ugmStart\(/.test(h));
  ok("the scoreboard: one row per present kid (deduped), names from KID_NAME, +1 / −1, a tally, a Clear link",
    /data-ugm-score/.test(h) && (h.match(/data-ugm-row=/g) || []).length === 2 && /Ada/.test(v) && /Ben/.test(v) && (h.match(/ugmScore\('fall\|d2','k1',1\)/g) || []).length === 1 && (h.match(/ugmScore\('fall\|d2','k1',-1\)/g) || []).length === 1 && /ugmScoreReset\('fall\|d2'\)/.test(h) && />Clear</.test(h));
  ok("the game draws after 🍎 Snack's place (after ✂️ Craft) and before the note", h.indexOf("\u{1F3B2} Game") > 0);
  const u = c.unitStudies.fall; c.utWrite("fall", "d1", "note", "Go outside first.");
  c.utTrack(u).days[0].game = MINUTE; c.utTouched(u);
  const h1 = c.dcDayHTML(G(c, "d1", ["k1"])), v1 = visible(h1);
  ok("on Day 1 the game comes after the craft and the snack, before the note", h1.indexOf("✂️ Craft") < h1.indexOf("\u{1F34E} Snack") && h1.indexOf("\u{1F34E} Snack") < h1.indexOf("\u{1F3B2} Game") && h1.indexOf("\u{1F3B2} Game") < h1.indexOf("\u{1F4DD} Note"));
  ok("a 60-second game shows the timer (1:00, ▶ Start, ↺ Reset) and no scoreboard", /data-ugm-timer/.test(h1) && /⏱ Timer · 1:00/u.test(v1) && />1:00</.test(h1) && /ugmStart\('fall\|d1'\)/.test(h1) && /ugmReset\('fall\|d1'\)/.test(h1) && !/data-ugm-score/.test(h1));
  ok("\"one at a time\" reads as One at a time", /⏱ 10 min · \u{1F465} One at a time/u.test(v1));
  ok("no URL, no points, no stars on the game", !/⭐|points?\b/i.test(visible(c.ugmCardHTML(G(c, "d1", ["k1"])))));
}

console.log("\n── the timer ──");
{
  const c = world().ctx;
  let st = c.ugmTimerNew(60);
  ok("a new timer: 60 left, not running", st.left === 60 && st.running === false && st.done === false);
  st = c.ugmStartSt(st, 1000);
  ok("Start: running, ends 60 s from now", st.running === true && st.endAt === 61000);
  ok("tick counts down (1.5 s → 59, 30 s → 30)", c.ugmTick(st, 2500).left === 59 && c.ugmTick(st, 31000).left === 30);
  const z = c.ugmTick(st, 61000), past = c.ugmTick(st, 99000);
  ok("…and stops at zero: left 0, not running, done (never below zero)", z.left === 0 && z.running === false && z.done === true && past.left === 0 && past.running === false);
  ok("a stopped timer doesn't tick", c.ugmTick(z, 200000) === z);
  const p = c.ugmPauseSt(st, 21000);
  ok("Pause keeps what's left (40) and stops; Start again picks up from 40", p.left === 40 && p.running === false && c.ugmStartSt(p, 50000).endAt === 90000);
  ok("Reset → full time, stopped", J(c.ugmResetSt(z)) === J({ total: 60, left: 60, endAt: 0, running: false, done: false }));
  ok("Start after zero runs a fresh round", c.ugmStartSt(z, 0).left === 60);
  ok("mm:ss", c.ugmFmt(60) === "1:00" && c.ugmFmt(5) === "0:05" && c.ugmFmt(125) === "2:05" && c.ugmFmt(-3) === "0:00");
}
{
  const box = { innerHTML: "" }; const w = world({ dom: { "ugm-timer-fall-d2": box } }), c = w.ctx;
  c.utTrack(c.unitStudies.fall).days[1].game = Object.assign({}, LEAF, { timer: 30 }); c.utTouched(c.unitStudies.fall);
  c.ugmCardHTML(G(c, "d2"));
  ok("drawing the card starts nothing (no interval, no sound)", w.intervals.length === 0 && w.chimes.length === 0);
  c.ugmStart("fall|d2");
  ok("Start (a tap) unlocks sound and starts the one interval; the box repaints with ⏸ Pause", w.unlocks.length === 1 && w.intervals.length === 1 && /Pause/.test(box.innerHTML));
  const t = vm.runInContext("ugmTimers", c)["fall|d2"]; t.endAt = Date.now() - 1; w.intervals[0]();
  ok("at zero the chime plays once and the box says Time's up", w.chimes.length === 1 && /Time’s up/.test(box.innerHTML) && />0:00</.test(box.innerHTML));
  w.intervals[0]();
  ok("…and never again for that round", w.chimes.length === 1);
}

console.log("\n── the scoreboard ──");
{
  const c = world().ctx;
  let t = c.ugmScoreAdd({}, "k1", 1); t = c.ugmScoreAdd(t, "k1", 1); t = c.ugmScoreAdd(t, "k2", 1); t = c.ugmScoreAdd(t, "k1", -1);
  ok("add / subtract", t.k1 === 1 && t.k2 === 1);
  ok("never below zero", c.ugmScoreAdd({ k1: 0 }, "k1", -1).k1 === 0);
  ok("pure (the old tally untouched)", (() => { const a = { k1: 2 }; c.ugmScoreAdd(a, "k1", 1); return a.k1 === 2; })());
  ok("clear", J(c.ugmScoreClear()) === "{}");
  const box = { innerHTML: "" }; const w2 = world({ dom: { "ugm-score-fall-d2": box } }), c2 = w2.ctx;
  c2.ugmCardHTML(G(c2, "d2", ["k1", "k2"])); c2.ugmScore("fall|d2", "k2", 1); c2.ugmScore("fall|d2", "k2", 1);
  ok("a tap repaints only the board (no renderAll, no write)", /data-ugm-row="k2"[\s\S]*?>2<\/span>/.test(box.innerHTML) && c2.repaints === 0 && w2.writes.length === 0);
  c2.ugmScoreReset("fall|d2");
  ok("Clear → every tally 0", !/>[1-9]\d*<\/span>/.test(box.innerHTML) && J(vm.runInContext("ugmScores", c2)["fall|d2"]) === "{}");
}

console.log("\n── supplies readers ──");
{
  const c = world().ctx, u = c.unitStudies.fall, d2 = c.utDay(u, "d2");
  const r = c.utResOf([d2]);
  ok("utResOf (the Sunday list / Family group / kids' bring line) carries the game's supplies, tagged game:true, kids flag kept",
    r.supplies.some(s => s.name === "straws" && s.qty === "4" && s.game === true && s.kids === true) && r.supplies.some(s => s.name === "tape" && s.kids === false && s.game === true));
  ok("the Days table's 🎒 Supplies cell lists them as 🎲 …", J(c.utCellList(d2, "supplies")) === J(["\u{1F3B2} 4 straws", "\u{1F3B2} leaves", "\u{1F3B2} tape"]));
  ok("the Days table row badges 🎲", /title="a game"/.test(c.utRowHTML(u, d2, false)));
}

console.log("\n── the writes ──");
const boxes = (k, v) => { const d = {}; Object.keys(v).forEach(x => { d["ugm-" + k + "-" + x] = typeof v[x] === "boolean" ? { checked: v[x], value: "" } : { value: String(v[x]) }; }); return d; };
{
  const dom = boxes("fall-d1", { title: "Leaf-blowing race", how: "Line up\n\nBlow your leaf", sup: "4 straws\ntape | mom", min: "15", players: "teams", timer: "", tcustom: "", score: true, nb: false });
  const w = world({ dom }), c = w.ctx;
  ok("Save the game (toggle off) → ONE set at …/track/days/0/game, the cleaned game, nothing else",
    c.ugmSaveFromBoxes("fall", "d1") === true && J(w.writes) === J([["set", P_GAME(0), { title: "Leaf-blowing race", how: [{ text: "Line up" }, { text: "Blow your leaf" }], supplies: [{ name: "straws", kids: true, qty: "4" }, { name: "tape", kids: false }], minutes: 15, players: "teams", score: true }]]), w.writes);
  ok("…and the day on screen has it", c.utDay(c.unitStudies.fall, "d1").game.players === "teams");
}
{
  const dom = boxes("fall-d2", { title: "Minute to win it", how: "Stack the cups\nBeat the clock", sup: "10 cups", min: "10", players: "one at a time", timer: "custom", tcustom: "45", score: false, nb: false });
  const w = world({ dom }), c = w.ctx; c.ugmSaveFromBoxes("fall", "d2");
  ok("Timer: custom 45 s is saved as timer:45; 60 s from the menu as timer:60", w.writes[0][2].timer === 45 && (() => { w.dom["ugm-fall-d2-timer"].value = "60"; w.writes.length = 0; c.ugmSaveFromBoxes("fall", "d2"); return w.writes[0][2].timer === 60; })(), w.writes);
  w.dom["ugm-fall-d2-timer"].value = ""; w.writes.length = 0; c.ugmSaveFromBoxes("fall", "d2");
  ok("Timer Off → no timer field", !("timer" in w.writes[0][2]));
  w.dom["ugm-fall-d2-title"].value = ""; w.dom["ugm-fall-d2-how"].value = ""; w.writes.length = 0; c.ugmSaveFromBoxes("fall", "d2");
  ok("an emptied game clears it (set null at …/game)", J(w.writes) === J([["set", P_GAME(1), null]]) && !c.utDay(c.unitStudies.fall, "d2").game);
}
{
  const dom = boxes("fall-d1", { title: "Leaf-blowing race", how: "Line up\nBlow your leaf", sup: "", min: "", players: "", timer: "", tcustom: "", score: false, nb: true });
  const w = world({ dom }), c = w.ctx; c.ugmSaveFromBoxes("fall", "d1");
  const want = { key: "leaf_blowing_race", title: "Leaf-blowing race", emoji: "\u{1F3B2}", kind: "sheet", points: 0, day: 1, desc: "Line up · Blow your leaf" };
  ok("toggle on, a day with no activity → ONE update: …/game (with nbKey), …/activities/1 (UTADDACT's next free index), …/track/days/0/nb",
    w.writes.length === 1 && w.writes[0][0] === "update" && w.writes[0][1] === "" && J(Object.keys(w.writes[0][2]).sort()) === J([P_GAME(0), "unitStudies/fall/activities/1", "unitStudies/fall/track/days/0/nb"].sort())
    && J(w.writes[0][2]["unitStudies/fall/activities/1"]) === J(want) && J(w.writes[0][2]["unitStudies/fall/track/days/0/nb"]) === J({ activity: "leaf_blowing_race" })
    && w.writes[0][2][P_GAME(0)].alsoNotebook === true && w.writes[0][2][P_GAME(0)].nbKey === "leaf_blowing_race", w.writes);
  ok("the notebook page: kind sheet, the game's title, the steps joined, no points", want.points === 0);
  w.writes.length = 0; c.ugmSaveFromBoxes("fall", "d1");
  ok("saving again with the toggle still on queues nothing new (one set of …/game only)", J(w.writes.map(x => x[0] + " " + x[1])) === J(["set " + P_GAME(0)]) && c.unitStudies.fall.activities.length === 2, w.writes);
  w.dom["ugm-fall-d1-nb"].checked = false; w.writes.length = 0; c.ugmSaveFromBoxes("fall", "d1");
  ok("toggle off → one set of …/game; the notebook page is left alone (no delete)", J(w.writes.map(x => x[0] + " " + x[1])) === J(["set " + P_GAME(0)]) && c.unitStudies.fall.activities.length === 2 && !w.writes[0][2].alsoNotebook && w.writes[0][2].nbKey === "leaf_blowing_race");
  const ed = c.ugmEditorHTML(c.unitStudies.fall, c.utDay(c.unitStudies.fall, "d1"));
  ok("the editor says where the page is", /On the notebook as “Leaf-blowing race”/.test(ed));
}
{
  const dom = boxes("fall-d3", { title: "Gratitude relay", how: "Run and name a thing you're thankful for", sup: "", min: "", players: "teams", timer: "", tcustom: "", score: true, nb: true });
  const w = world({ dom }), c = w.ctx; c.ugmSaveFromBoxes("fall", "d3");
  ok("toggle on, a day that already names an activity → its nb is never re-pointed (update carries …/game + …/activities/1 only)",
    w.writes.length === 1 && J(Object.keys(w.writes[0][2]).sort()) === J([P_GAME(2), "unitStudies/fall/activities/1"].sort()) && c.utDay(c.unitStudies.fall, "d3").nb.activity === "gratitude_hunt", w.writes);
}
{
  const w = world({ mom: false }), c = w.ctx;
  ok("not Mom → no write, no editor", c.ugmSave("fall", "d2", MINUTE) === false && c.ugmEditorHTML(c.unitStudies.fall, c.utDay(c.unitStudies.fall, "d2")) === "" && w.writes.length === 0);
}
{
  const w = world({ dry: true }), c = w.ctx;
  ok("dry run → the day changes on screen, nothing written", c.ugmSave("fall", "d1", Object.assign({}, MINUTE, { alsoNotebook: true })) === true && w.writes.length === 0 && c.utDay(c.unitStudies.fall, "d1").game.timer === 60);
}

console.log("\n── the editor ──");
{
  const c = world().ctx, u = c.unitStudies.fall;
  const h = c.utEditorHTML(u, c.utDay(u, "d2"));
  ok("the day editor shows 🎲 Game on this day after 🍎 Snack", h.indexOf("Snack on this day") > 0 && h.indexOf("Snack on this day") < h.indexOf("Game on this day"));
  ok("title · How to play · Supplies (| mom) · How long · Players · Timer (Off/30 s/60 s/90 s/2 min/Custom) · Scoreboard · Also a notebook page",
    /id="ugm-fall-d2-title" type="text" value="Leaf-blowing race"/.test(h) && /Line up at the start\nBlow your leaf with a straw\nFirst across the line wins<\/textarea>/.test(h) && /4 straws\nleaves\ntape \| mom<\/textarea>/.test(h)
    && /id="ugm-fall-d2-min" type="number" min="1" value="15"/.test(h) && /<option value="everyone" selected>Everyone together<\/option><option value="teams">Teams<\/option><option value="one at a time">One at a time<\/option>/.test(h)
    && />Off<\/option><option value="30">30 s<\/option><option value="60">60 s<\/option><option value="90">90 s<\/option><option value="120">2 min<\/option><option value="custom">Custom<\/option>/.test(h)
    && /id="ugm-fall-d2-score" type="checkbox" checked/.test(h) && /id="ugm-fall-d2-nb" type="checkbox">/.test(h) && /ugmSaveFromBoxes\('fall','d2'\)/.test(h), h.slice(h.indexOf("data-ugm-editor"), h.indexOf("data-ugm-editor") + 200));
  ok("a custom timer opens with Custom selected and its seconds shown", (() => { const e = c.ugmEditorHTML(u, Object.assign({}, c.utDay(u, "d2"), { game: { title: "X", timer: 45 } })); return /<option value="custom" selected>/.test(e) && /id="ugm-fall-d2-tcustom" type="number" min="1" value="45"/.test(e); })());
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
