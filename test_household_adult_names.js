/*
 * 🏡 HHNAMES — a household's two adults are shown by their names (her decision 2026-11-24: her mother is Wendy, her husband is
 * David, and he "shows by name as a person jobs and gifts can belong to, with no page of his own yet" — DESIGN_household_edition_2026-11-24.md
 * §5.3 adult display names; slice 5's names half).
 *
 * Runs the WHOLE app (test_fixtures/demo_week_sandbox.js) with house.js, seasons.js, gifts.js and bigmeal.js loaded, on this tree and on
 * "the app before" (this tree with the slice taken out, place by place — no git), and checks:
 *   0. the block, and strip() undoing the slice in every file it touches
 *   1. EVERY OTHER FAMILY IS UNCHANGED: the made-up demo family's Mom's Day pages, Household views, laundry lines and its database
 *      writes are byte for byte the same on both trees
 *   2. a household WITH adults:{mom:"Wendy", dad:"David"} shows Wendy and David in every place changed, and never "Mom" / "Dad" as
 *      that person's label there (🧹 Household pickers / chips / views, 🧺 laundry on Home Base, 🎉 Seasons & Events, 🎁 Gifts' groups)
 *   3. a household WITHOUT adults, and an ordinary family WITH an adults key, show exactly what they showed before
 *   4. nothing written to the database differs, on any of them — the same laundry tap included
 *
 *   run:  node test_household_adult_names.js
 */
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), os = require("os"), vm = require("vm");
const SB = require(path.join(__dirname, "test_fixtures", "demo_week_sandbox.js"));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "test_fixtures", "living_demo_family.json"), "utf8"));
const LAZY = ["house.js", "seasons.js", "gifts.js", "bigmeal.js"];
const SRC = {}; ["index.html"].concat(LAZY).forEach(f => { SRC[f] = fs.readFileSync(path.join(__dirname, f), "utf8"); });

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + (typeof extra === "string" ? extra : JSON.stringify(extra)).slice(0, 600) + ")" : "")); }
}
const clone = v => JSON.parse(JSON.stringify(v));

