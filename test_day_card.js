// 📺 DAYCARD — today's day card on one screen ("One shape" §3 Screen, §5 the board; BRIEF_units_build_2026-10-27.md B2; her
//   answers 3, 4, 8, 13). Runs the REAL DAYCARD + UNITTRACK blocks (and lrLinksFor / lrLinkA) over a DeWalt-shaped fixture.
//   · the kid-card button, the Corner tile, Mom's Day row and the Family tab open the same view
//   · a unit day with every part; a day with none → title + links; a family item with no unit day → as the Schedule draws it
//   · rungs hidden on a day with no question; the level mapping from grades; rungLog "kid" writes one path per tap, "none" nothing
//   · the check calls the existing path (tapTask on the first open copy) once per group; kids get no ✓; "You anchored the day"
//   · nothing written on draw; dry run; the hooks (renderAll, showTab, famRowHTML, Kids' Corner, Mom's Day, CSS)
//   run: node test_day_card.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const DC = cut("// DAYCARD_START", "// DAYCARD_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);
const ROSTER = ["taylor", "makenzie", "andrew", "caleb"];
const ROSTER_DEF = [{ id: "taylor", name: "Taylor", color: "#1e3a5f", grade: "7", schoolAge: true }, { id: "makenzie", name: "Makenzie", color: "#9a3412", grade: "4", schoolAge: true }, { id: "andrew", name: "Andrew", color: "#7c3aed", grade: "1", schoolAge: true }, { id: "caleb", name: "Caleb", color: "#15803d", grade: "PreK", schoolAge: false }];
const UNITS = () => ({ thanksgiving: { id: "thanksgiving", title: "Thanksgiving", emoji: "🦃", decks: [{ key: "Thanksgiving", cards: [{ name: "Wampanoag" }, { name: "Mayflower" }] }], activities: [{ key: "turkey", title: "Hand turkey", emoji: "🖐", points: 5, desc: "Trace your hand and color it." }],
  visuals: { "Thanksgiving_Wampanoag": { imageUrl: "https://upload.wikimedia.org/w.jpg", credit: "Wikipedia · Wampanoag" } },
  track: { mode: "seq", rungLog: "kid", days: [
    { id: "d1", n: 1, t: "Who were the Wampanoag?", res: { links: [{ url: "https://youtu.be/wamp", label: "The first Thanksgiving", kind: "video" }], books: [{ title: "Squanto", by: "J. Bulla" }] }, cards: [{ deck: "Thanksgiving", names: ["Wampanoag", "Mayflower"] }], rungs: { little: "Point to the ocean.", early: "Who came on the ship?", upper: "Why did they leave England?" }, words: { title: "Over the River", by: "L. M. Child", text: "Over the river, and through the wood,\nTo Grandfather's house we go", parts: { little: "Over the river", middle: "To Grandfather's house we go" } }, read: { mode: "listen", what: "Squanto ch 1", url: "https://firebasestorage.googleapis.com/x/sq1.mp3" }, note: "Say Wampanoag slowly: WAHM-pah-NO-ag.", nb: { activity: "turkey" }, place: { name: "Plymouth", img: "https://upload.wikimedia.org/plymouth.jpg", caption: "Plymouth Harbor", license: "CC BY-SA" } },
    { id: "d2", n: 2, t: "The Mayflower", res: { links: [{ url: "https://site.example/mayflower", label: "Mayflower II" }] } }] } } });
const BLOCKS = () => ({ ft: { name: "Family Time", kids: ROSTER.slice(), days: ["Mon", "Tue", "Wed", "Thu"], at: "lunch", items: [
  { key: "th", name: "Thanksgiving", minutes: 30, track: { mode: "seq", list: [{ t: "Day 1 — Who were the Wampanoag?", n: 1, u: { id: "thanksgiving", d: "d1" } }, { t: "Day 2 — The Mayflower", n: 1, u: { id: "thanksgiving", d: "d2" } }] } },
  { key: "r", name: "Read Aloud", minutes: 20 }] } });
