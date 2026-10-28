// ✚ UNITBUILD — Build a unit, Sara's four boxes ("One shape" §3 example A, §5; BRIEF_units_build_2026-10-27.md B1; her answer 2:
//   day by day is the first screen). Runs the REAL UNITBUILD + UNITTRACK (+ PUTSCHED for the guard) blocks and the existing unit
//   readers (haKidUnits, _unitCharDeck, haBuildUnitInsight) on the record it makes.
//   · day by day is the first screen: 3 days written, each with its own boxes → the track in order, nothing spread
//   · the spread: 8 days, 4 a week, 2 videos, 3 activities, 12 cards → a deterministic layout (activities on their own days, the
//     last one last; a book or video on the other days; cards 2 or 1 a day in order); a line moves to another day
//   · unchecked cards block Save; ✓ Keep / ✏ Fix / ✕ Drop; drafted cards wait for a tick; a picture approved per card
//   · the record validates with utClean and the existing readers; ch on named cards; ONE transaction on Save; dry run writes
//     nothing; not Mom → nothing; the guard: a unit with an unchecked card cannot be put on the schedule or enrolled
//   run: node test_unit_build.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const UB = cut("// UNITBUILD_START", "// UNITBUILD_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);
function world(o) {
  o = o || {}; const writes = [], tx = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, WeakMap, Promise, setTimeout,
    unitStudies: o.units || {}, ROSTER: ["taylor", "makenzie", "andrew", "caleb"], momHere: () => o.mom !== false, _dryRun: () => !!o.dry,
    db: { ref: p => ({ set: v => writes.push([p, v]), update: v => writes.push([p, v]), transaction: f => { const cur = o.exists ? { id: "x" } : null; const r = f(cur); tx.push([p, r]); return { then: cb => { cb({ committed: r !== undefined }); return { catch: () => {} }; } }; } }) },
    window: { HA_FAMILY: { familyId: "dewalt", familyName: "DeWalt Academy" } }, HA_LS: { getItem: () => "Sara", setItem: () => {} }, cap: s => s ? s[0].toUpperCase() + s.slice(1) : s,
    renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0, openUnit: id => { ctx.opened = id; }, gwShowToast: () => {}, document: { getElementById: id => (o.dom && (id in o.dom)) ? { value: o.dom[id] } : null },
    lrSafeUrl: u => /^https:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "", famDefs: () => ({}), famList: x => x || [], famTrack: () => null, famWhoBlockFor: () => null, famWrite: () => true, famItems: () => [], currData: { subjects: {} }, masteryData: {},
    _unitPicsLookup: async (f, t) => t === "Wampanoag" ? { url: "https://upload.wikimedia.org/w.jpg", credit: "Wikipedia · Wampanoag" } : null, fetch: () => null, kitCapKey: () => "k", _cbShrinkImage: async () => "b64", kitCapAsk: async () => '{"items":[{"front":"Squanto","back":"a Patuxet man"},{"front":"harvest","back":"gathering crops"}]}',
    masteryKid: "caleb", MAST_MASTERY_TIER_DEFAULT: "monthly", mastTierAtLeast: () => false, _unitPortrait: () => "", _nbActKeys: () => [], unitActPoints: a => a.points || 0, nbUnitDays: () => ({}) };
  vm.createContext(ctx);
  vm.runInContext(cut("// UNITTRACK_START", "// UNITTRACK_END") + "\n" + cut("// PUTSCHED_START", "// PUTSCHED_END") + "\n" + UB + "\n" + fn("lrClean") + "\n" + fn("lrList") + "\n" + fn("lrStr") + "\n" + fn("lrDate") + "\n" + fn("haKidUnits") + "\n" + fn("_unitCharDeck") + "\n" + fn("haBuildUnitInsight") + "\n" + fn("_unitActs") + "\nObject.defineProperty(this,'ubForm',{get:()=>ubForm,set:v=>{ubForm=v;}});Object.defineProperty(this,'psForm',{get:()=>psForm,set:v=>{psForm=v;}});", ctx);
  return { ctx, writes, tx };
}
const addLines = (c, di, kind, text) => { c.document.getElementById = id => id === "ub-in-" + kind + "-" + (di == null ? "all" : di) ? { value: text } : null; return c.ubAddLines(di, kind); };
const keepAll = c => c.ubAllCards().forEach(x => c.ubKeep(x.c.id));