// ── 0. the slice, and the app before it ────────────────────────────────────────────────────────────────────────
// Every place the slice changed, per file, as [what, the text now, the text before]. strip() puts each "before" back and insists every
// one matches exactly once — a later change to one of these places fails here, by name, instead of passing blind.
const SLICE = {
 "index.html": [ ["block", "// HHHOME_END\n// HHNAMES_START — 🏡 a household's two adults are shown by their names (her decision 2026-11-24: her mother is Wendy, her husband is\n// David, and he \"shows by name as a person jobs and gifts can belong to, with no page of his own yet\" — DESIGN_household_edition_2026-11-24.md\n// §5.3 \"Adult display names: config adults:{mom:\\\"…\\\", dad:\\\"…\\\"} so pickers and gift lists show their names instead of Mom and Dad\").\n// For a household (a family file with kind household) whose family file has adults:{mom:\"Wendy\", dad:\"David\"} only. Every call site is\n// marked 🏡 HHNAMES and keeps its own words as the fallback, so every other family — and a household without adults — reads exactly as\n// before. Only what is SHOWN changes: the data keys stay mom / dad everywhere. No database reads or writes, nothing stored.\nfunction haAdult(id,fallback){ try{ if((typeof HA_HOUSEHOLD!==\"undefined\")&&HA_HOUSEHOLD&&(id===\"mom\"||id===\"dad\")){ const A=window.HA_FAMILY&&window.HA_FAMILY.adults, n=(A&&typeof A[id]===\"string\")?A[id].trim():\"\"; if(n) return n; } }catch(e){} return fallback; }\n// HHNAMES_END\n", "// HHHOME_END\n" ], ["hhWhoName", "function hhWhoName(w){ /* 🏡 HHNAMES */ return w===\"mom\"?(typeof haAdult===\"function\"?haAdult(\"mom\",\"Mom\"):\"Mom\"):w===\"dad\"?(typeof haAdult===\"function\"?haAdult(\"dad\",\"Dad\"):\"Dad\"):w===\"grab\"", "function hhWhoName(w){ return w===\"mom\"?\"Mom\":w===\"dad\"?\"Dad\":w===\"grab\"" ], ["llName", "function llName(w){ /* 🏡 HHNAMES */ return w===\"both\"?(typeof haAdult===\"function\"?haAdult(\"mom\",\"Mom\")+\" or \"+haAdult(\"dad\",\"Dad\"):\"Mom or Dad\"):w===\"mom\"?(typeof haAdult===\"function\"?haAdult(\"mom\",\"Mom\"):\"Mom\"):w===\"dad\"?(typeof haAdult===\"function\"?haAdult(\"dad\",\"Dad\"):\"Dad\"):", "function llName(w){ return w===\"both\"?\"Mom or Dad\":w===\"mom\"?\"Mom\":w===\"dad\"?\"Dad\":" ], ["sick toast", "mwToast(on?llName(\"mom\")+'\\'s back on the laundry':", "mwToast(on?'Mom\\'s back on the laundry':" ], ["sick ask", "(d===\"mom\"?'🤒 '+esc(llName(\"mom\"))+'\\'s sick':'😷 '", "(d===\"mom\"?'🤒 Mom\\'s sick':'😷 '" ], ["sick button", "🤒 '+esc(llName(\"mom\"))+(on?'\\'s sick today ✓':'\\'s sick today')+'</button>'; }   // 🏡 HHNAMES: a household's own name", "🤒 '+(on?'Mom\\'s sick today ✓':'Mom\\'s sick today')+'</button>'; }" ]
 ],
 "house.js": [ ["hhRmShort", "function hhRmShort(w){ /* 🏡 HHNAMES */ return w===\"mom\"?(typeof haAdult===\"function\"?haAdult(\"mom\",\"Mom\"):\"Mom\"):w===\"dad\"?(typeof haAdult===\"function\"?haAdult(\"dad\",\"Dad\"):\"Dad\"):", "function hhRmShort(w){ return w===\"mom\"?\"Mom\":w===\"dad\"?\"Dad\":" ], ["dropped note", "    +esc(hhWhoName(\"mom\"))+'’s, '+esc(hhWhoName(\"dad\"))+'’s and Up for Grabs chores are never counted as dr", "    +'Mom’s, Dad’s and Up for Grabs chores are never counted as dr" ]
 ],
 "seasons.js": [ ["people", ".concat([SN_MOM,SN_DAD].map(p=>{const n=(typeof haAdult===\"function\")?haAdult(p.id,p.name):p.name;return n===p.name?p:Object.assign({},p,{name:n});}));}   // 🏡 HHNAMES: a household's adults by name", ".concat([SN_MOM,SN_DAD]);}" ]
 ],
 "gifts.js": [ ["groups", "const out=GF_GROUPS.map((g,i)=>{const a=(g[0]===\"mom\"||g[0]===\"dad\")&&typeof haAdult===\"function\"?haAdult(g[0],\"\"):\"\";return Object.assign({id:g[0],emoji:g[1],name:a?a+\"'s side\":g[2],order:i},S[g[0]]||{});});   // 🏡 HHNAMES: a household's \"Wendy's side\"", "const out=GF_GROUPS.map((g,i)=>Object.assign({id:g[0],emoji:g[1],name:g[2],order:i},S[g[0]]||{}));" ]
 ]
};
function strip(file, s) {
  (SLICE[file] || []).forEach(([what, now, before]) => {
    const n = s.split(now).length - 1;
    if (n !== 1) throw new Error("strip " + file + ": \"" + what + "\" matched " + n + " times");
    s = s.replace(now, () => before);
  });
  return s;
}
console.log("0. the slice, and the app before it");
const src = SRC["index.html"];
const BLOCK = src.slice(src.indexOf("// HHNAMES_START"), src.indexOf("// HHNAMES_END"));
ok("HHNAMES_START / _END once each, right after HHHOME_END", src.split("// HHNAMES_START").length === 2 && src.split("// HHNAMES_END").length === 2 && src.indexOf("// HHHOME_END\n// HHNAMES_START") > 0);
ok("the block cites her decision, the date and the design", /Wendy/.test(BLOCK) && /David/.test(BLOCK) && /no page of his own yet/.test(BLOCK) && /2026-11-24/.test(BLOCK) && /DESIGN_household_edition_2026-11-24\.md/.test(BLOCK));
ok("the block reads and writes nothing (no db, no storage, no dialog)", !/db\.ref|HA_LS|localStorage|\.set\(|\.update\(|alert\(|confirm\(|prompt\(/.test(BLOCK.replace(/^\s*\/\/.*$/gm, "")));
ok("every call outside the block sits behind typeof haAdult===\"function\" (tests slice functions out alone)", (() => { const bad = []; Object.keys(SRC).forEach(f => { const t = f === "index.html" ? SRC[f].replace(BLOCK, "") : SRC[f]; let k = -1; while ((k = t.indexOf("haAdult(", k + 1)) >= 0) { const g = t.lastIndexOf('typeof haAdult==="function"', k); if (g < 0 || k - g > 120) bad.push(f + "@" + k); } }); return bad.length === 0 && (src.replace(BLOCK, "") + LAZY.map(f => SRC[f]).join("")).split("haAdult(").length > 8; })());
const BEFORE = {}; let stripErr = "";
Object.keys(SRC).forEach(f => { try { BEFORE[f] = strip(f, SRC[f]); } catch (e) { stripErr += String(e) + " "; BEFORE[f] = SRC[f]; } });
ok("strip runs in every file (" + Object.keys(SLICE).map(f => f + " " + SLICE[f].length).join(", ") + ")", !stripErr, stripErr);
const TRACE = /HHNAMES|haAdult/;
ok("stripped: no trace of the slice left in any file", Object.keys(BEFORE).every(f => !TRACE.test(BEFORE[f])), Object.keys(BEFORE).filter(f => TRACE.test(BEFORE[f])));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "hhnames-"));
Object.keys(BEFORE).forEach(f => fs.writeFileSync(path.join(TMP, f), BEFORE[f]));

// ── worlds ─────────────────────────────────────────────────────────────────────────────────────────────────────
const AT = new Date("2026-11-24T14:00:00").getTime();   // a Tuesday afternoon
const TODAY = "2026-11-24";
const FB = { apiKey: "x", authDomain: "x.local", databaseURL: "https://x.local", projectId: "x" };
const HHBASE = { familyId: "hh_check", familyName: "Check Family", appName: "Howe Household", kind: "household", roster: [], firebase: FB };
const HH = Object.assign({}, HHBASE, { adults: { mom: "Wendy", dad: "David" } });
const NOW = __dirname, WAS = TMP;
// A made-up household's own things: chores for each adult and Up for Grabs, laundry loads for each and for "both" (Mom's sick today,
// so the who's-doing-it question shows), a season with both adults' picks and a to-do each, and a holiday with someone on each side.
const TREE = {
  household: { jobs: {
    j1: { label: "Wipe counters", emoji: "🧽", who: "mom", cad: "daily", status: "active", area: "cleaning", slot: "evening", level: 1, src: { kind: "routine" }, can: { dad: true } },
    j2: { label: "Take out trash", emoji: "🗑", who: "dad", cad: "daily", status: "active", area: "cleaning", slot: "evening", level: 1, src: { kind: "routine" } },
    j3: { label: "Water plants", emoji: "🪴", who: "grab", cad: "daily", status: "active", area: "cleaning", level: 1, src: { kind: "routine" } } } },
  laundryLine: { items: { a: { label: "Sheets", emoji: "🛏", order: 1, doer: "both", home: 1 }, b: { label: "Towels", emoji: "🛁", order: 2, doer: "dad", home: 1 }, c: { label: "Her clothes", emoji: "👗", order: 0, doer: "mom", home: 1 } } },
  seasons: { list: { s1: { name: "Christmas", emoji: "🎄", kind: "season", start: "2026-11-20", end: "2026-12-31", ts: 1 } },
    ideas: { s1: { i1: { t: "Lights drive", by: "mom", want: { mom: true, dad: true }, star: { dad: true }, ts: 1, todo: { t1: { t: "Buy cocoa", who: "dad", due: TODAY }, t2: { t: "Map route", who: "mom", due: TODAY } } } } } },
  gifts: { occasions: { o1: { name: "Christmas 2026", kind: "christmas", date: "2026-12-25", ts: 1, secs: { gifts: { name: "Gifts", emoji: "🎁", order: 0 } } } },
    people: { p1: { name: "Aunt Jo", group: "mom", ts: 1 }, p2: { name: "Uncle Ray", group: "dad", ts: 1 } } }
};
const VIEWS = ["plan", "hq", "gen", "cal", "house", "chores", "meals", "grocery", "prep", "budget", "gifts", "esa", "seasons", "weigh", "curr", "sset", "hist", "wins", "scor", "mhq", "dad", "dadcal", "dadall"];
const HHVIEWS = ["review", "habits", "week", "area", "today", "person", "levels", "once", "proj", "rot", "rooms", "laundry", "kitchen"];
async function world(family, tree, dir) {
  const clock = SB.makeClock(AT); clock.boot = clock.now; const sched = SB.makeScheduler(clock);
  const db = SB.makeDb(clone(tree || {}), clock, sched);
  const d = SB.bootDevice({ name: "A", dev: "devA", db, clock, sched, family, indexPath: path.join(dir, "index.html") });
  d.momOn(); await sched.run(clock.now + 30000);
  LAZY.forEach(f => vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), d.ctx, { filename: f }));
  d.db = db; d.clock = clock; d.sched = sched;
  d.page = (v, pre) => { d.run("__HARNESS_NO_RENDER=false; mpSubView=" + JSON.stringify(v) + "; " + (pre || "") + " tab='moms-plan'; __el={innerHTML:''}; try{ renderMomsPlan(__el); } finally { __HARNESS_NO_RENDER=true; }"); return String(d.get("__el.innerHTML") || ""); };
  d.hh = (v) => d.page("house", "hhView=" + JSON.stringify(v) + "; hhAddOpen=true;");
  d.all = () => { const o = {}; VIEWS.forEach(v => { try { o[v] = d.page(v); } catch (e) { o[v] = "THROW " + e.message; } });
    HHVIEWS.forEach(v => { try { o["house/" + v] = d.hh(v); } catch (e) { o["house/" + v] = "THROW " + e.message; } });
    ["llCoverAskHTML()", "llMomSickBtn()", "llName('both')", "llName('mom')", "llName('dad')", "hhWhoName('mom')", "hhWhoName('dad')", "hhRmShort('mom')", "hhRmShort('dad')", "hhCanLabel({who:'mom',can:['dad']})", "JSON.stringify(_gfTest.groups())"].forEach(x => { try { o[x] = String(d.run(x)); } catch (e) { o[x] = "THROW " + e.message; } });
    return o; };
  d.errors = () => sched.errors.map(e => e.err).concat(d.logs.filter(l => /^error /.test(l)));
  VIEWS.forEach(v => { try { d.page(v); } catch (e) {} }); await sched.run(clock.now + 6000);   // lazy pages have their data — a page now draws the same every time
  return d;
}
const text = h => h.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, "|").replace(/&#39;|&#x27;/g, "'");
const W = l => JSON.stringify(l.map(w => [w.op, w.path.replace(/^(connDiary\/[^/]+\/)[^/]+/, "$1*"), w.keys || null, w.n]));
const treeOf = d => { const t = clone(d.db.tree.root); delete t.connDiary; delete t._debug; return JSON.stringify(t); };
async function pair(family, tree) { const a = await world(family, tree, NOW), b = await world(family, tree, WAS); return [a, b, a.all(), b.all()]; }
function same(label, A, B, a, b) {
  const diff = Object.keys(A).filter(k => A[k] !== B[k]);
  ok(label + ": all " + Object.keys(A).length + " pages and lines byte for byte the same as before", diff.length === 0, diff.slice(0, 6));
  ok(label + ": the same database writes (" + a.db.log.length + ") and the same database after", W(a.db.log) === W(b.db.log) && treeOf(a) === treeOf(b));
  ok(label + ": no error on either", a.errors().length === 0 && b.errors().length === 0, a.errors().concat(b.errors()).slice(0, 2).map(String));
}
async function tap(a, b) {   // the same laundry taps on both trees: Mom's sick today off and on again
  [a, b].forEach(d => { try { d.run("llMomSick(); llMomSick();"); } catch (e) { d.tapErr = String(e); } });
  await a.sched.run(a.clock.now + 3000); await b.sched.run(b.clock.now + 3000);
}

(async () => {
  const sick = clone(TREE); sick.laundryLine.momSick = { [TODAY]: true };
  // ── 1. every other family is unchanged ─────────────────────────────────────────────────────────────────────
  console.log("1. every other family: this tree == the tree with the slice taken out");
  { const [a, b, A, B] = await pair(FX.family, Object.assign(clone(FX.db), { household: TREE.household, laundryLine: sick.laundryLine, gifts: TREE.gifts, seasons: TREE.seasons }));
    same("the demo family", A, B, a, b);
    ok("the demo family still reads Mom / Dad / Mom or Dad", A["llName('both')"] === "Mom or Dad" && A["hhWhoName('mom')"] === "Mom" && A["hhWhoName('dad')"] === "Dad" && A["hhRmShort('mom')"] === "Mom" && /Mom's side/.test(A["JSON.stringify(_gfTest.groups())"]));
    await tap(a, b); ok("the demo family: the same writes after the same laundry taps", !a.tapErr && !b.tapErr && W(a.db.log) === W(b.db.log) && treeOf(a) === treeOf(b), [a.tapErr, b.tapErr]);
    ok("haAdult is a household's only: the demo family gets the fallback", a.run("haAdult('mom','Mom')") === "Mom" && a.run("haAdult('dad','x')") === "x"); }

  // ── 2. a household with adults ─────────────────────────────────────────────────────────────────────────────
  console.log("2. a household with adults:{mom:\"Wendy\", dad:\"David\"}");
  const [h, hb, H, HB] = await pair(HH, sick);
  ok("haAdult: the names for mom and dad, trimmed; the fallback for anything else", h.run("haAdult('mom','Mom')") === "Wendy" && h.run("haAdult('dad','Dad')") === "David" && h.run("haAdult('grab','Up')") === "Up" && h.run("haAdult('kid_a','K')") === "K");
  ok("haAdult: a blank or non-text name falls back", (await world(Object.assign({}, HHBASE, { adults: { mom: "  ", dad: 7 } }), {}, NOW)).run("haAdult('mom','Mom')+'|'+haAdult('dad','Dad')") === "Mom|Dad");
  ok("🧹 Household's who-names: hhWhoName → Wendy / David (every picker, chip and heading uses it)", H["hhWhoName('mom')"] === "Wendy" && H["hhWhoName('dad')"] === "David" && HB["hhWhoName('mom')"] === "Mom");
  ok("🧹 the room grid's short label → Wendy / David", H["hhRmShort('mom')"] === "Wendy" && H["hhRmShort('dad')"] === "David" && HB["hhRmShort('dad')"] === "Dad");
  ok("🧹 “who else can do it” → 👥 Wendy, David", H["hhCanLabel({who:'mom',can:['dad']})"] === "👥 Wendy, David", H["hhCanLabel({who:'mom',can:['dad']})"]);
  { const pages = HHVIEWS.map(v => "house/" + v).concat(["house"]);
    const named = pages.filter(k => /\bWendy\b/.test(text(H[k])) && /\bDavid\b/.test(text(H[k])));
    ok("🧹 Household views name Wendy and David (" + named.length + " of " + pages.length + ": " + named.map(k => k.replace("house/", "")).join(" ") + ")", named.length >= 5 && named.indexOf("house/review") >= 0 && named.indexOf("house/person") >= 0, pages.filter(k => named.indexOf(k) < 0));
    const left = pages.filter(k => /\b(Mom|Dad)\b(?!'s Day|’s Day)/.test(text(H[k])));   // "Mom's Day" names a page (HHHOME's, left as a question)
    ok("🧹 …and say “Mom” / “Dad” nowhere in them as a person", left.length === 0, left.map(k => k + ": " + (text(H[k]).match(/[^|]{0,50}\b(Mom|Dad)\b(?!'s Day|’s Day)[^|]{0,40}/) || [""])[0]));
    ok("🧹 the same views before said Mom and Dad", pages.some(k => /\bMom\b/.test(text(HB[k]))) && pages.some(k => /\bDad\b/.test(text(HB[k]))));
    ok("🧹 the add form's Who picker offers Wendy and David", /<option value="mom"[^>]*>Wendy<|>Wendy</.test(H["house/review"]) && /David/.test(H["house/review"]));
    ok("🧹 the “never counted as dropped” note: Wendy’s, David’s and Up for Grabs", pages.some(k => /Wendy’s, David’s and Up for Grabs chores are never counted/.test(H[k])) && pages.some(k => /Mom’s, Dad’s and Up for Grabs chores are never counted/.test(HB[k]))); }
  ok("🧺 laundry's names: Wendy or David · Wendy · David", H["llName('both')"] === "Wendy or David" && H["llName('mom')"] === "Wendy" && H["llName('dad')"] === "David" && HB["llName('both')"] === "Mom or Dad");
  ok("🧺 the sick button: 🤒 Wendy's sick today ✓", /🤒 Wendy's sick today ✓/.test(H["llMomSickBtn()"]) && /🤒 Mom's sick today ✓/.test(HB["llMomSickBtn()"]), H["llMomSickBtn()"].slice(-80));
  ok("🧺 the who's-doing-it question: 🤒 Wendy's sick", /🤒 Wendy's sick — who's doing/.test(H["llCoverAskHTML()"]) && /🤒 Mom's sick — who's doing/.test(HB["llCoverAskHTML()"]) && !/\b(Mom|Dad)\b/.test(text(H["llCoverAskHTML()"])), text(H["llCoverAskHTML()"]).slice(0, 200));
  { const p = text(H.plan), pb = text(HB.plan);
    ok("🏠 Home Base's laundry: 🤒 Wendy's sick today ✓ and “🤒 Wendy's sick — who's doing Her clothes?” with David to pick", /🤒 Wendy's sick today ✓/.test(p) && /🤒 Wendy's sick — who's doing Her clothes\?/.test(p) && /\|David\|/.test(p) && /🤒 Mom's sick — who's doing/.test(pb) && /\|Dad\|/.test(pb), (p.match(/[^|]{0,40}(👤|🤒)[^|]{0,40}/g) || []).slice(0, 4));
    ok("🏠 …and no 👤 Mom / 👤 Dad / Mom or Dad / Mom's sick / a bare Mom or Dad button there", !/👤 (Mom|Dad)\b|Mom or Dad|Mom's sick|\|(Mom|Dad)\|/.test(p)); }
  { const w = await world(HH, TREE, NOW), wb = await world(HH, TREE, WAS), p = text(w.page("plan")), pb = text(wb.page("plan"));
    ok("🏠 a normal day's laundry line on Home Base: 👤 Wendy / David where it said 👤 Mom / Dad", /👤 (Wendy|David)\b/.test(p) && !/👤 (Mom|Dad)\b/.test(p) && /👤 (Mom|Dad)\b/.test(pb), [(p.match(/[^|]{0,40}👤[^|]{0,40}/g) || []).slice(0, 3), (pb.match(/[^|]{0,40}👤[^|]{0,40}/g) || []).slice(0, 3)]);
    ok("…the same writes as before on that day too", W(w.db.log) === W(wb.db.log) && treeOf(w) === treeOf(wb)); }
  { const s = text(H.seasons), sb = text(HB.seasons);
    ok("🎉 Seasons & Events: Everyone's picks read Wendy and David", /Wendy 0 of 1/.test(s) && /David 0 of 1/.test(s) && /Mom 0 of 1/.test(sb), (s.match(/[^|]{0,20}0 of 1[^|]{0,10}/g) || []).slice(0, 4));
    ok("🎉 …and the page names no Mom / Dad as a person (its “Dad’s list” page words are left)", !/\b(Mom|Dad)\b(?!’s list|'s list)/.test(s), (s.match(/[^|]{0,40}\b(Mom|Dad)\b[^|]{0,40}/g) || []).slice(0, 4)); }
  { const g = JSON.parse(H["JSON.stringify(_gfTest.groups())"]), gb = JSON.parse(HB["JSON.stringify(_gfTest.groups())"]);
    const nm = (G, id) => (G.find(x => x.id === id) || {}).name;
    ok("🎁 Gifts' groups: 👩 Wendy's side · 👨 David's side (ids still mom / dad)", nm(g, "mom") === "Wendy's side" && nm(g, "dad") === "David's side" && nm(gb, "mom") === "Mom's side" && nm(gb, "dad") === "Dad's side");
    ok("🎁 …a group she renamed keeps her name", (() => { const d = h; const keep = d.run("JSON.stringify(_gfTest.data().groups||null)"); d.run("_gfTest.data().groups=Object.assign({},_gfTest.data().groups||{},{mom:{name:'The Smiths'}});"); const r = JSON.parse(d.run("JSON.stringify(_gfTest.groups())")); d.run("_gfTest.data().groups=" + keep + "; if(_gfTest.data().groups===null) delete _gfTest.data().groups;"); return nm(r, "mom") === "The Smiths"; })());
    ok("🎁 the Gifts page's group buttons show the names", /Wendy's side/.test(text(H.gifts)) && /David's side/.test(text(H.gifts)) && !/(Mom|Dad)'s side/.test(text(H.gifts)), (text(H.gifts).match(/[^|]{0,30}side[^|]{0,10}/g) || []).slice(0, 4)); }
  ok("a household with adults: the same database writes as before (" + h.db.log.length + "), the same database after, no error", W(h.db.log) === W(hb.db.log) && treeOf(h) === treeOf(hb) && h.errors().length === 0 && hb.errors().length === 0, h.errors().slice(0, 2).map(String));
  await tap(h, hb);
  ok("…and after the same laundry taps (Mom's sick off and on)", !h.tapErr && !hb.tapErr && W(h.db.log) === W(hb.db.log) && treeOf(h) === treeOf(hb), [h.tapErr, hb.tapErr]);
  ok("nothing is stored under the names — no Wendy / David anywhere in its database", !/Wendy|David/.test(treeOf(h)) && !/Wendy|David/.test(JSON.stringify(h.db.log)));
  ok("no localStorage key holds the names either", !/Wendy|David/.test(JSON.stringify(Object.keys(h.ctx.localStorage).length ? (() => { const o = {}; for (let i = 0; i < h.ctx.localStorage.length; i++) { const k = h.ctx.localStorage.key(i); o[k] = h.ctx.localStorage.getItem(k); } return o; })() : {})));

  // ── 3. a household without adults, and an ordinary family with an adults key ───────────────────────────────
  console.log("3. no adults, or not a household: exactly as before");
  { const [a, b, A, B] = await pair(HHBASE, sick); same("a household WITHOUT adults", A, B, a, b);
    ok("…reads Mom / Dad as before", A["hhWhoName('mom')"] === "Mom" && A["llName('both')"] === "Mom or Dad"); await tap(a, b); ok("…the same writes after the same taps", W(a.db.log) === W(b.db.log) && treeOf(a) === treeOf(b)); }
  { const fam = Object.assign(clone(FX.family), { adults: { mom: "Wendy", dad: "David" } });
    const [a, b, A, B] = await pair(fam, Object.assign(clone(FX.db), { household: TREE.household, laundryLine: sick.laundryLine, gifts: TREE.gifts, seasons: TREE.seasons }));
    same("an ordinary family WITH an adults key", A, B, a, b);
    ok("…never shows the names", !Object.keys(A).some(k => /\b(Wendy|David)\b/.test(A[k]))); await tap(a, b); ok("…the same writes after the same taps", W(a.db.log) === W(b.db.log) && treeOf(a) === treeOf(b)); }
  { const fam = Object.assign({}, HH, { familyId: "howe" });   // HHKIND: Howe itself is never a household, whatever its file says
    const d = await world(fam, {}, NOW); ok("the Howe family id is never a household, so never renamed", d.run("haAdult('mom','Mom')") === "Mom"); }

  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("test crashed:", e && e.stack || e); process.exit(1); });
