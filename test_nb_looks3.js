// 📓 🐴 ⚽ Three more Pre-K looks — Plain, Horses, Sports (NB_LOOKS3, her words 2026-11-24: "All three now").
// Run: node test_nb_looks3.js          (add --measure to measure every page in Google Chrome, headless)
//   • the three looks are in the picker after the six, in the order Plain, Horses, Sports
//   • each fills EVERY piece the newer looks fill — own sound words, letter words, J word, animal friends, plan-card title,
//     unit colours, print tints — and Plain is plain (no picture row, the day's name for a badge, "Daily Page", "Great job!")
//   • every Pre-K page type renders at every level-switch setting with nothing missing and none of the dinosaur,
//     construction or shark looks' words or pictures
//   • a look never changes the work: same picks, same pages, same cursors as any other look
//   • every notebook that does not use a new look is byte for byte the same with the block taken out
//   • page fit: colours only over the first look's sheet, the same skeleton — and measured in Google Chrome (--measure)
// Names in here are made up; the real roster and family names are read from the code itself, never typed.
const fs = require("fs"), path = require("path"), os = require("os");
const file = path.join(__dirname, "notebooks.js");
const src = fs.readFileSync(file, "utf8");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const A = src.indexOf("  // NB_LOOKS3_START"), endMark = "  // NB_LOOKS3_END\n", B = src.indexOf(endMark);
const load = (code) => { const w = {}; new Function("window", code)(w); return w.HoweNotebooks; };
const NB = load(src), I = NB._internal;
const block = src.slice(A, B + endMark.length);
const oldSrc = src.slice(0, A) + src.slice(B + endMark.length);
const OLD = load(oldSrc);   // this tree with the block taken out
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }
const noStyle = (h) => String(h).replace(/<style[\s\S]*?<\/style>/g, "");
const text = (h) => noStyle(h).replace(/<[^>]+>/g, " ");