console.log("── day by day is the first screen ──");
{
  const w = world(), c = w.ctx; c.ubOpen();
  ok("the Builder opens on Name it, mode day by day, one empty day; nothing written", c.ubForm.step === "name" && c.ubForm.mode === "days" && c.ubForm.days.length === 1 && w.writes.length === 0 && w.tx.length === 0);
  ok("Name it draws title, emoji, ages, first name, one line, kind, and the two ways to write it", (() => { const h = c.ubPageHTML(); return /Thanksgiving/.test(h) && /Your first name/.test(h) && /Book companion/.test(h) && /Day by day/.test(h) && /Fill four boxes/.test(h); })());
  c.ubSet("title", "Thanksgiving"); c.ubSet("emoji", "🦃"); c.ubSet("desc", "Who was at the first feast"); c.ubSet("ages", "5–12"); c.ubGo("fill");
  ok("Next → the day-by-day screen: Day 1 with four boxes (a photo button on each) and the ✂️ Craft box", c.ubForm.step === "fill" && (() => { const h = c.ubPageHTML(); return /data-ub-day="1"/.test(h) && (h.match(/data-ub-box=/g) || []).length === 5 && /data-ub-box="craft"/.test(h) && (h.match(/Snap a photo/g) || []).length === 4; })());   // CRAFT (B3): the fifth box, ✂️ Craft, has no photo button
  c.ubDayTitle(0, "Who were the Wampanoag?");
  ok("typed lines → items: 2 cards (front | back), a book with a link, a video", addLines(c, 0, "cards", "Wampanoag | the people who lived here\nMayflower | the ship") === 2 && addLines(c, 0, "books", "Squanto | J. Bulla | https://books.example/squanto") === 1 && addLines(c, 0, "videos", "https://youtu.be/wamp | The first Thanksgiving") === 1 && c.ubForm.days[0].books[0].url === "https://books.example/squanto");
  c.ubDayAdd(); c.ubDayTitle(1, "The Mayflower"); addLines(c, 1, "cards", "Plymouth | where they landed"); addLines(c, 1, "acts", "Hand turkey | 5 | trace and color");
  c.ubDayAdd(); c.ubDayTitle(2, "Thankful"); addLines(c, 2, "acts", "What I'm thankful for | 10");
  ok("three days written, each with its own boxes; nothing spread", c.ubForm.days.length === 3 && c.ubForm.days[1].acts[0].points === 5 && c.ubForm.days[2].acts[0].points === 10 && !c.ubForm.spread);
  ok("a bad video line (not https) is dropped; a blank line is ignored", addLines(c, 0, "videos", "ftp://no\n\n") === 0);
  c.ubGo("check");
  ok("Check lists every card unchecked; Save is disabled and refuses", c.ubForm.step === "check" && c.ubUncheckedCount() === 3 && /3 to check/.test(c.ubPageHTML()) && c.ubSave() === null && /still unchecked/.test(c.ubForm.msg) && w.tx.length === 0);
  const ids = c.ubAllCards().map(x => x.c.id);
  c.ubFix(ids[1]); c.ubEdit("0", "cards", ids[1], "back", "the ship that brought them"); c.ubKeep(ids[1]);
  ok("✏ Fix edits the back (the HTML hands the day index over as text), then ✓ Keep signs it with the first name", c.ubForm.days[0].cards[1].back === "the ship that brought them" && c.ubForm.days[0].cards[1].checked.by === "Sara");
  c.ubDrop(ids[2]);
  ok("✕ Drop removes the card from its day", c.ubForm.days[1].cards.length === 0 && c.ubAllCards().length === 2);
  (async () => {
    await c.ubPicFind(ids[0]);
    ok("🖼 finds a picture through UNIT_PICS's own lookup and waits for her approval", c.ubForm.pic && c.ubForm.pic.hit && c.ubForm.pic.hit.credit === "Wikipedia · Wampanoag");
    c.ubPicUse(ids[0], true);
    ok("…approved: the card carries the picture and its credit", c.ubForm.days[0].cards[0].pic.imageUrl === "https://upload.wikimedia.org/w.jpg");
    c.ubKeep(ids[0]);
    const u = c.ubSave();
    ok("Save with every card checked → ONE transaction creating unitStudies/thanksgiving, nothing else written", w.tx.length === 1 && w.tx[0][0] === "unitStudies/thanksgiving" && w.writes.length === 0 && c.unitStudies.thanksgiving === u && c.ubForm === null && c.opened === "thanksgiving");
    ok("the record: id, title, emoji, one line, kind topic, ages, version 1, nbInsert, author {DeWalt, Sara}, sources", u.id === "thanksgiving" && u.title === "Thanksgiving" && u.emoji === "🦃" && u.kind === "topic" && u.ages === "5–12" && u.version === 1 && u.nbInsert === true && J(u.author) === J({ family: "DeWalt", first: "Sara" }) && u.sources.length >= 5 && u.familyOnly === undefined, u.author);
    ok("one deck named after the unit: the 2 kept cards in order, each with def, ch = its day, checked {by, at}", u.decks.length === 1 && u.decks[0].key === "Thanksgiving" && u.decks[0].cards.length === 2 && u.decks[0].cards[0].name === "Wampanoag" && u.decks[0].cards[0].ch === 1 && u.decks[0].cards[1].def === "the ship that brought them" && u.decks[0].cards[0].checked.by === "Sara" && u.decks[0].cards[0].order === 1 && u.decks[0].cards[1].order === 2, u.decks[0].cards);
    ok("the picture is the unit's visual (deck_name → {imageUrl, credit}) — what the drill card and notebook read", J(u.visuals) === J({ "Thanksgiving_Wampanoag": { imageUrl: "https://upload.wikimedia.org/w.jpg", credit: "Wikipedia · Wampanoag" } }));
    ok("activities as today: key, title, kind sheet, points she set, a line, the day", u.activities.length === 2 && u.activities[0].key === "hand_turkey" && u.activities[0].points === 5 && u.activities[0].desc === "trace and color" && u.activities[0].kind === "sheet" && u.activities[1].points === 10 && u.activities[1].day === 3);
    ok("the track: in order, 4 a week, 3 days — day 1 with its video, its book (+ its link), its cards; day 2 the activity queued (nb); day 3 the second", u.track.mode === "seq" && u.track.perWeek === 4 && u.track.days.length === 3 && u.track.days[0].id === "d1" && u.track.days[0].t === "Who were the Wampanoag?" && u.track.days[0].res.links.length === 2 && u.track.days[0].res.links[0].kind === "video" && u.track.days[0].res.books[0].by === "J. Bulla" && J(u.track.days[0].cards) === J([{ deck: "Thanksgiving", names: ["Wampanoag", "Mayflower"] }]) && J(u.track.days[1].nb) === J({ activity: "hand_turkey" }) && u.track.days[1].cards === undefined && J(u.track.days[2].nb) === J({ activity: "what_i_m_thankful_for" }), u.track.days);
    ok("every day validates with utClean (byte-identical round trip)", u.track.days.every(d => J(c.utClean(d)) === J(d)));
    ok("the existing readers run on it: haKidUnits, _unitCharDeck, haBuildUnitInsight", (() => { u.enrolled = { caleb: true }; const ins = c.haBuildUnitInsight("caleb", u); return c.haKidUnits("caleb").length === 1 && c._unitCharDeck(u).key === "Thanksgiving" && ins && ins.next.length === 2 && ins.unitId === "thanksgiving"; })());
    ok("the UNITTRACK readers see its days and the cards each one names", c.utDaysOn(u).length === 3 && c.utDay(u, "d1").cards[0].names.length === 2 && c.utChOf(u, c.utDay(u, "d2")) === 2);
    console.log("\n── the spread ──");
    {
      const w2 = world(), c2 = w2.ctx; c2.ubOpen(); c2.ubSet("title", "Zoology"); c2.ubSet("mode", "boxes"); c2.ubGo("fill");
      addLines(c2, null, "videos", "https://v.example/1 | Habitats\nhttps://v.example/2 | Food chains");
      addLines(c2, null, "books", "Mammals | A. Author");
      addLines(c2, null, "acts", "Zoo trip | 10\nAnimal mask | 5\nHabitat diorama | 8");
      addLines(c2, null, "cards", "c1|1\nc2|2\nc3|3\nc4|4\nc5|5\nc6|6\nc7|7\nc8|8\nc9|9\nc10|10\nc11|11\nc12|12");
      c2.ubSet("nDays", 8); c2.ubSet("perWeek", 4); c2.ubGo("days");
      const d = c2.ubForm.days;
      ok("8 days; the three activities on their own days, the last one last: days 4, 6, 8", d.length === 8 && d[3].acts[0].title === "Zoo trip" && d[5].acts[0].title === "Animal mask" && d[7].acts[0].title === "Habitat diorama" && d.filter(x => x.acts.length).length === 3);
      ok("the book and the two videos on the other days in order: day 1 the book, day 2 video 1, day 3 video 2; activity days carry none", d[0].books.length === 1 && d[1].videos[0].label === "Habitats" && d[2].videos[0].label === "Food chains" && !d[3].books.length && !d[3].videos.length && !d[4].books.length);
      ok("cards two a day in order on days 1–4, one a day on 5–8", d.map(x => x.cards.length).join() === "2,2,2,2,1,1,1,1" && d[0].cards[0].front === "c1" && d[4].cards[0].front === "c9");
      ok("each day got a title (the activity, the book, the video, or the cards)", d[0].t === "Mammals" && d[1].t === "Habitats" && d[3].t === "Zoo trip" && d[4].t === "c9");
      ok("the same boxes spread again give the same layout (deterministic)", J(c2.ubSpreadPlan(c2.ubForm.boxes, 8, 4).map(x => [x.cards.map(y => y.front), x.acts.map(y => y.title), x.books.length, x.videos.length])) === J(d.map(x => [x.cards.map(y => y.front), x.acts.map(y => y.title), x.books.length, x.videos.length])));
      const vid = d[1].videos[0].id; c2.ubMove("videos", vid, 1, 2);
      ok("a line moves to another day (the Day ▾): video 1 now on day 3, day 2 re-titled", d[1].videos.length === 0 && d[2].videos.length === 2 && d[1].t === "c3, c4");
      c2.ubDayTitleEdit(0, "Meet the mammals"); c2.ubMove("cards", d[0].cards[0].id, 0, 1);
      ok("an edited title stays when a line leaves the day", d[0].t === "Meet the mammals" && d[0].cards.length === 1);
      c2.ubGo("check"); keepAll(c2); const u2 = c2.ubSave();
      ok("saved: 12 cards with ch by day (c1 moved to day 2 → ch 2), 3 activities, 8 days, the links where they landed", u2 && u2.decks[0].cards.length === 12 && u2.decks[0].cards.find(x => x.name === "c1").ch === 2 && u2.decks[0].cards.find(x => x.name === "c12").ch === 8 && u2.activities.length === 3 && u2.track.days.length === 8 && u2.track.days[2].res.links.length === 2 && u2.track.days[7].nb.activity === "habitat_diorama", u2 && u2.decks[0].cards.map(x => x.name + ":" + x.ch));
      ok("a unit with the same name gets a fresh id", (() => { const c3 = world({ units: { zoology: { id: "zoology" } } }).ctx; return c3.ubUnitId("Zoology") === "zoology_2"; })());
    }
    console.log("\n── drafts from a photo wait for a tick; a book companion is family-only ──");
    {
      const w3 = world(), c3 = w3.ctx; c3.ubOpen(); c3.ubSet("title", "Pilgrims"); c3.ubSet("kind", "book"); c3.ubGo("fill");
      await c3.ubPhoto(0, "cards", { files: [{ name: "a.jpg" }], value: "" });
      ok("two cards drafted from the photo, each flagged drafted (unchecked), a photo source recorded", c3.ubForm.days[0].cards.length === 2 && c3.ubForm.days[0].cards.every(x => x.draft) && c3.ubForm.sources.some(s => s.kind === "photo" && s.n === 2) && /drafted from the photo/.test(c3.ubForm.msg));
      c3.ubGo("check");
      ok("the Check screen shows them as drafted; Save refuses until each is ticked", /drafted/.test(c3.ubPageHTML()) && c3.ubSave() === null);
      keepAll(c3); const u3 = c3.ubSave();
      ok("kept drafts carry drafted:true on the record; kind book → familyOnly", u3.decks[0].cards.every(x => x.drafted === true && x.checked) && u3.kind === "book" && u3.familyOnly === true);
      ok("no key → a plain message, nothing drafted", (async () => { const c4 = world().ctx; c4.kitCapKey = () => ""; c4.ubOpen(); c4.ubSet("title", "X"); c4.ubGo("fill"); await c4.ubPhoto(0, "cards", { files: [{}] }); return /Needs a Claude key/.test(c4.ubForm.msg) && c4.ubForm.days[0].cards.length === 0; })() instanceof Promise);
    }
    console.log("\n── dry run, Mom-only, the guard ──");
    {
      const w4 = world({ dry: true }), c4 = w4.ctx; c4.ubOpen(); c4.ubSet("title", "Dry"); c4.ubGo("fill"); addLines(c4, 0, "cards", "a | 1"); c4.ubGo("check"); keepAll(c4); const u4 = c4.ubSave();
      ok("dry run: the record is kept in memory and opens, nothing is written", u4 && c4.unitStudies.dry === u4 && w4.tx.length === 0 && w4.writes.length === 0 && c4.opened === "dry");
      const w5 = world({ mom: false }), c5 = w5.ctx; c5.ubOpen();
      ok("not Mom: the Builder does not open, Save does nothing, the page is empty", c5.ubForm === null && c5.ubSave() === null && c5.ubOpenHTML() === "" && w5.tx.length === 0);
      const w6 = world({ exists: true }), c6 = w6.ctx; c6.ubOpen(); c6.ubSet("title", "Taken"); c6.ubGo("fill"); addLines(c6, 0, "cards", "a | 1"); c6.ubGo("check"); keepAll(c6); c6.ubSave();
      ok("the transaction only ever creates the node: another device's unit is left alone, she is told", w6.tx[0][1] === undefined && /another device/.test(c6.ubForm.msg) && !c6.unitStudies.taken);
      const c7 = world().ctx; const hand = { id: "hand", title: "Hand", decks: [{ key: "Hand", cards: [{ name: "a", unchecked: true }, { name: "b" }] }], track: { mode: "seq", days: [{ id: "d1", n: 1, t: "x" }] } }; c7.unitStudies.hand = hand;
      ok("ubUnchecked names a card flagged unchecked:true (never a starter's plain cards)", J(c7.ubUnchecked(hand)) === J(["a"]) && c7.ubUnchecked({ decks: [{ key: "k", cards: [{ name: "z" }] }] }).length === 0);
      c7.psOpen("hand"); const r = c7.psApply();
      ok("Put on the schedule refuses a unit with an unchecked card", r === null && /unchecked/.test(c7.psForm.msg));
      ok("unitEnroll carries the same guard (one guarded line)", /if\(typeof ubUnchecked==="function"&&ubUnchecked\(u\)\.length\)/.test(fn("unitEnroll")) && /ubUnchecked\(u\)\.length\) return re\(/.test(fn("psApply")));
    }
    console.log("\n── the hooks, the block ──");
    {
      ok("renderUnits opens the Builder while it is open (guarded), before the tabs", /if\(typeof ubOpenHTML==="function"\)\{ const _ub=ubOpenHTML\(\); if\(_ub\)\{ con\.innerHTML=_ub; return; \} \}/.test(fn("renderUnits")));
      ok("the library's ✚ Build a unit button is the UNITSTAB hook (ubOpen)", /ubOpen\(\)/.test(cut("// UNITSTAB_START", "// UNITSTAB_END")));
      ok("no kid's name in the block; no shuffle emoji in index.html; every write sits behind the live check", !/lincoln|ellis|lucy|julian/i.test(UB.replace(/\/\/.*$/gm, "")) && src.indexOf("🔀") < 0 && (UB.match(/db\.ref\(/g) || []).length === 1 && /if\(ubLive\(\)\)\{ db\.ref\("unitStudies\/"\+u\.id\)\.transaction/.test(UB));
      ok("phone width: the page is max-width 560 with wrapping rows", /max-width:560px/.test(c.ubPageHTML ? "max-width:560px" : "") && /flex-wrap:wrap/.test(UB));
    }
    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail ? 1 : 0);
  })();
}
