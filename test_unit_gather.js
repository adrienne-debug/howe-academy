// 🧾 UNITGATHER — one gatherer for a unit's things (PLAN_unit_sheet_2026-11-19.md §4.0, §5 row 2, §8.2 slice 2 lean; go 2026-11-22).
// Pure: runs the REAL index.html readers (LESSONRES, UNITTRACK, CRAFT, UNITDAY_EXTRAS, UNITDAY_GAME, _unitActs, UNITGATHER) on a
// made-up Builder-shaped unit (6 days + an off day, two activities on one day, a craft, a snack, a game, a PDF, 10 cards). No names.
//  · no repeats (a supply, a book, a PDF on two days is one line with both days); "mom" items flagged; off days left out;
//  · both activities of a two-activity day; an activity with no `type` = notebook (a notebook page to print); `type` read
//    defensively (known words only); a printable's PDF and a hands-on's supplies read only when there;
//  · lists stored as objects (an array that came back keyed) still read; https links only; nothing written, the unit untouched.
//   run: node test_unit_gather.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 700) : "")); } };
const J = x => JSON.stringify(x);
const cut = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return s.slice(i, j); };
const fnIn = (s, name) => { const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < s.length; j++) { const c = s[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return s.slice(i, j + 1); };

console.log("── wiring ──");
const g0 = src.indexOf("// UNITGATHER_START"), g1 = src.indexOf("// UNITGATHER_END");
ok("one UNITGATHER block, right before UNITPREP", g0 > 0 && g1 > g0 && src.indexOf("// UNITGATHER_START", g0 + 1) < 0 && src.indexOf("// UNITGATHER_END\n// UNITPREP_START") === g1);
const blk = src.slice(g0, g1);
ok("pure: no database, no screen, no write in the block", !/\bdb\b|\.ref\(|\.set\(|\.update\(|\.remove\(|\.transaction\(|firebase|document\.|window\.|renderAll|localStorage|HA_LS/.test(blk));
ok("no assignment to the unit, a day or an activity", !/\b(u|d|dd|a|day)\.[a-zA-Z_]+\s*=[^=]/.test(blk));
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;
ok("no kid or family name in the block", !NAMES.test(blk), (blk.match(NAMES) || [])[0]);
ok("no 🔀 emoji", blk.indexOf("\u{1F500}") < 0);
const testTxt = fs.readFileSync(__filename, "utf8").split("\n").filter(l => !/^const NAMES =/.test(l)).join("\n");
ok("this test file names no real kid or family", !NAMES.test(testTxt), (testTxt.match(NAMES) || [])[0]);

// ── a made-up Builder-shaped unit ──
const keyed = a => a.reduce((o, x, i) => (o[String(i)] = x, o), {});   // how an array can come back from the database
const UNIT = () => ({ id: "bugs", title: "Backyard Bugs", emoji: "🐞", enrolled: { kida: true, kidb: true },
  decks: [{ key: "Bugs", cards: Array.from({ length: 10 }, (_, i) => ({ name: "Bug " + (i + 1), def: "DEF" + i })) }],
  activities: [
    { key: "draw", title: "Draw a bug", emoji: "🖍", points: 5 },                                    // no type → notebook; Day 2's nb one
    { key: "label", title: "Label the parts", day: 2 },                                             // no type → notebook; Day 2 by number
    { key: "watch", title: "Watch the ants", day: 3, type: "screen" },
    { key: "hunt", title: "Bug hunt sheet", day: 6, type: "print", pdf: { url: "https://files.example.org/hunt.pdf", title: "hunt" } },
    { key: "jar", title: "Build a bug jar", day: 5, type: " Hands ", supplies: "1 glass jar\nGlue\nscissors | mom" },
    { key: "site", title: "Bug site", day: 4, type: "link", url: "https://bugs.example.org" },
    { key: "odd", title: "Mystery kind", day: 4, type: "zzz" },
    { key: "nb2", title: "Bug diary", day: 1, type: 42 },                                            // not a string → notebook
    { key: "kit", title: "Kit project", day: 3, type: "hands", supplies: keyed([{ name: "pipe cleaners", qty: "6" }, { name: "Glue" }, "tape | mom"]) },
    { key: "free", title: "Any-day poster" },                                                       // on no day
    { key: "offact", title: "On the off day", day: 7 }],                                            // on the off day
  track: { mode: "seq", perWeek: 4, craft: { title: "Bug mobile", supplies: [{ name: "string" }] }, days: [
    { id: "d1", n: 1, t: "Bugs up close", res: { books: [{ title: "The Big Bug Book", by: "A. Writer" }], links: [{ url: "https://www.youtube.com/watch?v=x", kind: "video" }],
      docs: [{ url: "https://files.example.org/bug-sheet.pdf", title: "Bug sheet", kind: "pdf" }, { url: "https://files.example.org/pic.jpg", title: "Picture", kind: "image" }, { url: "http://insecure.example.org/a.pdf", title: "Insecure", kind: "pdf" }],
      supplies: [{ name: "magnifying glass", qty: "2" }, { name: "hot glue gun", kids: false }, { name: "glue" }], orders: [{ name: "Bug kit", url: "https://shop.example.org/kit" }, { name: "Net", url: "http://shop.example.org/net" }] } },
    { id: "d2", n: 2, t: "Insect bodies", nb: { activity: "draw" }, res: { books: keyed([{ title: "the big bug book" }, { title: "Ant Lives" }]) } },
    { id: "d3", n: 3, t: "Caterpillars", craft: { title: "Egg-carton caterpillar", supplies: [{ name: "egg carton" }, { name: "Glue", qty: "1 stick" }] } },
    { id: "d4", n: 4, t: "Ant snack day", snack: { title: "Ants on a log", supplies: [{ name: "celery" }, { name: "peanut butter", kids: false }] } },
    { id: "d5", n: 5, t: "Bug games", game: { title: "Bug bingo", supplies: [{ name: "bingo chips" }] } },
    { id: "d6", n: 6, t: "Bug parade", res: { docs: keyed([{ url: "https://files.example.org/bug-sheet.pdf", title: "Bug sheet", kind: "pdf" }, { url: "https://docs.google.com/document/d/abc", title: "Parade plan" }]) } },
    { id: "d7", n: 7, t: "Rain day", off: true, res: { books: [{ title: "OFFBOOK" }], supplies: [{ name: "OFFSUPPLY" }], docs: [{ url: "https://files.example.org/off.pdf", title: "OFFPDF", kind: "pdf" }] } }] } });

const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, WeakMap, Date, parseInt, isFinite, isNaN, fbArr: v => v, unitStudies: {} };
vm.createContext(ctx);
vm.runInContext([cut(src, "// LESSONRES_START", "// LESSONRES_END"), cut(src, "// UNITTRACK_START", "// UNITTRACK_END"), cut(src, "// CRAFT_START", "// CRAFT_END"),
  cut(src, "// UNITDAY_EXTRAS_START", "// UNITDAY_EXTRAS_END"), cut(src, "// UNITDAY_GAME_START", "// UNITDAY_GAME_END"), fnIn(src, "_unitActs"), cut(src, "// UNITGATHER_START", "// UNITGATHER_END")].join("\n"), ctx);
ok("loads with no database in the world", typeof ctx.unitGather === "function" && ctx.db === undefined);

const u = UNIT(); ctx.unitStudies.bugs = u; const before = J(u);
const G = ctx.unitGather(u);
const S = G.totals.supplies, B = G.totals.books, P = G.totals.prints, O = G.totals.orders;
const sup = n => S.find(s => s.name.toLowerCase() === n.toLowerCase());
console.log("── the whole unit ──");
ok("the unit: 6 days on (the off day not counted), 4 a week", G.unit.nDays === 6 && G.unit.perWeek === 4 && G.unit.title === "Backyard Bugs", G.unit);
ok("off days left out: no day 7, and none of its book, supply, PDF or activity anywhere", J(G.days.map(d => d.id)) === J(["d1", "d2", "d3", "d4", "d5", "d6"]) && !/OFFBOOK|OFFSUPPLY|OFFPDF|On the off day/.test(J(G)));
ok("…and the activity set to the off day is not shown as \"any day\" either", !G.loose.some(a => a.key === "offact"));
ok("no repeats: \"glue\" from Day 1, Day 3's craft (\"Glue\") and two activities is ONE line", S.filter(s => s.name.toLowerCase() === "glue").length === 1, S.map(s => s.name));
ok("…with every day it is for, in day order, and where it comes from", J(sup("glue").days) === J(["Day 1", "Day 3", "Day 5"]) && J(sup("glue").from.slice().sort()) === J(["act", "craft", "day"]) && J(sup("glue").qtys) === J(["1 stick"]), sup("glue"));
ok("every supply once", S.length === new Set(S.map(s => s.name.toLowerCase())).size);
ok("amounts kept: magnifying glass (2), pipe cleaners (6)", J(sup("magnifying glass").qtys) === J(["2"]) && J(sup("pipe cleaners").qtys) === J(["6"]));
ok("where from: ✂️ craft (egg carton, the unit craft's string on Day 1), 🍎 snack (celery), 🎲 game (bingo chips), 🧪 activity (glass jar)", J(sup("egg carton").from) === J(["craft"]) && J(sup("string").from) === J(["craft"]) && J(sup("string").days) === J(["Day 1"]) &&
  J(sup("celery").from) === J(["snack"]) && J(sup("bingo chips").from) === J(["game"]) && J(sup("1 glass jar").from) === J(["act"]));
ok("\"mom\" items flagged: the day's kids:false supply, the snack's, and an activity's \"| mom\" line (text and list)", sup("hot glue gun").mom && sup("peanut butter").mom && sup("scissors").mom && sup("tape").mom);
ok("…and nothing else is flagged", S.filter(s => s.mom).map(s => s.name).sort().join("|") === "hot glue gun|peanut butter|scissors|tape", S.filter(s => s.mom).map(s => s.name));
ok("books: no repeats (case aside), the author kept, both days", B.length === 2 && B[0].title === "The Big Bug Book" && B[0].by === "A. Writer" && J(B[0].days) === J(["Day 1", "Day 2"]) && B[1].title === "Ant Lives", B);
ok("orders: https link kept, an http one dropped (the order stays, no link)", O.length === 2 && O[0].url === "https://shop.example.org/kit" && O[1].name === "Net" && O[1].url === "", O);
const pr = k => P.filter(p => p.title === k);
ok("prints: the same PDF on Day 1 and Day 6 is ONE line with both days", pr("Bug sheet").length === 1 && J(pr("Bug sheet")[0].days) === J(["Day 1", "Day 6"]) && pr("Bug sheet")[0].kind === "pdf");
ok("prints: a document (Google Docs) counts; a picture and an http PDF don't", pr("Parade plan").length === 1 && pr("Parade plan")[0].kind === "doc" && !pr("Picture").length && !pr("Insecure").length);
ok("both activities of the two-activity day", J(G.days[1].acts.map(a => a.key)) === J(["draw", "label"]));
ok("…and each is a notebook page to print (no type = notebook)", pr("Draw a bug")[0].kind === "notebook" && pr("Label the parts")[0].kind === "notebook" && J(pr("Draw a bug")[0].days) === J(["Day 2"]));
ok("type read defensively: \" Hands \" = hands, 42 = notebook, \"zzz\" = other", G.days[4].acts.find(a => a.key === "jar").type === "hands" && G.days[0].acts.find(a => a.key === "nb2").type === "notebook" && G.days[3].acts.find(a => a.key === "odd").type === "other");
ok("a printable activity prints with its PDF; screen, link, hands-on and unknown kinds print no page", pr("Bug hunt sheet")[0].kind === "print" && pr("Bug hunt sheet")[0].url === "https://files.example.org/hunt.pdf" &&
  !pr("Watch the ants").length && !pr("Bug site").length && !pr("Build a bug jar").length && !pr("Mystery kind").length && !pr("Kit project").length);
ok("an activity on no day shows for the whole unit only, as \"any day\"", G.loose.length === 1 && G.loose[0].key === "free" && J(pr("Any-day poster")[0].days) === J(["any day"]));
ok("every address on the sheet is https", P.concat(O).every(x => !x.url || /^https:\/\//.test(x.url)));
ok("copies: ×1 when nothing is said", P.every(p => p.n === 1));
ok("the unit is untouched (nothing written into it)", J(u) === before);

console.log("── lists stored as objects ──");
{
  const raw = UNIT();
  raw.activities = keyed(raw.activities); raw.track.days = keyed(raw.track.days);
  raw.track.days["0"].res.supplies = keyed(raw.track.days["0"].res.supplies); raw.track.days["0"].res.docs = keyed(raw.track.days["0"].res.docs); raw.track.days["0"].res.orders = keyed(raw.track.days["0"].res.orders);
  raw.track.days["2"].craft.supplies = keyed(raw.track.days["2"].craft.supplies);
  raw.id = "bugs2"; ctx.unitStudies.bugs2 = raw;
  const K = ctx.unitGather(raw);
  ok("keyed activities, days, supplies, docs, orders, craft supplies: the same lists as the arrays", J(K.totals) === J(G.totals) && J(K.days) === J(G.days) && J(K.loose) === J(G.loose), [K.totals.supplies.length, G.totals.supplies.length]);
}

console.log("── a week ──");
{
  const W = ctx.unitGather(u, { days: ["d2", "d3", "d7"], when: { d2: "Tue", d3: "Thu", d7: "Fri" }, copies: { d2: 1, d3: 3 } });
  ok("only the days asked for (the off one still out)", J(W.days.map(d => d.id)) === J(["d2", "d3"]));
  ok("the label carries the weekday: \"Tue · Day 2\"", W.days[0].label === "Tue · Day 2" && J(W.totals.prints.find(p => p.title === "Draw a bug").days) === J(["Tue · Day 2"]));
  ok("copies follow the day: Day 2 ×1, Day 3 ×3", W.totals.prints.find(p => p.title === "Draw a bug").n === 1 && W.totals.supplies.find(s => s.name === "egg carton").days[0] === "Thu · Day 3");
  ok("no \"any day\" activity in a week", W.loose.length === 0 && !W.totals.prints.some(p => p.title === "Any-day poster"));
  ok("Day 1's things are not in a week without Day 1", !W.totals.books.some(b => b.title === "The Big Bug Book" && b.days.indexOf("Tue · Day 2") < 0) && !W.totals.supplies.some(s => s.name === "magnifying glass"));
  const W3 = ctx.unitGather(u, { days: ["d6"], copies: { d6: 3 } });
  ok("a per-kid day ×3: the PDF and the printable activity", W3.totals.prints.every(p => p.n === 3) && W3.totals.prints.length === 3, W3.totals.prints);
  const W0 = ctx.unitGather(u, { days: [] });
  ok("a week with no unit day: empty lists, no throw", W0.days.length === 0 && ["supplies", "books", "orders", "prints"].every(k => !W0.totals[k].length));
  const Wn = ctx.unitGather(u, { n: 4 });
  ok("the whole unit with n = 4: every print ×4", Wn.totals.prints.every(p => p.n === 4));
}

console.log("── odd units ──");
ok("a unit with no track and no activities: empty, no throw", J(ctx.unitGather({ id: "x", title: "Nothing" }).totals) === J({ supplies: [], orders: [], books: [], prints: [] }));
ok("activities only, no days: each shows as \"any day\"", (() => { const g = ctx.unitGather({ id: "y", activities: [{ key: "a", title: "Poster" }, { key: "b", title: "Kit", type: "hands", supplies: ["tape"] }] }); return g.loose.length === 2 && g.totals.prints.length === 1 && g.totals.supplies[0].name === "tape" && J(g.totals.supplies[0].days) === J(["any day"]); })());
ok("a printable with its PDF as a bare address, and one with an http address (dropped)", (() => { const g = ctx.unitGather({ id: "z", activities: [{ key: "a", title: "P1", type: "print", pdf: "https://x.example.org/a.pdf" }, { key: "b", title: "P2", type: "print", pdf: "http://x.example.org/b.pdf" }] }); return g.totals.prints[0].url === "https://x.example.org/a.pdf" && g.totals.prints[1].url === ""; })());

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