const TASKS = () => { const out = []; ROSTER.forEach(k => { out.push({ id: "th_" + k, who: k, famBlock: "ft", famItem: "th", day: "wednesday", time: "1:00 PM", title: "🏡 Thanksgiving" }); out.push({ id: "r_" + k, who: k, famBlock: "ft", famItem: "r", day: "wednesday", time: "1:30 PM", title: "🏡 Read Aloud" }); }); out.push({ id: "math_andrew", who: "andrew", subjectKey: "math", day: "wednesday", time: "9:00 AM" }); return out; };
function world(o) {
  o = o || {}; const writes = [], taps = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, WeakMap, URL,
    unitStudies: o.units || UNITS(), ROSTER: ROSTER.slice(), ROSTER_DEF: JSON.parse(J(ROSTER_DEF)), KID_NAME: Object.fromEntries(ROSTER_DEF.map(k => [k.id, k.name])),
    momHereCards: () => o.mom !== false, momHere: () => o.mom !== false, _dryRun: () => !!o.dry, db: { ref: p => ({ set: v => writes.push([p, JSON.parse(J(v))]) }) },
    rulesData: { familyBlocks: BLOCKS() }, famDefs: () => ctx.rulesData.familyBlocks, famList: x => Array.isArray(x) ? x.filter(v => v != null) : (x && typeof x === "object" ? Object.keys(x).sort().map(k => x[k]).filter(v => v != null) : []),
    famTrack: it => (it && it.track && (it.track.mode === "week" || it.track.mode === "seq")) ? it.track : null, famItemOf: t => { const b = ctx.famDefs()[t.famBlock]; return b ? ctx.famList(b.items).find(it => it && it.key === t.famItem) || null : null; },
    famLessonFor: t => t.famItem === "th" ? (o.label || "Day 1 — Who were the Wampanoag?") : "", famIsAbsent: t => !!(t && t.famAbsent), famPresLeads: () => false, famBoState: () => null,
    weekData: { tasks: o.tasks || TASKS() }, getActiveTasks: () => ctx.weekData.tasks, _todayDay: "wednesday", effectiveDay: t => t.day, checked: o.checked || {}, toMin: s => { const m = /^(\d+):(\d+)\s*(AM|PM)/i.exec(s || ""); if (!m) return 0; let h = +m[1]; if (/PM/i.test(m[3]) && h !== 12) h += 12; return h * 60 + +m[2]; },
    routineDateISO: () => "2026-10-21", cbTodayISO: () => "2026-10-21", _todayStr: () => "Wednesday, October 21", lidsFor: () => null, llLessonKey: () => "", currData: { subjects: {}, resources: { _family: { fam_ft_r: { _subject: { links: [{ url: "https://read.example/book", label: "Tonight's chapter" }] } } } } },
    frCardRec: t => { const sk = "fam_ft_" + t.famItem; const r = (((ctx.currData.resources._family || {})[sk] || {})._subject) || {}; const d = ctx.utDayForTask ? ctx.utDayForTask(t) : null; const links = (r.links || []).concat((d && d.res && d.res.links) || []); return { links: links, supplies: [], books: (d && d.res && d.res.books) || [], orders: [], notes: "", _from: {} }; },
    lrSafeUrl: u => /^https:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "", lrEsc: s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), lrHost: u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return "link"; } },
    _unitActs: u => u.activities || [], cap: s => s ? s[0].toUpperCase() + s.slice(1) : s, tab: "kids", renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0, window: { scrollTo: () => {} }, gwShowToast: m => { ctx.toast = m; },
    tapTask: id => { taps.push(id); } };
  vm.createContext(ctx);
  vm.runInContext(cut("// UNITTRACK_START", "// UNITTRACK_END") + "\n" + fn("lrClean") + "\n" + fn("lrList") + "\n" + fn("lrStr") + "\n" + fn("lrDate") + "\n" + fn("lrLinksFor") + "\n" + fn("lrLinkA") + "\n" + DC, ctx);   // dcState is a var: it already sits on the vm global
  return { ctx, writes, taps };
}

