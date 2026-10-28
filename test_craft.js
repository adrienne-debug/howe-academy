// ✂️ CRAFT — a craft on a unit day ("One shape" §5; BRIEF_units_build_2026-10-27.md B3; her ask 2026-10-24: "a craft section for
//   instructions and supplies"). Runs the REAL CRAFT + UNITTRACK + LESSONRES (lrBuildList) blocks and DAYCARD's dcSection.
//   · the Sunday list carries a craft's supplies on the right week with the right ids, tagged ✂️ for the craft, kids flag on
//   · a unit-level craft's supplies list with the unit's first laid day; a day without a craft is unchanged
//   · the day card renders the steps as a numbered list with photos; writes are one path each (a day: …/craft; the unit: track/craft)
//   · a step's photo is stored by URL through picStore, never a data URI; the Builder's day box lands craft on the record
//   run: node test_craft.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const CR = cut("// CRAFT_START", "// CRAFT_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);
const UNIT = () => ({ id: "thanksgiving", title: "Thanksgiving", emoji: "🦃", enrolled: { caleb: true }, decks: [{ key: "Thanksgiving", cards: [{ name: "Wampanoag" }] }],
  track: { mode: "seq", perWeek: 4, craft: { title: "Cornucopia", steps: [{ text: "Roll the paper into a horn" }], supplies: [{ name: "brown paper", qty: "1" }] }, days: [
    { id: "d1", n: 1, t: "Who were the Wampanoag?", res: { supplies: [{ name: "construction paper", qty: "2" }] } },
    { id: "d2", n: 2, t: "Hand turkey day", craft: { title: "Hand turkey", steps: [{ text: "Trace your hand" }, { text: "Color the feathers", img: "https://firebasestorage.googleapis.com/v0/b/x/o/pictures%2Funits%2Fhand.jpg" }], supplies: [{ name: "glue" }, { name: "googly eyes", qty: "10" }] } },
    { id: "d3", n: 3, t: "Plymouth" }] } });
function world(o) {
  o = o || {}; const writes = []; const dom = o.dom || {};
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, WeakMap, Promise, setTimeout, URL,
    unitStudies: { thanksgiving: UNIT() }, ROSTER: ["taylor", "makenzie", "andrew", "caleb"], currData: { subjects: { caleb: { tg: { name: "Thanksgiving", lessonSeq: ["Day 1", "Day 2", "Day 3"], lessonIds: ["t1", "t2", "t3"], unit: { id: "thanksgiving" } } } }, resources: {}, lessons: {} },
    momHere: () => o.mom !== false, _dryRun: () => !!o.dry, db: { ref: p => ({ set: v => writes.push([p, JSON.parse(J(v === undefined ? null : v))]) }) }, renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0,
    document: { getElementById: id => (id in dom) ? dom[id] : null }, mastCompressImg: async () => "data:image/jpeg;base64,AAA", picStore: async (d, parts) => "https://firebasestorage.googleapis.com/v0/b/x/o/pictures%2F" + parts.join("%2F") + ".jpg",
    lidsFor: (k, sk) => (((ctx.currData.subjects[k] || {})[sk]) || {}).lessonIds || null, lrKeyForText: () => "", famDefs: () => ({}), famList: x => x || [], famTrack: () => null, frFind: () => null, lrSlug: s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    supplies: {}, lrTicksNext: {}, WK: "week30", activeWk: () => "week30", cbTodayISO: () => "2026-10-21", HA_LS: { getItem: () => null, setItem: () => {} }, sv: () => {}, ld: () => null, lrStaples: {}, lrLaySig: () => "x", lrStaplesNeeded: () => [], tab: "supplies",
    dcSection: (t, inner) => '<section><div>' + t + '</div><div>' + inner + '</div></section>' };
  vm.createContext(ctx);
  vm.runInContext(cut("// LESSONRES_START", "// LESSONRES_END") + "\n" + cut("// UNITTRACK_START", "// UNITTRACK_END") + "\n" + CR, ctx);
  ctx.lrLaidLessonsCached = (kid, from, to) => kid === "caleb" ? [{ sk: "tg", key: "t1", text: "Day 1", date: "2026-10-19" }, { sk: "tg", key: "t2", text: "Day 2", date: "2026-10-20" }, { sk: "tg", key: "t3", text: "Day 3", date: "2026-10-27" }].filter(L => L.date >= from && L.date <= to) : [];
  ctx.frBuildFamily = () => null;
  return { ctx, writes };
}

