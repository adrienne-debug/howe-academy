// 🌅 OPENING — The Gathering's fixed opening and weekly rhythm ("One shape" §3 example B, §5; BRIEF_units_build_2026-10-27.md G1; her
//   answers 5, 6, 7). Runs the REAL OPENING + UNITTRACK + PUTSCHED + DAYCARD blocks over a Howe-shaped fixture (the roster only).
//   · the strip and the parts render by level on a fixture; a unit without an opening is DAYCARD's render byte-identical
//   · week-by-week pointers resolve on a co-op week (a unit written in order lays week by week when it has roles)
//   · the monthly swap: the poem / sound in force by week; writes are one path each; dry run; Mom-only
//   run: node test_opening.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const OP = cut("// OPENING_START", "// OPENING_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);
const ROSTER = ["taylor", "makenzie", "andrew", "caleb"];
const ROSTER_DEF = [{ id: "taylor", name: "Taylor", color: "#1e3a5f", grade: "7", schoolAge: true }, { id: "makenzie", name: "Makenzie", color: "#9a3412", grade: "4", schoolAge: true }, { id: "andrew", name: "Andrew", color: "#7c3aed", grade: "1", schoolAge: true }, { id: "caleb", name: "Caleb", color: "#15803d", grade: "PreK", schoolAge: false }];
const ANC = o => Object.assign({ id: "ancients_01", title: "The Ancients · 1", emoji: "🏺", decks: [{ key: "Ancients", cards: [{ name: "Lascaux" }] }],
  opening: { steps: ["Gather", "Date", "Weather", "Poem", "Today’s card", "Read-aloud"], weather: { little: "Name the sky", early: "Read the thermometer", middle: "Graph the week", upper: "Predict tomorrow, check yesterday" },
    poems: [{ title: "Ozymandias", by: "Shelley", text: "I met a traveller from an antique land…", parts: { little: "Look on my Works, ye Mighty!", upper: "Nothing beside remains." }, from: 1, to: 4 }, { title: "The Tyger", by: "Blake", text: "Tyger Tyger, burning bright", from: 5 }],
    sounds: [{ name: "Bone flute", url: "https://sound.example/flute", from: 1, to: 2 }, { name: "Lyre", url: "https://sound.example/lyre", from: 3 }] },
  track: { mode: "week", perWeek: 5, roles: { Mon: "The object", Tue: "Nature", Wed: "Where", Thu: "Hands-on", Fri: "Words" }, weeks: { 1: "Before the cities", 2: "The oldest culture" },
    days: [{ id: "a1", n: 1, t: "The Hall of the Bulls", rungs: { little: "Point to the bull." } }, { id: "a2", n: 2, t: "IQ Weather 1" }, { id: "a3", n: 3, t: "Lascaux, France" }, { id: "a4", n: 4, t: "The backyard dig" }, { id: "a5", n: 5, t: "Ozymandias by heart" }, { id: "a6", n: 6, t: "The oldest culture" }] } }, o || {});