const NEW = ["plain", "horses", "sports"], FIRST = ["dino", "construction", "shark"], SIX = FIRST.concat(["space", "farm", "forest"]);
const dates = { monday: "November 9, 2026", tuesday: "November 10, 2026", wednesday: "November 11, 2026", thursday: "November 12, 2026", friday: "November 13, 2026" };
const base = (extra) => Object.assign({ weekNum: "week30", weekDates: "Nov 9–13, 2026", weekData: { dates, tasks: [] }, masteryItems: [], extraPages: {} }, extra || {});
const mi = (subject, prompts, extra) => prompts.map((p, i) => Object.assign({ subject, prompt: String(p), tier: "daily" }, (extra || {})[i] || {}));
const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), az = AZ.map(l => l.toLowerCase());
const unit = { emoji: "🐢", title: "Sea Turtles", learning: [{ name: "Shell", emoji: "🐚" }, { name: "Flipper" }], learned: [{ name: "Egg" }], next: [{ name: "Beach" }], days: { tuesday: true } };
const spelling = { title: "Spelling", sections: [{ label: "Mon–Tue", lesson: 3, words: ["cat", "hat", "sat"] }], practice: ["mat"] };
const items = [].concat(mi("Letters", AZ, { 2: { recentMiss: 2 } }), mi("Lowercase", az), mi("Letter Sounds", az),
  mi("Numbers", [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], { 9: { status: "introduction" } }), mi("Shapes", ["Circle", "Square", "Triangle", "Rectangle", "Hexagon", "Oval"], { 5: { status: "introduction" } }),
  mi("Colors", ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Brown", "Black"]), mi("Animals", ["Lion", "Giraffe", "Hedgehog", "Rooster"], { 1: { drop_count: 1 } }));
const allPages = { abc: { days: dates }, daysSeasons: { days: dates }, thisMonth: { days: dates } };
const full = (look, lv, extra) => base(Object.assign({ masteryItems: items, extraPages: allPages, units: [unit], spelling, teachNotes: "Short day.", kidName: "Finn", notebookTheme: look, nbLevel: lv }, extra || {}));
const KEYS = ["nbLowercase", "nbFindIt", "nbTeens", "nbShapesAhead", "nbSkipNoSchoolDays"];
const LEVELS = []; for (let m = 0; m < 32; m++) { const lv = {}; KEYS.forEach((k, i) => { lv[k] = !!(m & (1 << i)); }); LEVELS.push(lv); }
const walk = (w) => ({ weekNum: "week" + w, reviewCap: 0, letterCursor: { week: w, idx: (w - 30) * 5, adv: 5, from: 30 } });
const theme = (N, k, ctx) => N.themes[k].theme(Object.assign({ kidName: "Finn" }, ctx || {}), {});
// roster names (labels like "Name (grade 🦕)") and the family name in the first kid's own footer — read from the code
const ROSTER = Object.keys(NB.GENERATORS).map(k => String(NB.GENERATORS[k].label || "").split(" ")[0]).filter(n => /^[A-Z][a-z]+$/.test(n));
const FAMILY = String(I.JU_THEME.footer).split(" · ").map(s => s.split(" ")).filter(p => p.length === 2 && p[0] === I.JU_THEME.traceNameMixed).map(p => p[1]);
const NAMES = ROSTER.concat(FAMILY);

console.log("the block and the picker");
ok(A > 0 && B > A && src.indexOf("// NB_LOOKS3_START", A + 10) < 0 && A > src.indexOf("// NB_LOOKS2_END"), "one NB_LOOKS3 block, marked start and end, after the NB_LOOKS2 block whose helpers it uses");
ok(JSON.stringify(Object.keys(NB.themes)) === JSON.stringify(SIX.concat(NEW)) && JSON.stringify(Object.keys(OLD.themes)) === JSON.stringify(SIX), "nine looks with the block — Plain, Horses, Sports after the six — and the six without it");
ok(NB.themes.plain.chip === "📓 Plain" && NB.themes.horses.chip === "🐴 Horses" && NB.themes.sports.chip === "⚽ Sports", "picker names: 📓 Plain · 🐴 Horses · ⚽ Sports");
let op = NB.notebookOptions("julian", {});
ok(op.looks.map(l => l.key).join() === SIX.concat(NEW).join() && op.current === "dino", "a Pre-K kid's picker lists all nine; the kid's own look stays on");
op = NB.notebookOptions("kid9", { isPreK: true });
ok(op.looks.map(l => l.key).join() === "," + SIX.concat(NEW).join() && op.current === "", "a Pre-K kid on the starter notebook: Starter + the nine");
op = NB.notebookOptions("kid9", { notebookTheme: "plain" });
ok(op.current === "plain" && op.prek && op.levels.length === 5 && op.extraPages.length === 3, "picking a new look gives the level switches and the three extra pages, as any Pre-K look");
ok(["lincoln", "ellis", "lucy", "kid9"].every(k => NB.notebookOptions(k, {}).looks.length === 1), "an older kid's picker is untouched (one look each)");
ok(!/['"](plain|horses|sports)['"]/.test(html.slice(html.indexOf("// PREKLEVEL_WIRE_START"), html.indexOf("// PREKLEVEL_WIRE_START") + 4000)) && !/This week(’|\\u2019|')s (riding|game) plan/.test(html), "index.html names none of the new looks (no index.html change)");
// Mom's week-plan card takes a look's title from the look (index.html nbPlanTitle, NB_LOOKS2)
const hA = html.indexOf("// NB_LOOKS2_START"), hB = html.indexOf("// NB_LOOKS2_END\n");
const titles = (html.match(/const NB_PLAN_TITLE=\{[^\n]*\};/) || [""])[0];
const planTitle = new Function("window", titles + html.slice(hA, hB) + "; return nbPlanTitle;")({ HoweNotebooks: NB });
ok(planTitle("plain") === "📓 This week’s plan" && planTitle("horses") === "🐴 This week’s riding plan" && planTitle("sports") === "⚽ This week’s game plan", "the plan card's title: 📓 This week’s plan · 🐴 riding plan · ⚽ game plan — not the construction card's “build plan”");
ok(SIX.every(k => planTitle(k) === new Function("window", titles + html.slice(hA, hB) + "; return nbPlanTitle;")({ HoweNotebooks: OLD })(k)), "…and every existing look's title is unchanged");

console.log("every piece the newer looks fill");
const pieces = {}; FIRST.concat(["space"]).forEach(k => Object.keys(theme(NB, k)).forEach(f => { pieces[f] = 1; }));
delete pieces.countEmoji;
const filled = (v) => v === null ? true : typeof v === "function" ? true : typeof v === "object" ? Object.keys(v).length > 0 : (v !== undefined && String(v).length > 0);
const PLAIN_EMPTY = ["coverRow"];   // Plain has no picture row, on purpose (plan §10)
NEW.forEach(k => {
  const T = theme(NB, k), miss = Object.keys(pieces).filter(f => !(f in T) || (!filled(T[f]) && !(k === "plain" && PLAIN_EMPTY.indexOf(f) >= 0)) || (T[f] === null && f !== "fonts"));
  ok(!miss.length && T.key === k && T.unitTheme === k, k + ": all " + Object.keys(pieces).length + " pieces filled" + (k === "plain" ? " (the picture row left empty on purpose)" : ""), miss.join(","));
  const subMiss = [], S = theme(NB, "space");
  ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach(d => { if (!T.badges[d]) subMiss.push("badge " + d); });
  Object.keys(S.guide).forEach(f => { if (!filled(T.guide[f])) subMiss.push("guide." + f); });
  Object.keys(S.P).forEach(f => { if (!(f in T.P) || (f !== "lowerFirst" && !filled(T.P[f]))) subMiss.push("P." + f); });
  Object.keys(S.curOpt).forEach(f => { if (!T.curOpt || !(f in T.curOpt)) subMiss.push("curOpt." + f); });
  if (T.xpColors.length !== 3 || T.guide.pathRow.length !== 3 || T.guide.closeColors.length !== 2) subMiss.push("colour lists");
  if (!T.curOpt || T.curOpt.animals.length !== 4) subMiss.push("4 animal friends");
  ok(!subMiss.length, k + ": five day badges, the guide's words, the extra pages' words, four animal friends of its own", subMiss.join(","));
  const lw = AZ.filter(L => { const w = T.letterWords[L]; return !w || !w[0] || !w[1] || (L !== "X" && w[0][0] !== L); });
  const sw = az.filter(l => { const w = (T.soundWords || {})[l]; return !w || !w[0] || !w[1] || (l !== "x" && w[0][0] !== l); });
  ok(!lw.length && !sw.length, k + ": a picture word for all 26 big letters and all 26 letter sounds, each starting with its letter", lw.concat(sw).join(""));
  const otherJ = SIX.concat(NEW).filter(o => o !== k).map(o => theme(NB, o).letterWords.J[0]);
  ok(otherJ.indexOf(T.letterWords.J[0]) < 0 && T.soundWords.j[0] === T.letterWords.J[0].toLowerCase() && !NAMES.some(n => n === T.letterWords.J[0].replace(/!$/, "")), k + ": its own J word (" + T.letterWords.J.join(" ") + "), no other look's and no child's name");
  const own = Object.keys(T.letterWords).filter(L => T.letterWords[L][0] !== I.JU_THEME.letterWords[L][0] && L !== "J");
  ok(own.every(L => !/^[AEIOU]/.test(L) && T.soundWords[L.toLowerCase()][0] === T.letterWords[L][0].toLowerCase()), k + ": its own letter words are consonants, each also its sound word" + (own.length ? " (" + own.map(L => T.letterWords[L][0]).join(", ") + ")" : " (Plain keeps the neutral list)"));
  const friends = T.curOpt.animals.map(a => a[0]), others = {}; SIX.concat(NEW).filter(o => o !== k).forEach(o => (theme(NB, o).curOpt ? theme(NB, o).curOpt.animals : [["Lion"], ["T-Rex"], ["Brachiosaurus"], ["Giraffe"]]).forEach(a => { others[a[0]] = o; }));
  ok(friends.every(f => !others[f]), k + ": its own four animal friends (" + friends.join(", ") + "), none another look's", friends.filter(f => others[f]).map(f => f + " (" + others[f] + ")").join(", "));
  ok(!T.countEmoji, k + ": no counting picture of its own — the day's animal is counted");
  const u = NB.unitPageTheme("kid9", { notebookTheme: k });
  ok(u && u !== NB.unitPageTheme("lincoln", {}) && ["GD", "GM", "GL", "GP", "GOLD", "GOLDD", "CREAM", "EXTRA"].every(r => /^#[0-9a-f]{6}$/.test(u[r])), k + ": unit-page colours (all 8)" + (k === "plain" ? " — the starter notebook's slate and teal" : ""));
  const pr = (/@media print \{ :root \{([^}]*)\}/.exec(T.css) || [])[1] || "";
  const prVars = ["--ju-dark", "--ju-light", "--ju-pale", "--ju-gpale", "--ju-gpale2", "--ju-bpale", "--trace", "--nt-trace", "--muted", "--border"];
  ok(prVars.every(v => new RegExp(v + ":\\s*#[0-9a-f]{6};").test(pr)), k + ": print tints defined for all " + prVars.length + " colours");
  const long = theme(NB, k, { kidName: "Maximilian" }), none = NB.themes[k].theme({}, {});
  ok(long.traceSize < 52 && long.traceSizeMixed === long.traceSize && /^Little /.test(none.name) && theme(NB, k, { kidName: "<b>" }).name === "&lt;b>", k + ": the name comes from the data — long names trace smaller, a missing one has a plain stand-in, markup is escaped");
});
ok(NB.unitPageTheme("kid9", { notebookTheme: "plain" }) === NB.unitPageTheme("kid9", {}), "Plain's unit and spelling pages use the starter notebook's own colours");
const P = theme(NB, "plain");
ok(P.coverRow === "" && P.emoji === "📓" && P.hello === "Hi, Finn!" && P.badgeDefault === "Great job!" && P.dayTitle === "Daily Page" && ["monday", "tuesday", "wednesday", "thursday", "friday"].every(d => P.badges[d] === d[0].toUpperCase() + d.slice(1)) && P.moodEmoji === "🙂" && !/[!]$/.test(P.coverBadge),
  "Plain is plain: no picture row, 📓 the only mascot, “Hi, Finn!”, the day's name for a badge, “Daily Page”, “Great job!”, no motto");
ok(theme(NB, "horses").coverBadge === "🐴 Saddle Up!" && /Trot to the barn!/.test(theme(NB, "horses").pathHtml(0)) && theme(NB, "sports").coverBadge === "⚽ Game On!" && /Kick it to the goal!/.test(theme(NB, "sports").pathHtml(0)),
  "Horses: “Saddle Up!”, the horse trots to the barn · Sports: “Game On!”, the ball goes to the goal");

console.log("no dinosaur, construction or shark words or pictures — every page type, every level-switch setting");
// the first three looks' own words (letter + sound words that are not the shared list's, nor this look's own) and pictures
const shared = {}; Object.values(I.JU_THEME.letterWords).forEach(w => { shared[w[0].toLowerCase()] = 1; });
const firstWords = {}; FIRST.forEach(k => { const T = theme(NB, k); Object.values(T.letterWords).concat(Object.values(T.soundWords || {})).forEach(w => { const x = w[0].toLowerCase(); if (!shared[x]) firstWords[x] = k; }); });
const FOREIGN_FIXED = "dino|roar|stomp|brachiosaurus|swim|splash|sea friend|waves|\\bbuil[dt]|hard hat|job site|machine|🦕|🦖|🦴|🦈|🌊|🐚|🚧|🏗|👷|🦺|🚛|🚚|🛻|🚒|🚜|⛏️|🔨|🪚|🪣|🪜|🧲|🔩|🪨|🛞";
const OWN = { plain: ["📓 This Week", "Trace the line!", "Draw a picture of YOU!", "Daily Page"], horses: ["🐴 Saddle Up!", "Trot to the barn!", "🐴 🌾 🥕 🏇 🌄", "Draw YOU riding a horse!"], sports: ["⚽ Game On!", "Kick it to the goal!", "⚽ 🏀 ⚾ 🏈 🏆", "Draw YOU scoring a goal!"] };
const LABELS = ["Cover", "ABC Sing-Along", "Calendar", "This Month", "Daily Page — Monday", "Daily Page — Tuesday", "Daily Page — Wednesday", "Daily Page — Thursday", "Daily Page — Friday"];
NEW.forEach(k => {
  const T = theme(NB, k), mine = {}; Object.values(T.letterWords).concat(Object.values(T.soundWords)).forEach(w => { mine[w[0].toLowerCase()] = 1; });
  const words = Object.keys(firstWords).filter(x => !mine[x]).map(x => "\\b" + x.replace(/[-]/g, "\\-") + "\\b");
  const FOREIGN = new RegExp([FOREIGN_FIXED].concat(words, NAMES.map(n => "\\b" + n + "\\b")).join("|"), "i");
  let renders = 0; const bad = [], seen = {};
  LEVELS.forEach((lv, li) => {
    for (let w = 29; w <= 35; w++) {
      const o = NB.generate("kid9", full(k, lv, w === 29 ? {} : walk(w)));
      renders++;
      const st = text(o.student), pa = text(o.parent), all = st + " " + pa;
      if (li < 2) (o.student.match(/<div class="cue">[^<]*/g) || []).forEach(c => { seen[li + c.slice(17)] = 1; });
      const m = FOREIGN.exec(all.replace(/Sea Turtles|🐢|Shell|🐚|Flipper|Beach/g, ""));   // the unit page's own words are the unit's, not the look's
      if (m) bad.push("level " + li + " week " + w + ": “" + all.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, " ") + "”");
      if (/undefined|NaN|\[object|null/.test(all)) bad.push("level " + li + " week " + w + ": a missing piece printed");
      if (o.prekTheme !== k) bad.push("level " + li + ": prekTheme");
      if (w === 29) {
        LABELS.forEach(lab => { if (o.student.indexOf('<div class="page-label">' + lab) < 0) bad.push("level " + li + ": no “" + lab + "” page"); });
        OWN[k].forEach(s => { if (o.student.indexOf(s) < 0) bad.push("level " + li + ": missing “" + s + "”"); });
        if (!/Sea Turtles/.test(o.student) || !/This Week's Words|Spelling/.test(o.student)) bad.push("level " + li + ": unit or spelling page missing");
        if ((o.parent.match(/<div class="page"/g) || []).length !== 1 || pa.indexOf("Finn's Grown-Up Guide") < 0 || pa.indexOf(T.guide.pathRow[1]) < 0) bad.push("level " + li + ": guide");
      }
    }
  });
  ok(!bad.length, k + ": " + renders + " notebooks (32 level settings × 7 weeks) — every page type, its own words, nothing borrowed, nothing missing", bad.slice(0, 3).join(" | "));
  const notSeen = AZ.filter(L => !seen["0" + L + " is for " + T.letterWords[L][0] + " " + T.letterWords[L][1]])
    .concat(az.filter(l => !seen["1" + l + " says /" + l + "/ · " + T.soundWords[l][0] + " " + T.soundWords[l][1]]));
  ok(!notSeen.length, k + ": all 26 “A is for …” words and all 26 “a says /a/ · …” words really printed", notSeen.join(""));
});
ok(/My Animal Friends[\s\S]*?🐱 🐶 🐰 🐭/.test(NB.generate("kid9", base({ kidName: "Finn", notebookTheme: "plain" })).student) &&
   /My Animal Friends[\s\S]*?🐎 🫏 🐐 🐑/.test(NB.generate("kid9", base({ kidName: "Finn", notebookTheme: "horses" })).student) &&
   /My Animal Friends[\s\S]*?🐆 🦘 🦅 🐯/.test(NB.generate("kid9", base({ kidName: "Finn", notebookTheme: "sports" })).student), "no Animals deck → each look's own four friends");
ok(/My Animal Friends[\s\S]*?🦁 🫏 🐾 🐐/.test(NB.generate("kid9", base({ kidName: "Finn", notebookTheme: "horses", masteryItems: mi("Animals", ["Lion", "Donkey", "Wombat", "Goat"]) })).student),
  "the kid's own Animals deck always wins (a barn name gets its picture; one with no picture gets 🐾)");
ok(["Jade", "Jonah"].every(nm => NEW.every(k => /J is for /.test(NB.generate("kid9", base({ kidName: nm, notebookTheme: k, masteryItems: mi("Letters", ["J"]) })).student) &&
   new RegExp("J is for " + theme(NB, k).letterWords.J.join(" ")).test(NB.generate("kid9", base({ kidName: nm, notebookTheme: k, masteryItems: mi("Letters", ["J"]) })).student))),
  "the J line is the look's own J word for every child, as in the other newer looks");

console.log("a look never changes the work");
[{}, LEVELS[31], { nbFindIt: true, nbTeens: true }].forEach((lv, i) => {
  const ctx = (k) => full(k, lv, { weekNum: "week33", letterCursor: { week: 32, idx: 7, adv: 5, from: 30 }, numberCursor: { week: 32, from: 12, adv: 5 }, juPicks: { letters: { 0: "D" } } });
  const shape = (k) => { const p = NB.planFor("kid9", ctx(k)), o = NB.generate("kid9", ctx(k)); delete p.look;
    return JSON.stringify([JSON.parse(JSON.stringify(p, (key, v) => key === "swatch" ? undefined : v)), o.letterCursor, o.numberCursor, (o.student.match(/<div class="page"/g) || []).length, (o.student.match(/<div class="page-label">[^<]*/g) || []).join("|"), (o.parent.match(/<div class="page"/g) || []).length]); };
  const ref = shape("shark");
  ok(NEW.every(k => shape(k) === ref), ["Pre-K level", "kindergarten level", "capitals + find it"][i] + ": same picks, same cursors, same pages in the same order as the shark look");
});
ok(NEW.every(k => JSON.stringify(NB.reviewDecks("kid9", { notebookTheme: k })) === JSON.stringify(NB.reviewDecks("kid9", { notebookTheme: "shark" }))), "…and the same decks come back on its pages (the trouble card's list)");

console.log("unchanged without a new look (baseline = this file with the block removed)");
let cmp = 0; const diff = [];
const eq = (kid, ctx, tag) => { cmp++; const a = JSON.stringify(NB.generate(kid, JSON.parse(JSON.stringify(ctx)))), b = JSON.stringify(OLD.generate(kid, JSON.parse(JSON.stringify(ctx)))); if (a !== b) diff.push(tag); };
["julian", "caleb", "kid9"].forEach(kid => ["", "unicorns"].concat(SIX).forEach(look => [LEVELS[0], LEVELS[31], LEVELS[6], LEVELS[1]].forEach((lv, li) =>
  [{}, { weekNum: "week36", kidName: "Jacqueline", numberCursor: { week: 35, from: 40, adv: 5 } }, { masteryItems: [], extraPages: {}, units: [], spelling: null }].forEach((x, xi) => eq(kid, full(look, lv, x), kid + "/" + (look || "own") + "/lv" + li + "/x" + xi)))));
["julian", "caleb"].forEach(kid => [LEVELS[0], LEVELS[1]].forEach((lv, li) => { for (let w = 30; w <= 35; w++) eq(kid, full("", lv, Object.assign(walk(w), { kidName: undefined })), kid + "/own/walk" + li + "/" + w); }));
["lincoln", "ellis", "lucy", "kid9"].forEach(kid => [{}, { bindingMargin: true }, { masteryItems: items, extraPages: allPages, units: [unit], spelling }].forEach((x, xi) => eq(kid, base(x), kid + "/x" + xi)));
ok(!diff.length, cmp + " notebooks — every kid's own notebook, each of the six looks at four level settings, every school-age and starter notebook — byte for byte the same", diff.slice(0, 5).join(", "));
ok(SIX.every(k => JSON.stringify(theme(NB, k)) === JSON.stringify(theme(OLD, k)) && JSON.stringify(NB.unitPageTheme("kid9", { notebookTheme: k })) === JSON.stringify(OLD.unitPageTheme("kid9", { notebookTheme: k }))) &&
   JSON.stringify(I.JU_THEME) === JSON.stringify(OLD._internal.JU_THEME), "the six looks' pieces and unit colours, and the kids' own looks, are the same data");
ok(JSON.stringify(OLD.generate("kid9", full("plain", {}))) === JSON.stringify(OLD.generate("kid9", full("", {}))), "without the block a new look's name falls back to the starter notebook (so removing the block is safe)");

console.log("page fit — colours only, the same skeleton");
const skel = (h, i) => (h.split('<div class="page-label">')[i] || "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/>[^<]*</g, "><").replace(/ style="[^"]*"/g, "").replace(/<path[^>]*>|<svg[^>]*>|<\/svg>/g, "").replace(/ (stroke|fill)="[^"]*"/g, "");
[LEVELS[0], LEVELS[31], LEVELS[6]].forEach((lv, i) => {
  const sk = NB.generate("kid9", full("shark", lv)), n = sk.student.split('<div class="page-label">').length, off = [];
  NEW.forEach(k => { const o = NB.generate("kid9", full(k, lv)); for (let p = 1; p < n; p++) if (skel(o.student, p) !== skel(sk.student, p)) off.push(k + " page " + p); if (skel(o.parent, 1) !== skel(sk.parent, 1)) off.push(k + " guide"); });
  ok(n > 10 && !off.length, ["Pre-K level", "kindergarten level", "capitals + find it"][i] + ": every page of every new look has the shark look's element skeleton (tags + classes)", off.slice(0, 4).join(", "));
});
const juCss = (OLD.generate("julian", base()).student.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || "";
NEW.forEach(k => {
  const css = (NB.generate("kid9", full(k, {})).student.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || "", added = css.slice(juCss.length);
  ok(css.indexOf(juCss) === 0 && added.length > 300 && !/(^|[;{\s])(height|width|padding|margin|font-size|font-family|gap|flex|display|line-height|top|bottom|border-width|border)\s*:/m.test(added) && !/undefined/.test(added), k + ": its CSS only adds colours and backgrounds on top of the first look's sheet");
});
const longest = (f) => Math.max.apply(null, FIRST.map(k => f(theme(NB, k, { kidName: "Finn" }))));
const len = (s) => Array.from(String(s).replace(/&amp;/g, "&")).length;
NEW.forEach(k => {
  const T = theme(NB, k), over = [];
  const badge = (X) => Math.max.apply(null, Object.keys(X.badges).map(d => len(X.badges[d])).concat([len(X.badgeDefault), len(X.coverBadge)]));
  if (badge(T) > Math.max(longest(badge), len("🔁 Let's practice again!"))) over.push("badge");
  if (len(T.drawCap) > longest(X => len(X.drawCap))) over.push("drawCap");
  if (len(T.coverSub) > longest(X => len(X.coverSub))) over.push("coverSub");
  if (len(T.coverRow) > longest(X => len(X.coverRow))) over.push("coverRow");
  if (len(T.guide.pathRow[2]) > longest(X => len(X.guide.pathRow[2])) + 12) over.push("guide path row");
  const word = (X) => Math.max.apply(null, AZ.map(L => len(X.letterWords[L][0])));
  if (word(T) > longest(word)) over.push("letter word");
  if (Math.max.apply(null, az.map(l => len(T.soundWords[l][0]))) > len("fire truck")) over.push("sound word");
  ok(!over.length, k + ": badges, cover lines and picture words are no longer than the longest the first three looks print", over.join(","));
});

console.log("no kid or family names, brands or outside pictures in the new code");
ok(NAMES.length >= 6 && block.length > 5000 && !NAMES.some(n => new RegExp("\\b" + n + "\\b", "i").test(block)) && !/\b(he|his|him|she|her)\b/i.test(block.replace(/\/\/ .*her words[^\n]*/g, "")), "the block names no child or family and guesses no pronoun", NAMES.filter(n => new RegExp("\\b" + n + "\\b", "i").test(block)).join(","));
ok(!/<img|https?:\/\/(?!www\.w3\.org\/2000\/svg)|url\(/.test(block) && !/[™®©]/.test(block), "pictures are emoji and our own SVG — no outside image, address or trademark sign");
ok(!/🔀/.test(block) && !/function lk2(Words|Path|Css|Theme)|var LK2_/.test(block), "no 🔀, and the NB_LOOKS2 helpers are reused, not copied");

// ── page fit, measured ────────────────────────────────────────────────────────────────────────────────────────────────
// every level setting (all 32), the guide too, with every extra page and a "pages today" strip, a unit page and the
// spelling page; plus a 10-letter name with numbers 41–45 and the five-week alphabet walk at five settings. Each fixture is
// measured on the shark look too: a clip counts against a new look only if the shark look (same sheet) fits that fixture.
const MEASURE_X = [["", {}], [" · 10-letter name, 41–45", { kidName: "Maximilian", weekNum: "week36", numberCursor: { week: 35, from: 40, adv: 5 } }]];
const WALK_LV = [LEVELS[0], LEVELS[1], LEVELS[3], LEVELS[6], LEVELS[31]];
const MEASURE_FN = "function(doc){var b=[],pages=0,max=0;doc.querySelectorAll('.page').forEach(function(pg,i){pages++;" +
  "var oh=pg.scrollHeight-pg.clientHeight,ow=pg.scrollWidth-pg.clientWidth;max=Math.max(max,oh,ow);if(oh>1||ow>1)b.push(i+': page +'+oh+'h +'+ow+'w');" +
  "pg.querySelectorAll('.body,.card,.col,.grid2,.path-wrap,.cover-learn,.learn-card,.p-sec,.header,.todo,.cover-body,.cue').forEach(function(el){var h=el.scrollHeight-el.clientHeight,w=el.scrollWidth-el.clientWidth;max=Math.max(max,h,w);if(h>2||w>2)b.push(i+': .'+el.className.split(' ')[0]+' +'+h+'h +'+w+'w');});" +
  "var ft=pg.querySelector('.footer');if(ft&&ft.getBoundingClientRect().bottom>pg.getBoundingClientRect().bottom+1)b.push(i+': footer below the page');" +
  "var pw=pg.querySelector('.path-wrap');if(pw){var top=pw.getBoundingClientRect().top;pg.querySelectorAll('.grid2 .col .card').forEach(function(c){var r=c.getBoundingClientRect();if(r.top<top&&r.bottom>top+1)b.push(i+': a card runs under the warm-up strip');});}" +
  "});return{bad:b,pages:pages,max:max};}";
function chromeMeasure() {
  const chrome = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!fs.existsSync(chrome)) { console.log("Chrome page measurement — SKIPPED (no Google Chrome at " + chrome + "; set CHROME_BIN)"); return; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nb-looks3-"));
  const cfg = [], fx = [];
  LEVELS.forEach((lv, li) => MEASURE_X.forEach(x => fx.push(["level " + li + x[0], lv, x[1]])));
  WALK_LV.forEach(lv => { for (let w = 31; w <= 35; w++) fx.push(["level " + LEVELS.indexOf(lv) + " · week " + w, lv, walk(w)]); });
  NEW.concat(["shark"]).forEach(k => fx.forEach(f => cfg.push({ name: f[0], look: k, ctx: full(k, f[1], f[2]) })));
  fs.writeFileSync(path.join(dir, "m.html"), '<!doctype html><meta charset="utf-8"><pre id="out">PENDING</pre><script src="file://' + file + '"></script><script>\n' +
    "var CFG=" + JSON.stringify(cfg).replace(/</g, "\\u003c") + ",M=" + MEASURE_FN + ";\n" +
    "(async function(){var res=[];for(var c of CFG){var o=window.HoweNotebooks.generate('kid9',c.ctx);for(var part of ['student','parent']){" +
    "var f=document.createElement('iframe');f.style.cssText='position:absolute;left:0;top:0;width:1000px;height:1200px;border:0';document.body.appendChild(f);" +
    "await new Promise(function(r){f.onload=r;f.srcdoc=o[part];});var d=f.contentDocument;try{await Promise.race([d.fonts.ready,new Promise(function(r){setTimeout(r,6000);})]);}catch(e){}" +
    "await new Promise(function(r){setTimeout(r,60);});var m=M(d);m.name=c.name+' ('+part+')';m.look=c.look;m.emj=d.querySelectorAll('img.ha-emj').length;" +
    "m.fonts=Array.from(d.fonts).filter(function(x){return x.status==='loaded';}).length;res.push(m);f.remove();}}" +
    "document.getElementById('out').textContent='RESULT'+JSON.stringify(res)+'ENDRESULT';})().catch(function(e){document.getElementById('out').textContent='RESULT'+JSON.stringify({error:String(e&&e.stack||e)})+'ENDRESULT';});\n</script>");
  let dom = "";
  try {
    dom = require("child_process").execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=" + path.join(dir, "profile"), "--allow-file-access-from-files",
      "--virtual-time-budget=1800000", "--dump-dom", "file://" + path.join(dir, "m.html")], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024, timeout: 900000 }).toString();
  } catch (e) {
    dom = String((e && e.stdout) || "");   // Chrome can finish the page and still exit non-zero while shutting down
    if (!/RESULT[\s\S]*ENDRESULT/.test(dom)) { console.log("Chrome page measurement — SKIPPED: " + String(e.message).split("\n")[0].slice(0, 160)); return; }
  }
  const m = /RESULT([\s\S]*?)ENDRESULT/.exec(dom);
  let res = null; try { res = JSON.parse(m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")); } catch (e) {}
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  if (!res || res.error) { ok(false, "Chrome page measurement ran", res ? res.error : "no result in the page"); return; }
  console.log("Chrome page measurement (Google Chrome headless; built in the browser; " + res[0].fonts + " font faces loaded, " + res[0].emj + " emoji as images on the first notebook)");
  const shark = {}; res.filter(x => x.look === "shark").forEach(x => { shark[x.name] = x; });
  NEW.forEach(k => {
    const r = res.filter(x => x.look === k), pages = r.reduce((a, x) => a + x.pages, 0), max = Math.max.apply(null, r.map(x => x.max));
    const mine = r.filter(x => x.bad.length && !(shark[x.name] && shark[x.name].bad.join("|") === x.bad.join("|"))), sheet = r.filter(x => x.bad.length && shark[x.name] && shark[x.name].bad.join("|") === x.bad.join("|"));
    ok(r.length === fx.length * 2 && !mine.length, k + ": " + r.length / 2 + " notebooks, " + pages + " pages (student + guide) measured — largest overflow " + max + " px; clipped by this look: " + mine.length +
      (sheet.length ? "; clipped the same on the shark look (the shared sheet, not this look): " + sheet.map(x => x.name + " → " + x.bad.join("; ")).join(" | ") : ""), mine.slice(0, 3).map(x => x.name + " → " + x.bad.slice(0, 2).join("; ")).join(" | "));
  });
}
if (process.argv.includes("--measure")) chromeMeasure();
else console.log("Chrome page measurement — SKIPPED (run `node test_nb_looks3.js --measure`)");
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