console.log("── the Sunday list ──");
{
  const w = world(), c = w.ctx; const L = c.lrBuildList({ today: "2026-10-21" });
  const ids = L.items.map(i => i.id + ":" + (i.weeks || []).join("") + ":" + (i.craft ? "craft" : "") + ":" + (i.detail || ""));
  ok("day 2's craft supplies land this week under today's ids, tagged craft; day 1's paper too (no tag); the unit's craft lists with day 1", ids.indexOf("lr_caleb_tg_supplies_glue:0:craft:") >= 0 && ids.indexOf("lr_caleb_tg_supplies_googly_eyes:0:craft:10") >= 0 && ids.indexOf("lr_caleb_tg_supplies_construction_paper:0::2") >= 0 && ids.indexOf("lr_caleb_tg_supplies_brown_paper:0:craft:1") >= 0, ids);
  ok("day 3 (next week) has no craft → nothing of its own on the list", !ids.some(i => /:1:/.test(i)));
  const r2 = c.lrFor("caleb", "tg", "t2");
  ok("lrFor day 2: the craft's supplies carry craft:true and the kids flag on", r2.supplies.length === 2 && r2.supplies.every(s => s.craft === true && s.kids === true) && r2._from.supplies === "unit");
  ok("lrFor day 1: the day's own supply plus the unit-level craft's (tagged), day 3: nothing", c.lrFor("caleb", "tg", "t1").supplies.map(s => s.name + (s.craft ? "*" : "")).join() === "construction paper,brown paper*" && c.lrFor("caleb", "tg", "t3").supplies.length === 0);
  ok("the row reads ✂️ for the craft on a craft supply only", /✂️ for the craft/.test(c.lrItemRowHTML(L.items.find(i => /glue/.test(i.id)), {}, {})) && !/for the craft/.test(c.lrItemRowHTML(L.items.find(i => /construction/.test(i.id)), {}, {})));
  ok("a unit without any craft: lrBuildList unchanged (ids and count)", (() => { const c2 = world().ctx; delete c2.unitStudies.thanksgiving.track.craft; delete c2.unitStudies.thanksgiving.track.days[1].craft; c2.utTouched(c2.unitStudies.thanksgiving); const L2 = c2.lrBuildList({ today: "2026-10-21" }); return L2.items.map(i => i.id).join() === "lr_caleb_tg_supplies_construction_paper" && L2.items.every(i => !i.craft); })());
}
console.log("\n── the writes: one path each ──");
{
  const dom = { "cr-thanksgiving-d1-title": { value: "Paper feathers" }, "cr-thanksgiving-d1-steps": { value: "Cut feather shapes\nGlue them on" }, "cr-thanksgiving-d1-supplies": { value: "3 colored paper\nglue" } };
  const w = world({ dom }), c = w.ctx;
  ok("Save the craft on a day → ONE utWrite of …/track/days/0/craft with title, steps and supplies (lrClean'd, kids on)", c.crDaySave("thanksgiving", "d1") === true && w.writes.length === 1 && w.writes[0][0] === "unitStudies/thanksgiving/track/days/0/craft" && J(w.writes[0][1]) === J({ title: "Paper feathers", steps: [{ text: "Cut feather shapes" }, { text: "Glue them on" }], supplies: [{ name: "colored paper", kids: true, qty: "3" }, { name: "glue", kids: true }] }), w.writes);
  ok("the day now carries it; the editor shows the lines back", c.utDay(c.unitStudies.thanksgiving, "d1").craft.title === "Paper feathers" && /Cut feather shapes\nGlue them on/.test(c.crDayEditorHTML(c.unitStudies.thanksgiving, c.utDay(c.unitStudies.thanksgiving, "d1"))));
  dom["cr-thanksgiving-unit-title"] = { value: "Cornucopia" }; dom["cr-thanksgiving-unit-steps"] = { value: "Roll the paper into a horn\nFill it" }; dom["cr-thanksgiving-unit-supplies"] = { value: "1 brown paper" };
  ok("Save the unit's craft → ONE set of unitStudies/<id>/track/craft, the first step's photo kept by position", c.crTrackSave("thanksgiving") === true && w.writes.length === 2 && w.writes[1][0] === "unitStudies/thanksgiving/track/craft" && w.writes[1][1].steps.length === 2 && w.writes[1][1].steps[0].text === "Roll the paper into a horn");
  ok("empty boxes clear the part (set null)", (dom["cr-thanksgiving-d1-title"].value = "", dom["cr-thanksgiving-d1-steps"].value = "", dom["cr-thanksgiving-d1-supplies"].value = "", c.crDaySave("thanksgiving", "d1") && w.writes[2][1] === null && c.utDay(c.unitStudies.thanksgiving, "d1").craft === undefined));
  ok("not Mom → nothing; dry run → the day changes, nothing written", world({ mom: false, dom }).ctx.crDaySave("thanksgiving", "d1") === false && (() => { const d = world({ dom, dry: true }); return d.ctx.crDaySave("thanksgiving", "d1") === true && d.writes.length === 0; })());
}
console.log("\n── a step's photo by URL ──");
{
  const w = world(), c = w.ctx;
  (async () => {
    await c.crStepPhoto("thanksgiving", "d2", 0, { files: [{ name: "a.jpg" }], value: "" });
    const d2 = c.utDay(c.unitStudies.thanksgiving, "d2");
    ok("the photo is shrunk, stored through picStore under pictures/units/…/craft/…, and the craft part written ONCE with the url on that step — never a data URI", d2.craft.steps[0].img === "https://firebasestorage.googleapis.com/v0/b/x/o/pictures%2Funits%2Fthanksgiving%2Fcraft%2Fd2%2F0.jpg" && w.writes.length === 1 && w.writes[0][0] === "unitStudies/thanksgiving/track/days/1/craft" && !/data:/.test(J(w.writes[0][1])) && d2.craft.steps[1].img.indexOf("hand.jpg") > 0);
    ok("✕ takes the photo off (one write)", c.crStepPhotoClear("thanksgiving", "d2", 0) === true && w.writes.length === 2 && c.utDay(c.unitStudies.thanksgiving, "d2").craft.steps[0].img === undefined);
    console.log("\n── the day card ──");
    {
      const g = { day: Object.assign({ uid: "thanksgiving" }, c.utDay(c.unitStudies.thanksgiving, "d2")), u: c.unitStudies.thanksgiving };
      const h = c.crCardHTML(g);
      ok("the steps as a numbered list, the photo on its step, the supplies under them, big type", /<ol/.test(h) && /<li[^>]*>Trace your hand/.test(h) && /Color the feathers/.test(h) && /hand\.jpg/.test(h) && /🎒 glue · 10 googly eyes/.test(h) && /font-size:22px/.test(h));
      ok("a day without a craft falls back to the unit's one project; a unit with neither → nothing", /Cornucopia/.test(c.crCardHTML({ day: Object.assign({ uid: "thanksgiving" }, c.utDay(c.unitStudies.thanksgiving, "d3")), u: c.unitStudies.thanksgiving })) && (() => { const c2 = world().ctx; delete c2.unitStudies.thanksgiving.track.craft; c2.utTouched(c2.unitStudies.thanksgiving); return c2.crCardHTML({ day: Object.assign({ uid: "thanksgiving" }, c2.utDay(c2.unitStudies.thanksgiving, "d3")), u: c2.unitStudies.thanksgiving }) === ""; })());
    }
    console.log("\n── the hooks, the block ──");
    {
      ok("UNITTRACK: craft is an editable part; the day editor and the Days section carry the craft hooks; utResOf tags a craft's supplies", /const UT_EDIT_PARTS=\["t","res","cards","rungs","words","read","craft","note","off"\]/.test(src) && /\(\(typeof crDayEditorHTML==="function"\)\?crDayEditorHTML\(u,d\):""\)/.test(fn("utEditorHTML")) && /if\(typeof crUnitSectionHTML==="function"\) h\+=crUnitSectionHTML\(u,isMom\);/.test(fn("utDaysSectionHTML")));
      ok("UNITTRACK's layer hands the unit's craft to the first day (utDaysForKey / utDayForFam) and the Sunday list carries the tag", /crafts?:true|craft:true/.test(fn("utResOf")) && /typeof crOfTrack==="function"/.test(cut("// UNITTRACK_START", "// UNITTRACK_END")) && /add\("supplies",L,pair\[1\],s\.name,s\.qty\|\|"",null,null,s\.craft\)/.test(fn("lrBuildList")) && /add\("supplies",sk,L,pair\[1\],s\.name,s\.qty\|\|"",null,null,s\.craft\)/.test(fn("frBuildFamily")) && /\(\(typeof crRowTagHTML==="function"\)\?crRowTagHTML\(it\):''\)/.test(fn("lrItemRowHTML")));
      ok("the Builder's day gets a ✂️ Craft box that lands on the record; the day card draws the craft (guarded)", /\["craft","\\u2702\\uFE0F Craft"/.test(cut("// UNITBUILD_START", "// UNITBUILD_END")) && /if\(typeof crCardHTML==="function"\) h\+=crCardHTML\(g\);/.test(fn("dcDayHTML")));
      ok("every write in the block is targeted and behind the live check; no kid's name; no shuffle emoji", (CR.match(/db\.ref\(/g) || []).length === 1 && /if\(crLive\(\)\) db\.ref\("unitStudies\/"\+uid\+"\/track\/craft"\)\.set\(c\)/.test(CR) && !/lincoln|ellis|lucy|julian/i.test(CR.replace(/\/\/.*$/gm, "")) && src.indexOf("🔀") < 0);
    }
    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail ? 1 : 0);
  })();
}