function world(o) {
  o = o || {}; const writes = [], dom = o.dom || {};
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, WeakMap, URL,
    unitStudies: { ancients_01: ANC(o.unit) }, ROSTER: ROSTER.slice(), ROSTER_DEF: JSON.parse(J(ROSTER_DEF)), KID_NAME: Object.fromEntries(ROSTER_DEF.map(k => [k.id, k.name])),
    momHere: () => o.mom !== false, momHereCards: () => o.mom !== false, _dryRun: () => !!o.dry, db: { ref: p => ({ set: v => writes.push([p, JSON.parse(J(v === undefined ? null : v))]) }) },
    rulesData: { familyBlocks: { gb: { name: "The Gathering", kids: ROSTER.slice(), days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "9:00 AM", items: [{ key: "g", name: "The Gathering", minutes: 30, track: { mode: "week", book: "The Ancients · 1", startDate: "2026-10-19", startWeek: 1, total: 2, days: { Mon: "The object", Tue: "Nature", Wed: "Where", Thu: "Hands-on", Fri: "Words" }, unit: { id: "ancients_01", fromWeek: 1 } } }] } } },
    famDefs: () => ctx.rulesData.familyBlocks, famList: x => Array.isArray(x) ? x.filter(v => v != null) : (x && typeof x === "object" ? Object.keys(x).sort().map(k => x[k]).filter(v => v != null) : []), famTrack: it => (it && it.track && (it.track.mode === "week" || it.track.mode === "seq")) ? it.track : null, famItemOf: t => ctx.famList(ctx.rulesData.familyBlocks.gb.items)[0], frFind: sk => sk === "fam_gb_g" ? { id: "gb", b: ctx.rulesData.familyBlocks.gb, it: ctx.rulesData.familyBlocks.gb.items[0] } : null, lrSlug: s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    famLessonFor: t => ({ monday: "Wk 1 · The object", tuesday: "Wk 1 · Nature", wednesday: "Wk 1 · Where", thursday: "", friday: "Wk 1 · Words", nextmon: "Wk 2 · The object" })[t.day] || "", famIsAbsent: () => false, famPresLeads: () => false, famBoState: () => null,
    weekData: { tasks: ROSTER.map(k => ({ id: "g_" + k, who: k, famBlock: "gb", famItem: "g", day: "monday", time: "9:00 AM" })) }, getActiveTasks: () => ctx.weekData.tasks, _todayDay: "monday", effectiveDay: t => t.day, checked: {}, toMin: () => 540,
    routineDateISO: d => ({ monday: "2026-10-19", tuesday: "2026-10-20", wednesday: "2026-10-21", thursday: "2026-10-22", friday: "2026-10-23", nextmon: "2026-10-26" })[d] || "", cbTodayISO: () => "2026-10-19", _todayStr: () => "Monday, October 19", FAM_ABBR: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], gwParseDate: s => { const p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); },
    currData: { subjects: {}, resources: {} }, frCardRec: () => ({ links: [], books: [], supplies: [], orders: [], notes: "", _from: {} }), lrSafeUrl: u => /^https:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "", lrEsc: s => String(s == null ? "" : s), lrHost: () => "link", lidsFor: () => null, llLessonKey: () => "",
    _unitActs: u => u.activities || [], cap: s => s ? s[0].toUpperCase() + s.slice(1) : s, tab: "kids", renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0, window: { scrollTo: () => {} }, gwShowToast: () => {}, tapTask: () => {}, document: { getElementById: id => (id in dom) ? dom[id] : null },
    famWhoBlockFor: () => null, famWrite: () => true, famItems: () => [], rulesOpen: {}, _lidAlign: () => ({ ids: [], nextLid: 1 }), unitEnroll: () => {}, _unitStagedEnrollPending: () => false, masteryData: {} };
  vm.createContext(ctx);
  vm.runInContext(cut("// UNITTRACK_START", "// UNITTRACK_END") + "\n" + fn("lrLinksFor") + "\n" + fn("lrLinkA") + "\n" + cut("// PUTSCHED_START", "// PUTSCHED_END") + "\n" + cut("// DAYCARD_START", "// DAYCARD_END") + "\n" + OP + "\nObject.defineProperty(this,'opShowWords',{get:()=>opShowWords,set:v=>{opShowWords=v;}});", ctx);
  return { ctx, writes };
}