console.log("── the doors open the same view ──");
{
  const w = world(), c = w.ctx;
  const btn = c.dcCardBtnHTML({ id: "th_caleb", who: "caleb", famBlock: "ft", famItem: "th", day: "wednesday" }, false);
  ok("each kid's family card gets Open today's card (today, not done)", /Open today’s card/.test(btn) && /dcOpen\('ft','th_caleb'\)/.test(btn));
  ok("…not on a done card, not on another day, not on a kid's own subject", c.dcCardBtnHTML({ id: "x", famBlock: "ft", famItem: "th", day: "wednesday" }, true) === "" && c.dcCardBtnHTML({ id: "x", famBlock: "ft", famItem: "th", day: "thursday" }, false) === "" && c.dcCardBtnHTML({ id: "m", who: "andrew", subjectKey: "math", day: "wednesday" }, false) === "");
  ok("the Corner tile shows when a block runs today; Mom's Day Now has one row per block, opening the same view", /Today’s card/.test(c.dcTileHTML()) && /dcOpen\(\)/.test(c.dcTileHTML()) && c.dcNowHTML().n === 1 && /dcOpen\('ft'\)/.test(c.dcNowHTML().html) && /Who were the Wampanoag\?/.test(c.dcNowHTML().html));
  ok("dcOpen from the kid's card lands on that card's group; the body class and the page follow", c.dcOpen("ft", "th_caleb") === true && c.dcState.bid === "ft" && c.dcState.key === "th" && c.dcOn() === true && c.repaints === 1 && /data-dc-board="1"/.test(c.dcPageHTML()));
  ok("dcOpen with nothing today → a toast, no view", (() => { const c2 = world({ tasks: [] }).ctx; return c2.dcOpen() === false && /No family time/.test(c2.toast) && !c2.dcOn(); })());
  ok("dcClose clears it; a tab tap clears it too (showTab's line)", (c.dcClose(), !c.dcOn()) && /if\(typeof dcState!=="undefined"\) dcState=null;/.test(fn("showTab")));
}
console.log("\n── a unit day with every part ──");
{
  const w = world(), c = w.ctx; c.dcOpen("ft", "th_taylor"); const h = c.dcPageHTML();
  ok("header: block · item · Day 1; the title big; the unit's emoji in the colour-emoji stack", /Family Time · Thanksgiving · Day 1/.test(h) && /<h1[^>]*>.*Who were the Wampanoag\?/.test(h) && /class="memoji"/.test(h));
  ok("the feature: the place's picture by URL with its caption and license", /plymouth\.jpg/.test(h) && /Plymouth Harbor/.test(h) && /CC BY-SA/.test(h) && !/data:/.test(h));
  ok("the book: title and author", /Squanto/.test(h) && /by J\. Bulla/.test(h));
  ok("▶ the video / link menu from the card's record (lrLinksFor): the video first, big", /youtu\.be\/wamp/.test(h) && /▶ The first Thanksgiving/.test(h));
  ok("the activity it queues, with its points and line", /Hand turkey/.test(h) && /5 ⭐/.test(h) && /Trace your hand/.test(h));
  ok("the cards it opens, with pictures from the unit's visuals (or the emoji tile)", /Wampanoag/.test(h) && /upload\.wikimedia\.org\/w\.jpg/.test(h) && /Mayflower/.test(h));
  ok("the rungs by level with each present kid's name from the roster's grade: Little → Caleb · Early → Andrew · Upper → Taylor; Middle has no question", /Little<\/span><span[^>]*>Caleb/.test(h) && /Early<\/span><span[^>]*>Andrew/.test(h) && /Upper<\/span><span[^>]*>Taylor/.test(h) && !/Middle/.test(h.slice(h.indexOf("🪜 Rungs"), h.indexOf("📜 Words on the screen"))) && /Why did they leave England\?/.test(h));
  ok("the level mapping: PreK → little · 1 → early · 4 → middle · 7 → upper · no grade → middle (schoolAge) / little", c.dcLevel("caleb") === "little" && c.dcLevel("andrew") === "early" && c.dcLevel("makenzie") === "middle" && c.dcLevel("taylor") === "upper" && (c.ROSTER_DEF.push({ id: "zed", name: "Zed", schoolAge: true }), c.dcLevel("zed") === "middle") && (c.ROSTER_DEF.push({ id: "wee", name: "Wee", schoolAge: false }), c.dcLevel("wee") === "little"));
  ok("rungLog 'kid': Mom sees ✓ ✗ per kid on each rung", /dcRungMark\('thanksgiving','d1','caleb','little',true\)/.test(h) && /dcRungMark\('thanksgiving','d1','taylor','upper',false\)/.test(h));
  ok("the words: 📜 Show the words folded, the parts by level with the kids at that level", /📜 Show the words/.test(h) && !/data-dc-words/.test(h) && /Over the river<\/span><span[^>]*>Caleb/.test(h) && /To Grandfather's house we go<\/span><span[^>]*>Makenzie/.test(h));
  c.dcWordsToggle(); const h2 = c.dcPageHTML();
  ok("…Show → the full text on the screen, pre-wrap, Fraunces", /data-dc-words="1"/.test(h2) && /Over the river, and through the wood,\nTo Grandfather/.test(h2) && /📜 Hide the words/.test(h2));
  ok("the read strand: 🎧 Listen plays the day's recording (an audio element, preload none)", /🎧 Listen — Squanto ch 1/.test(h) && /<audio controls preload="none" src="https:\/\/firebasestorage\.googleapis\.com\/x\/sq1\.mp3"/.test(h));
  ok("the note under the card", /WAHM-pah-NO-ag/.test(h));
  ok("Mom's close bar: ✓ Done — everyone with who is present; nothing written on draw", /✓ Done — everyone/.test(h) && /Taylor, Makenzie, Andrew, Caleb/.test(h) && w.writes.length === 0);
  ok("the strip lists both items of the block (Thanksgiving · Read Aloud) and the date", /Read Aloud/.test(h) && /Wednesday, October 21/.test(h));
}
console.log("\n── the read strand's other modes; a day with none of the parts; a plain item ──");
{
  const c = world().ctx; c.unitStudies.thanksgiving.track.days[0].read = { mode: "mom", what: "Squanto ch 2" }; c.dcOpen("ft", "th_taylor");
  ok("📖 Mom reads — what", /📖 Mom reads — Squanto ch 2/.test(c.dcPageHTML()));
  c.unitStudies.thanksgiving.track.days[0].read = { mode: "recite", what: "the poem" }; c.utTouched(c.unitStudies.thanksgiving);
  ok("🗣 Recite — what", /🗣 Recite — the poem/.test(c.dcPageHTML()));
  c.unitStudies.thanksgiving.track.days[0].read = { mode: "listen", what: "ch 3" }; c.utTouched(c.unitStudies.thanksgiving);
  ok("listen with no recording yet → a plain line, no player", /No recording on this day yet/.test(c.dcPageHTML()) && !/<audio/.test(c.dcPageHTML()));
  const c2 = world({ label: "Day 2 — The Mayflower" }).ctx; c2.dcOpen("ft", "th_taylor"); const h = c2.dcPageHTML();
  ok("a day with none of the parts: title + links only; no rungs, words, read, note, cards, activity sections", /The Mayflower/.test(h) && /Mayflower II/.test(h) && !/Rungs/.test(h) && !/Words on the screen/.test(h) && !/<audio/.test(h) && !/Note<\/div>/.test(h) && !/Cards this day opens/.test(h) && !/Today’s activity/.test(h));
  const c3 = world().ctx; c3.dcOpen("ft", "th_taylor"); c3.dcPick("ft", "r"); const hr = c3.dcPageHTML();
  ok("a family item with no unit day draws as the Schedule does: its name, its lesson label (none here), its FAMRES links", /Family Time · Read Aloud/.test(hr) && /Tonight's chapter/.test(hr) && !/data-dc-words/.test(hr) && /✓ Done — everyone/.test(hr));
  const c4 = world().ctx; c4.rulesData.familyBlocks.ft.items[1] = { key: "r", name: "Read Aloud", minutes: 20 }; c4.currData.resources = {}; c4.dcOpen("ft", "r_taylor");
  ok("…and with no links and no label: 'Just the time together'", /Just the time together/.test(c4.dcPageHTML()));
}
console.log("\n── rungs: hidden without a question; logging per the unit's switch ──");
{
  const w = world(), c = w.ctx; c.dcOpen("ft", "th_taylor");
  ok("rungLog 'kid': a tap writes ONE set unitLog/<unit>/<day>/<kid> = {rung, ok, at} and shows the mark", c.dcRungMark("thanksgiving", "d1", "caleb", "little", true) === true && w.writes.length === 1 && w.writes[0][0] === "unitLog/thanksgiving/d1/caleb" && w.writes[0][1].rung === "little" && w.writes[0][1].ok === true && w.writes[0][1].at > 0 && /background:#166534/.test(c.dcPageHTML()), w.writes);
  ok("✗ writes its own record (ok false); a second tap on the same kid overwrites the one leaf", c.dcRungMark("thanksgiving", "d1", "caleb", "little", false) && w.writes.length === 2 && w.writes[1][0] === "unitLog/thanksgiving/d1/caleb" && w.writes[1][1].ok === false);
  ok("a bad level, an unknown unit or a kid's device → nothing", c.dcRungMark("thanksgiving", "d1", "caleb", "giant", true) === false && c.dcRungMark("nope", "d1", "caleb", "little", true) === false && w.writes.length === 2);
  const n = world(), cn = n.ctx; cn.unitStudies.thanksgiving.track.rungLog = "none"; cn.dcOpen("ft", "th_taylor"); const hn = cn.dcPageHTML();
  ok("rungLog 'none' (the default): the questions show, no ✓ ✗ marks, a tap writes nothing", /Point to the ocean\./.test(hn) && !/dcRungMark/.test(hn) && cn.dcRungMark("thanksgiving", "d1", "caleb", "little", true) === false && n.writes.length === 0);
  const k = world({ mom: false }).ctx; k.dcOpen("ft", "th_taylor"); const hk = k.dcPageHTML();
  ok("a kid's device: the rungs and words show, no marks, no ✓ button — 'Mom checks this off for everyone'", /Point to the ocean\./.test(hk) && !/dcRungMark/.test(hk) && !/dcCheck\(\)/.test(hk) && /Mom checks this off for everyone/.test(hk));
  const d = world({ dry: true }), cd = d.ctx; cd.dcOpen("ft", "th_taylor"); cd.dcRungMark("thanksgiving", "d1", "caleb", "little", true);
  ok("dry run: the mark shows, nothing is written", d.writes.length === 0 && /background:#166534/.test(cd.dcPageHTML()));
}
console.log("\n── the close ──");
{
  const w = world(), c = w.ctx; c.dcOpen("ft", "th_taylor");
  ok("Mom's ✓ calls the existing check path once, on the first open copy (tapTask → the dialog / ⭐ screen → finalizeDone fans out)", c.dcCheck() === true && w.taps.length === 1 && w.taps[0] === "th_taylor");
  ok("a kid's device never checks", world({ mom: false }).ctx.dcCheck() === false);
  ok("an absent kid's copy is skipped: the first HERE copy is tapped, and the present list leaves them out", (() => { const t = TASKS(); t[0].famAbsent = true; const w2 = world({ tasks: t }), c2 = w2.ctx; c2.dcOpen("ft"); c2.dcCheck(); return w2.taps[0] === "th_makenzie" && !/Taylor,/.test(c2.dcPageHTML()); })());
  const ck = {}; ROSTER.forEach(k => { ck["th_" + k] = "1:32 PM"; }); const dn = world({ checked: ck }), cdn = dn.ctx; cdn.dcOpen("ft", "th_taylor"); const hd = cdn.dcPageHTML();
  ok("every copy checked → 'You anchored the day.' and 'Now off you go →' (closes the board); the strip ticks the item; no ✓ button", /You anchored the day\./.test(hd) && /Now off you go →/.test(hd) && /dcClose\(\)/.test(hd) && /✓ Thanksgiving/.test(hd) && !/dcCheck\(\)/.test(hd) && cdn.dcCheck() === false);
  ok("dcOpen with no task lands on the first block not yet done (Read Aloud here)", (() => { const c2 = world({ checked: ck }).ctx; c2.dcOpen(); return c2.dcState.key === "r"; })());
  ok("Mom's Day Now leaves out a block whose items are all done", (() => { const all = {}; ROSTER.forEach(k => { all["th_" + k] = "x"; all["r_" + k] = "x"; }); return world({ checked: all }).ctx.dcNowHTML().n === 0; })());
}
console.log("\n── the hooks, the block ──");
{
  ok("renderAll: the body class and the page while the board is open (guarded, before the tab switch)", /document\.body\.classList\.toggle\("dc-board",typeof dcOn==="function"&&dcOn\(\)\)/.test(src) && /if\(typeof dcOn==="function"&&dcOn\(\)\)\{ const _dc=document\.getElementById\("content"\); if\(_dc\) _dc\.innerHTML=dcPageHTML\(\); return; \}/.test(src));
  ok("the family card, the Corner picker and Mom's Day Now carry their guarded lines", /\(\(typeof dcCardBtnHTML==="function"\)\?dcCardBtnHTML\(t,done\):''\)/.test(fn("famRowHTML")) && /if\(typeof dcTileHTML==="function"\) h\+=dcTileHTML\(\);/.test(fn("renderKidsCorner")) && /if\(typeof dcNowHTML==="function"\)\{ const _dc=dcNowHTML\(\); nowN\+=_dc\.n; h\+=_dc\.html; \}/.test(src));
  ok("the CSS hides the app's chrome on the board as it does for a kid's study", /body\.dc-board #app-header,body\.dc-board #nav-tabs/.test(src) && /body\.dc-board\{background:#0f172a\}/.test(src));
  ok("the Family tab's Today's card buttons open the board now that it exists", /\(typeof dcOpen==="function"\)\?"dcOpen\('"\+utsJ\(id\)\+"'\)"/.test(cut("// UNITSTAB_START", "// UNITSTAB_END")));
  ok("light: one write path (the rung log), nothing at boot (functions and two state vars only), no data URIs", (DC.match(/db\.ref\(/g) || []).length === 1 && /db\.ref\("unitLog\/"\+uid\+"\/"\+dayId\+"\/"\+kid\)\.set\(rec\)/.test(DC) && !/data:image/.test(DC) && /^(\/\/.*|var dcState=null;.*|let dcLog=\{\};.*|const DC_[A-Z_]+=.*|function .*|\}.*|  .*|\s*)$/m.test(DC));
  ok("no kid's name in the block; no shuffle emoji in index.html", !/lincoln|ellis|lucy|julian/i.test(DC.replace(/\/\/.*$/gm, "")) && src.indexOf("🔀") < 0);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