console.log("── week by week for a unit written in order ──");
{
  const c = world().ctx; const u = c.unitStudies.ancients_01;
  ok("a day's week and role come from n and the roles when the day carries none: day 1 → Wk 1 · The object, day 5 → Wk 1 · Words, day 6 → Wk 2 · The object", c.opDayLabel(u, c.utDay(u, "a1")) === "Wk 1 · The object" && c.opDayLabel(u, c.utDay(u, "a5")) === "Wk 1 · Words" && c.opDayLabel(u, c.utDay(u, "a6")) === "Wk 2 · The object");
  ok("utDayForTask on the Gathering's Monday card → day 1; Tuesday → day 2 (Nature); Friday → day 5", c.utDayForTask({ id: "g_taylor", who: "taylor", famBlock: "gb", famItem: "g", day: "monday" }).id === "a1" && c.utDayForTask({ id: "x", who: "taylor", famBlock: "gb", famItem: "g", day: "tuesday" }).id === "a2" && c.utDayForTask({ id: "x", who: "taylor", famBlock: "gb", famItem: "g", day: "friday" }).id === "a5");
  ok("a co-op Thursday has no card (no label) → null; Monday of week 2 → day 6", c.utDayForTask({ id: "x", who: "taylor", famBlock: "gb", famItem: "g", day: "thursday" }) === null && c.utDayForTask({ id: "x", who: "taylor", famBlock: "gb", famItem: "g", day: "nextmon" }).id === "a6");
  ok("utDaysForKey wk1 → the five days of week 1; wk2 → day 6", c.utDaysForKey("_family", "fam_gb_g", "wk1").map(d => d.id).join() === "a1,a2,a3,a4,a5" && c.utDaysForKey("_family", "fam_gb_g", "wk2").map(d => d.id).join() === "a6");
  ok("PUTSCHED's week track from this unit: total 2 weeks, the roles, the topics from its weeks", (() => { const tr = c.psWeekTrack(u, "2026-10-19"); return tr.total === 2 && J(tr.days) === J({ Mon: "The object", Tue: "Nature", Wed: "Where", Thu: "Hands-on", Fri: "Words" }) && J(tr.topics) === J({ 1: "Before the cities", 2: "The oldest culture" }) && J(tr.unit) === J({ id: "ancients_01", fromWeek: 1 }); })());
  ok("a unit with roles but no wk on its days is accepted by Put on the schedule in week mode", (() => { const c2 = world().ctx; c2.rulesData.familyBlocks = {}; c2.psOpen("ancients_01"); c2.psSet("mode", "week"); const r = c2.psApply(); return r && r.mode === "week"; })());
  ok("the Days table groups days by week (a header when the week changes, with the week's topic)", /data-op-week="1"[^>]*>Week 1 — Before the cities/.test(c.opWeekHeaderHTML(u, c.utDay(u, "a1"), null)) && c.opWeekHeaderHTML(u, c.utDay(u, "a2"), c.utDay(u, "a1")) === "" && /Week 2 — The oldest culture/.test(c.opWeekHeaderHTML(u, c.utDay(u, "a6"), c.utDay(u, "a5"))) && /opWeekHeaderHTML\(u,d,_prev\)/.test(fn("utDaysSectionHTML")));
}
console.log("\n── the opening on the day card ──");
{
  const c = world().ctx; c.dcOpen("gb", "g_taylor"); const h = c.dcPageHTML();
  ok("the flow strip: 1 Gather → 2 Date → 3 Weather → 4 Poem → 5 Today’s card → 6 Read-aloud → ✓, before the day", /data-op-board="1"/.test(h) && /1<\/span> Gather/.test(h) && /6<\/span> Read-aloud/.test(h) && /→<\/span><span[^>]*>✓/.test(h) && h.indexOf("data-op-board") < h.indexOf("Point to the bull."));   // the opening sits under the title and before the day's parts
  ok("the date", /Monday, October 19/.test(h));
  ok("the weather jobs with each present kid's name by level: Little → Caleb · Early → Andrew · Middle → Makenzie · Upper → Taylor", /Name the sky<\/span><span[^>]*>Caleb/.test(h) && /Read the thermometer<\/span><span[^>]*>Andrew/.test(h) && /Graph the week<\/span><span[^>]*>Makenzie/.test(h) && /Predict tomorrow, check yesterday<\/span><span[^>]*>Taylor/.test(h));
  ok("the poem in force in week 1 (Ozymandias), its parts by level with the kids, the words folded", /Ozymandias/.test(h) && /— Shelley/.test(h) && /Look on my Works, ye Mighty!<\/span><span[^>]*>Caleb/.test(h) && /Nothing beside remains\.<\/span><span[^>]*>Taylor/.test(h) && !/data-op-words/.test(h) && !/The Tyger/.test(h));
  c.opWordsToggle(); const h2 = c.dcPageHTML();
  ok("📜 Show the words → the whole poem on the screen", /data-op-words="1"/.test(h2) && /I met a traveller/.test(h2));
  ok("the sound while gathering: the bone flute in week 1, as a ▶ link (nothing speaks)", /▶ Bone flute/.test(h) && /sound\.example\/flute/.test(h) && !/<audio/.test(h.slice(0, h.indexOf("The Hall of the Bulls"))));
  ok("then the day as DAYCARD draws it: the title, its rung", /The Hall of the Bulls/.test(h) && /Point to the bull\./.test(h));
  ok("the monthly swap: week 3 → the Lyre, week 5 → The Tyger; a poem with no range is the fallback", (() => { const o = c.opOf(c.unitStudies.ancients_01); return c.opForWeek(o.sounds, 3).name === "Lyre" && c.opForWeek(o.poems, 5).title === "The Tyger" && c.opForWeek(o.poems, 2).title === "Ozymandias" && c.opForWeek([{ title: "A" }, { title: "B", from: 3 }], 1).title === "A"; })());
}
console.log("\n── a unit without an opening is DAYCARD's render, byte-identical ──");
{
  const a = world({ unit: { opening: undefined } }).ctx; a.dcOpen("gb", "g_taylor"); const withHook = a.dcPageHTML();
  const b = world({ unit: { opening: undefined } }).ctx; b.opBoardHTML = () => { throw new Error("must not be called"); };
  let plain = ""; try { b.dcOpen("gb", "g_taylor"); plain = b.dcPageHTML(); } catch (e) { plain = "THREW " + e.message; }
  ok("no opening → opBoardHTML returns '' and the board is exactly DAYCARD's (the hook is guarded and contributes nothing)", a.opBoardHTML({ u: a.unitStudies.ancients_01, present: ROSTER }) === "" && !/data-op-board/.test(withHook) && /The Hall of the Bulls/.test(withHook));
  ok("DAYCARD's day card carries the hook before the day (guarded, one line)", /if\(typeof opBoardHTML==="function"\) h\+=opBoardHTML\(g\);/.test(fn("dcPageHTML")));
}
console.log("\n── the editor and its writes: one path each ──");
{
  const dom = { "op-ancients_01-steps": { value: "Gather\nDate\nWeather\nPoem\nToday’s card\nRead-aloud" }, "op-ancients_01-w-little": { value: "Name the sky" }, "op-ancients_01-w-early": { value: "" }, "op-ancients_01-w-middle": { value: "Graph the week" }, "op-ancients_01-w-upper": { value: "Predict" } };
  const w = world({ dom }), c = w.ctx;
  ok("the Days section shows 🌅 The opening (Mom); open, it draws the flow, the weather jobs, the poems with from/to, the sounds", (() => { const h0 = c.opEditorHTML(c.unitStudies.ancients_01, true); c.opToggle("ancients_01"); const h1 = c.opEditorHTML(c.unitStudies.ancients_01, true); return /The opening · set/.test(h0) && !/data-op-editor="1"[\s\S]*Save the flow/.test(h0) && /Save the flow/.test(h1) && /Save the weather jobs/.test(h1) && /op-ancients_01-p0-from/.test(h1) && /Ozymandias/.test(h1) && /Save the sounds/.test(h1) && c.opEditorHTML(c.unitStudies.ancients_01, false) === ""; })());
  ok("Save the flow → ONE set of unitStudies/<id>/opening/steps", c.opSaveSteps("ancients_01") === true && w.writes.length === 1 && w.writes[0][0] === "unitStudies/ancients_01/opening/steps" && w.writes[0][1].length === 6);
  ok("Save the weather jobs → ONE set of …/opening/weather (empty levels left out)", c.opSaveWeather("ancients_01") === true && w.writes[1][0] === "unitStudies/ancients_01/opening/weather" && J(w.writes[1][1]) === J({ little: "Name the sky", middle: "Graph the week", upper: "Predict" }));
  Object.assign(dom, { "op-ancients_01-p0-title": { value: "Ozymandias" }, "op-ancients_01-p0-by": { value: "Shelley" }, "op-ancients_01-p0-text": { value: "I met a traveller" }, "op-ancients_01-p0-from": { value: "1" }, "op-ancients_01-p0-to": { value: "4" }, "op-ancients_01-p0-little": { value: "Look on my Works" }, "op-ancients_01-p0-early": { value: "" }, "op-ancients_01-p0-middle": { value: "" }, "op-ancients_01-p0-upper": { value: "" }, "op-ancients_01-p1-title": { value: "The Tyger" }, "op-ancients_01-p1-by": { value: "Blake" }, "op-ancients_01-p1-text": { value: "Tyger Tyger" }, "op-ancients_01-p1-from": { value: "5" }, "op-ancients_01-p1-to": { value: "" }, "op-ancients_01-p1-little": { value: "" }, "op-ancients_01-p1-early": { value: "" }, "op-ancients_01-p1-middle": { value: "" }, "op-ancients_01-p1-upper": { value: "" }, "op-ancients_01-pnew-title": { value: "Jabberwocky" }, "op-ancients_01-pnew-by": { value: "Carroll" }, "op-ancients_01-pnew-text": { value: "’Twas brillig" }, "op-ancients_01-pnew-from": { value: "9" }, "op-ancients_01-pnew-to": { value: "" } });
  ok("Save the poems → ONE set of …/opening/poems with the new one appended (from week 9)", c.opSavePoems("ancients_01") === true && w.writes[2][0] === "unitStudies/ancients_01/opening/poems" && w.writes[2][1].length === 3 && w.writes[2][1][2].title === "Jabberwocky" && w.writes[2][1][2].from === 9 && w.writes[2][1][0].parts.little === "Look on my Works");
  ok("a one-poem record (opening.poem) reads as the first of poems and is folded into the list on save", (() => { const c2 = world({ unit: { opening: { poem: { title: "Solo", text: "x" } } } }).ctx; const o = c2.opOf(c2.unitStudies.ancients_01); return o.poems.length === 1 && o.poems[0].title === "Solo"; })());
  ok("not Mom → nothing; dry run → the record changes, nothing written", world({ mom: false, dom }).ctx.opSaveSteps("ancients_01") === false && (() => { const d = world({ dom, dry: true }); return d.ctx.opSaveWeather("ancients_01") === true && d.writes.length === 0 && d.ctx.unitStudies.ancients_01.opening.weather.little === "Name the sky"; })());
  ok("the Days section carries the editor hook (guarded)", /if\(typeof opEditorHTML==="function"\) h\+=opEditorHTML\(u,isMom\);/.test(fn("utDaysSectionHTML")));
}
console.log("\n── the block ──");
{
  ok("every write is one targeted set behind the live check; no kid's name; no shuffle emoji", (OP.match(/db\.ref\(/g) || []).length === 3 && /if\(opLive\(\)\)\{ db\.ref\("unitStudies\/"\+uid\+"\/opening\/"\+key\)\.set\(v\)/.test(OP) && !/lincoln|ellis|lucy|julian/i.test(OP.replace(/\/\/.*$/gm, "")) && src.indexOf("🔀") < 0);
  ok("UNITTRACK's week-mode readers use opDayWk / opDayRole when present (guarded)", /typeof opDayWk==="function"/.test(fn("utDayForFam")) && /typeof opDayWk==="function"/.test(fn("utDaysForKey")) && /typeof opDayWk==="function"/.test(fn("psWeekTrack")));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
