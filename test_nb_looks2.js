// 🚀 🐮 🦊 Three more Pre-K looks — space, farm, forest (NB_LOOKS2, her words 2026-11-23: "build up several different themes
// for the kids to even change"). Run: node test_nb_looks2.js          (add --measure to measure every page in Google Chrome)
//   • the three looks are in Mom's "🎨 Notebook look" picker, after the first three, and the picker card itself is unchanged
//   • Mom's week-plan card takes its title from the look (index.html NB_LOOKS2: one helper + one call site), so a new look
//     never shows the construction look's "build plan"; the first three looks' titles are exactly as before
//   • each look fills EVERY piece the first three fill (plus its own sound words, animal friends and J word)
//   • every Pre-K page type renders at every level-switch setting (32 settings) with no missing piece and none of
//     another look's words or pictures — over a six-week walk that prints all 26 letter words and all 26 sound words
//   • a look never changes the work: the same picks, the same page count, the same cursors as any other look
//   • every notebook that does NOT use a new look is byte-identical with the block removed (baseline built from THIS file)
//   • page fit: colours only over the first look's sheet, the same element skeleton page for page — and a real measurement:
//     Playwright when installed (as test_prek_notebook_levels.js), or `--measure` drives the Mac's Google Chrome headless
const fs = require("fs"), path = require("path"), os = require("os");
const file = path.join(__dirname, "notebooks.js");
const src = fs.readFileSync(file, "utf8");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const A = src.indexOf("  // NB_LOOKS2_START"), endMark = "  // NB_LOOKS2_END\n", B = src.indexOf(endMark);
const load = (code) => { const w = {}; new Function("window", code)(w); return w.HoweNotebooks; };
const NB = load(src), I = NB._internal;
const block = src.slice(A, B + endMark.length);
// this tree with the block taken out — and NB_LOOKS3 with it (2026-11-24: that block builds its looks with this one's helpers)
const A3 = src.indexOf("  // NB_LOOKS3_START"), end3 = "  // NB_LOOKS3_END\n", B3 = src.indexOf(end3);
const OLD = load(A3 > B ? src.slice(0, A) + src.slice(B + endMark.length, A3) + src.slice(B3 + end3.length) : src.slice(0, A) + src.slice(B + endMark.length));
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }
const noStyle = (h) => String(h).replace(/<style[\s\S]*?<\/style>/g, "");
const text = (h) => noStyle(h).replace(/<[^>]+>/g, " ");

const NEW = ["space", "farm", "forest"], FIRST = ["dino", "construction", "shark"];
const dates = { monday: "November 9, 2026", tuesday: "November 10, 2026", wednesday: "November 11, 2026", thursday: "November 12, 2026", friday: "November 13, 2026" };
const base = (extra) => Object.assign({ weekNum: "week30", weekDates: "Nov 9–13, 2026", weekData: { dates, tasks: [] }, masteryItems: [], extraPages: {} }, extra || {});
const mi = (subject, prompts, extra) => prompts.map((p, i) => Object.assign({ subject, prompt: String(p), tier: "daily" }, (extra || {})[i] || {}));
const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), az = AZ.map(l => l.toLowerCase());
const unit = { emoji: "🐢", title: "Sea Turtles", learning: [{ name: "Shell", emoji: "🐚" }, { name: "Flipper" }], learned: [{ name: "Egg" }], next: [{ name: "Beach" }], days: { tuesday: true } };
const spelling = { title: "Spelling", sections: [{ label: "Mon–Tue", lesson: 3, words: ["cat", "hat", "sat"] }], practice: ["mat"] };
// every deck a Pre-K page reads, all 26 letters big and little with their sounds on, so every letter word can print
const items = [].concat(mi("Letters", AZ, { 2: { recentMiss: 2 } }), mi("Lowercase", az), mi("Letter Sounds", az),
  mi("Numbers", [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], { 9: { status: "introduction" } }), mi("Shapes", ["Circle", "Square", "Triangle", "Rectangle", "Hexagon", "Oval"], { 5: { status: "introduction" } }),
  mi("Colors", ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Brown", "Black"]), mi("Animals", ["Lion", "Giraffe", "Hedgehog", "Rooster"], { 1: { drop_count: 1 } }));
const allPages = { abc: { days: dates }, daysSeasons: { days: dates }, thisMonth: { days: dates } };
const full = (look, lv, extra) => base(Object.assign({ masteryItems: items, extraPages: allPages, units: [unit], spelling, teachNotes: "Short day.", kidName: "Finn", notebookTheme: look, nbLevel: lv }, extra || {}));
const KEYS = ["nbLowercase", "nbFindIt", "nbTeens", "nbShapesAhead", "nbSkipNoSchoolDays"];
const LEVELS = []; for (let m = 0; m < 32; m++) { const lv = {}; KEYS.forEach((k, i) => { lv[k] = !!(m & (1 << i)); }); LEVELS.push(lv); }
// six weeks that walk the whole alphabet, five new letters a week with no review slots — so every letter word prints once
const walk = (w) => ({ weekNum: "week" + w, reviewCap: 0, letterCursor: { week: w, idx: (w - 30) * 5, adv: 5, from: 30 } });
const theme = (N, k, ctx) => N.themes[k].theme(Object.assign({ kidName: "Finn" }, ctx || {}), {});

console.log("the block and the picker");
ok(A > 0 && B > A && src.indexOf("// NB_LOOKS2_START", A + 10) < 0, "one NB_LOOKS2 block, marked start and end");
ok(JSON.stringify(Object.keys(NB.themes).slice(0, 6)) === '["dino","construction","shark","space","farm","forest"]' && JSON.stringify(Object.keys(OLD.themes)) === '["dino","construction","shark"]', "the six looks lead the picker with the block (NB_LOOKS3's follow), the first three without it");
ok(NB.themes.space.chip === "🚀 Space" && NB.themes.farm.chip === "🐮 Farm" && NB.themes.forest.chip === "🦊 Forest", "picker names: 🚀 Space · 🐮 Farm · 🦊 Forest");
let op = NB.notebookOptions("julian", {});
ok(op.looks.map(l => l.key).join() === "dino,construction,shark,space,farm,forest,plain,horses,sports" && op.current === "dino", "a Pre-K kid's picker lists all nine (NB_LOOKS3's after these); the kid's own look stays on");
op = NB.notebookOptions("kid9", { isPreK: true });
ok(op.looks.map(l => l.key).join() === ",dino,construction,shark,space,farm,forest,plain,horses,sports" && op.current === "", "a Pre-K kid on the starter notebook: Starter + the nine");
op = NB.notebookOptions("kid9", { notebookTheme: "farm" });
ok(op.current === "farm" && op.prek && op.levels.length === 5 && op.extraPages.length === 3, "picking a new look gives the level switches and the three extra pages, as any Pre-K look");
ok(NB.notebookOptions("lincoln", {}).looks.length === 1 && NB.notebookOptions("lucy", {}).looks.every(l => !NEW.includes(l.key)) && NB.notebookOptions("kid9", {}).looks.length === 1, "an older kid's picker gets none of the new Pre-K looks (the 1st-grade colour sets: test_lu_looka.js)");
const rn = html.slice(html.indexOf("function renderNotebook("));
ok(/const looks=lookOpts\.looks\.map\(l=>pill\(l\.key===lookOpts\.current,esc\(l\.label\),"nbSetLook\('"\+sel\+"','"\+l\.key\+"'\)"/.test(rn), "the picker card builds its pills from the notebook's own list — no look is named in index.html");
ok(!/['"](space|farm|forest)['"]/.test(html.slice(html.indexOf("// PREKLEVEL_WIRE_START"), html.indexOf("// PREKLEVEL_WIRE_START") + 4000)), "…and the look wiring names none of the new looks");

console.log("Mom's week-plan card: a look brings its own title");
// index.html: the marked block + its one call site. Baseline = this file with the block out and the call site put back.
const hA = html.indexOf("// NB_LOOKS2_START"), hEnd = "// NB_LOOKS2_END\n", hB = html.indexOf(hEnd), SITE = "'+nbPlanTitle(plan.look)+' <span", WAS = "'+(NB_PLAN_TITLE[plan.look]||NB_PLAN_TITLE.construction)+' <span";
ok(hA > 0 && hB > hA && html.indexOf("// NB_LOOKS2_START", hA + 10) < 0 && html.split(SITE).length === 2 && html.indexOf(WAS) < 0, "index.html: one NB_LOOKS2 block and one call site (the plan card's title)");
const titles = (html.match(/const NB_PLAN_TITLE=\{[^\n]*\};/) || [""])[0];
const titleNew = new Function("window", titles + html.slice(hA, hB) + "; return nbPlanTitle;"), titleOld = new Function(titles + "; return function (look) { return (NB_PLAN_TITLE[look]||NB_PLAN_TITLE.construction); };")();
const withNB = titleNew({ HoweNotebooks: NB }), noNB = titleNew({});
ok(titles.length > 50 && ["dino", "construction", "shark", undefined, null, "", "unicorns"].every(l => withNB(l) === titleOld(l) && noNB(l) === titleOld(l)), "the first three looks, no look and an unknown look: the title is exactly what the card showed before");
ok(withNB("space") === "🚀 This week’s flight plan" && withNB("farm") === "🐮 This week’s farm plan" && withNB("forest") === "🦊 This week’s trail plan", "space, farm, forest: 🚀 flight plan · 🐮 farm plan · 🦊 trail plan — not the construction card's “build plan”");
ok(NEW.every(l => noNB(l) === titleOld(l)) && FIRST.every(l => !NB.themes[l].planTitle), "notebooks.js not loaded yet = the old title, never a blank; the first three looks' titles stay where they were");
const htmlBase = (html.slice(0, hA) + html.slice(hB + hEnd.length)).replace(SITE, WAS);
ok(htmlBase.length === html.length - (hB + hEnd.length - hA) - (SITE.length - WAS.length) && htmlBase.indexOf("nbPlanTitle") < 0 && htmlBase.indexOf("NB_LOOKS2") < 0, "with the block and call site taken out, index.html has no trace of this change");
ok(!/This week(’|\\u2019|')s (flight|farm|trail) plan/.test(html), "…and no new look's title is typed into index.html");

console.log("every piece the first three looks fill");
// the pieces of a data-driven look = every field any of the first three sets, less the one that swaps the work (countEmoji)
const pieces = {}; FIRST.forEach(k => Object.keys(theme(NB, k)).forEach(f => { pieces[f] = 1; }));
delete pieces.countEmoji;
const filled = (v) => v === null ? true : typeof v === "function" ? true : typeof v === "object" ? Object.keys(v).length > 0 : (v !== undefined && String(v).length > 0);
NEW.forEach(k => {
  const T = theme(NB, k), miss = Object.keys(pieces).filter(f => !(f in T) || !filled(T[f]) || (T[f] === null && f !== "fonts"));   // only the web-font list may be empty (null = the first look's fonts)
  ok(!miss.length && T.key === k && T.unitTheme === k, k + ": all " + Object.keys(pieces).length + " pieces filled", miss.join(","));
  const subMiss = [];
  ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach(d => { if (!T.badges[d]) subMiss.push("badge " + d); });
  Object.keys(theme(NB, "shark").guide).forEach(f => { if (!filled(T.guide[f])) subMiss.push("guide." + f); });
  Object.keys(theme(NB, "shark").P).forEach(f => { if (!(f in T.P) || (f !== "lowerFirst" && !filled(T.P[f]))) subMiss.push("P." + f); });
  Object.keys(theme(NB, "shark").curOpt).forEach(f => { if (!T.curOpt || !(f in T.curOpt)) subMiss.push("curOpt." + f); });
  if (T.xpColors.length !== 3 || T.guide.pathRow.length !== 3 || T.guide.closeColors.length !== 2) subMiss.push("colour lists");
  if (!T.curOpt || T.curOpt.animals.length !== 4) subMiss.push("4 animal friends");
  ok(!subMiss.length, k + ": five day badges, the guide's words, the extra pages' words, its own animal friends", subMiss.join(","));
  const lw = AZ.filter(L => { const w = T.letterWords[L]; return !w || !w[0] || !w[1] || (L !== "X" && w[0][0] !== L); });
  const sw = az.filter(l => { const w = (T.soundWords || {})[l]; return !w || !w[0] || !w[1] || (l !== "x" && w[0][0] !== l); });
  ok(!lw.length && !sw.length, k + ": a picture word for all 26 big letters and all 26 letter sounds, each starting with its letter", lw.concat(sw).join(""));
  ok(!T.countEmoji, k + ": no counting picture of its own — the day's animal is counted, as in the dinosaur and shark looks");
  const u = NB.unitPageTheme("kid9", { notebookTheme: k });
  ok(u && u !== NB.unitPageTheme("lincoln", {}) && ["GD", "GM", "GL", "GP", "GOLD", "GOLDD", "CREAM", "EXTRA"].every(r => /^#[0-9a-f]{6}$/.test(u[r])), k + ": its own unit-page colours (all 8)");
  const long = theme(NB, k, { kidName: "Maximilian" }), none = NB.themes[k].theme({}, {});
  ok(long.traceSize < 52 && long.traceSizeMixed === long.traceSize && /^Little /.test(none.name) && theme(NB, k, { kidName: "<b>" }).name === "&lt;b>", k + ": the name comes from the data — long names trace smaller, a missing one has a plain stand-in, markup is escaped");
});

console.log("no other look's words or pictures — every page type, every level-switch setting");
// words and pictures that belong to the first three looks (the base letter list's own animals are everyone's)
const FOREIGN = /dino|roar|stomp|t-rex|brachiosaurus|shark|swim|splash|sea friend|waves|\bbuil[dt]|hard hat|\bdig\b|job site|machine|truck|bucket|hammer|ladder|magnet|\bsaw\b|wheel|\bnut\b|julian|caleb|howe|🦕|🦖|🦴|🦈|🌊|🐚|🚧|🏗|👷|🦺|🚛|🚚|🛻|🚒/i;
const OWN = { space: ["🚀 Blast Off!", "Fly to the moon!", "🚀 🌙 ⭐ 🪐 🛸", "Draw YOU flying a rocket!"], farm: ["🌾 Let's Grow!", "Walk to the hay!", "🐮 🐷 🐔 🐴 🌾", "Draw YOU on the farm!"], forest: ["🌲 Let's Explore!", "Follow the trail!", "🦊 🌲 🐻 🦉 🍄", "Draw YOU in the forest!"] };
const LABELS = ["Cover", "ABC Sing-Along", "Calendar", "This Month", "Daily Page — Monday", "Daily Page — Tuesday", "Daily Page — Wednesday", "Daily Page — Thursday", "Daily Page — Friday"];
NEW.forEach(k => {
  let renders = 0; const bad = [], seen = {};
  LEVELS.forEach((lv, li) => {
    // week 30 as the app builds it (review slots on), then the six-week alphabet walk
    for (let w = 29; w <= 35; w++) {
      const o = NB.generate("kid9", full(k, lv, w === 29 ? {} : walk(w)));
      renders++;
      const st = text(o.student), pa = text(o.parent), all = st + " " + pa;
      if (li < 2) (o.student.match(/<div class="cue">[^<]*/g) || []).forEach(c => { seen[li + c.slice(17)] = 1; });
      // 🚜 is the construction look's picture; the farm look may use it for one thing only — its T word, Tractor
      const m = new RegExp(FOREIGN.source + "|🚜", "i").exec(k === "farm" ? all.replace(/tractor 🚜/gi, "") : all);
      if (m) bad.push("level " + li + " week " + w + ": “" + all.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\s+/g, " ") + "”");
      if (/undefined|NaN|\[object|null/.test(all)) bad.push("level " + li + " week " + w + ": a missing piece printed");
      if (o.prekTheme !== k) bad.push("level " + li + ": prekTheme");
      if (w === 29) {
        LABELS.forEach(lab => { if (o.student.indexOf('<div class="page-label">' + lab) < 0) bad.push("level " + li + ": no “" + lab + "” page"); });
        OWN[k].forEach(s => { if (o.student.indexOf(s) < 0) bad.push("level " + li + ": missing “" + s + "”"); });
        if (!/Sea Turtles/.test(o.student) || !/This Week's Words|Spelling/.test(o.student)) bad.push("level " + li + ": unit or spelling page missing");
        if ((o.parent.match(/<div class="page"/g) || []).length !== 1 || pa.indexOf("Finn's Grown-Up Guide") < 0 || pa.indexOf(theme(NB, k).guide.pathRow[1]) < 0) bad.push("level " + li + ": guide");
      }
    }
  });
  ok(!bad.length, k + ": " + renders + " notebooks (32 level settings × 7 weeks) — every page type, its own words, nothing borrowed, nothing missing", bad.slice(0, 3).join(" | "));
  const T = theme(NB, k), notSeen = AZ.filter(L => !seen["0" + L + " is for " + T.letterWords[L][0] + " " + T.letterWords[L][1]])
    .concat(az.filter(l => !seen["1" + l + " says /" + l + "/ · " + T.soundWords[l][0] + " " + T.soundWords[l][1]]));
  ok(!notSeen.length, k + ": all 26 “A is for …” words and all 26 “a says /a/ · …” words really printed in those notebooks", notSeen.join(""));
});
// the three pieces the first looks used to leave to another look — fixed by NB_LOOKFIX (2026-11-24, test_nb_lookfix.js)
const lowSound = { nbLowercase: true };
ok(!/says \/d\/ · dig|says \/t\/ · truck|says \/h\/ · hammer/.test(text(NB.generate("kid9", full("shark", lowSound)).student + NB.generate("kid9", full("shark", lowSound, { weekNum: "week31", letterCursor: { week: 30, idx: 5, adv: 5, from: 30 } })).student + NB.generate("kid9", full("shark", lowSound, { weekNum: "week32", letterCursor: { week: 31, idx: 10, adv: 5, from: 30 } })).student)),
  "the shark look no longer borrows the construction sound words (NB_LOOKFIX) — and the new looks carry their own");
ok(/My Animal Friends[\s\S]*?🦫 🐜 🐝 🐦/.test(NB.generate("kid9", base({ kidName: "Finn", notebookTheme: "construction" })).student) &&
   NEW.every(k => !/🦖|🦕/.test(NB.generate("kid9", base({ kidName: "Finn", notebookTheme: k })).student)), "the construction cover lists its own friends (NB_LOOKFIX) — a new look lists its own");
ok(/My Animal Friends[\s\S]*?🐮 🐷 🐴 🐔/.test(NB.generate("kid9", base({ kidName: "Finn", notebookTheme: "farm" })).student) &&
   /My Animal Friends[\s\S]*?🦊 🐻 🦉 🦌/.test(NB.generate("kid9", base({ kidName: "Finn", notebookTheme: "forest" })).student) &&
   /My Animal Friends[\s\S]*?🦁 🦒 🐘 🐵/.test(NB.generate("kid9", base({ kidName: "Finn", notebookTheme: "space" })).student), "no Animals deck → each look's own four friends");
ok(/My Animal Friends[\s\S]*?🦁 🦒 🦔 🐓/.test(NB.generate("kid9", base({ kidName: "Finn", notebookTheme: "farm", masteryItems: mi("Animals", ["Lion", "Giraffe", "Hedgehog", "Rooster"]) })).student.replace(/🐾/g, "🦔")),
  "the kid's own Animals deck always wins (a farm name gets its farm picture; one with no picture gets 🐾)");

console.log("a look never changes the work");
[{}, { nbLowercase: true, nbFindIt: true, nbTeens: true, nbShapesAhead: true, nbSkipNoSchoolDays: true }, { nbFindIt: true, nbTeens: true }].forEach((lv, i) => {
  const ctx = (k) => full(k, lv, { weekNum: "week33", letterCursor: { week: 32, idx: 7, adv: 5, from: 30 }, numberCursor: { week: 32, from: 12, adv: 5 }, juPicks: { letters: { 0: "D" } } });
  // the plan with the look's own bits left out: its name, and the picture beside an animal (the animal is the work, its picture is the look)
  const shape = (k) => { const p = NB.planFor("kid9", ctx(k)), o = NB.generate("kid9", ctx(k)); delete p.look;
    return JSON.stringify([JSON.parse(JSON.stringify(p, (key, v) => key === "swatch" ? undefined : v)), o.letterCursor, o.numberCursor, (o.student.match(/<div class="page"/g) || []).length, (o.student.match(/<div class="page-label">[^<]*/g) || []).join("|")]); };
  const ref = shape("shark");
  ok(NEW.concat(["dino"]).every(k => shape(k) === ref), ["Pre-K level", "kindergarten level", "capitals + find it"][i] + ": same picks, same cursors, same pages in the same order as the shark and dinosaur looks");
});

console.log("unchanged without a new look (baseline = this file with the block removed)");
const rosterKids = ["julian", "caleb", "lincoln", "ellis", "lucy", "kid9"];
let cmp = 0, diff = [];
rosterKids.forEach(kid => {
  const looks = (kid === "julian" || kid === "caleb" || kid === "kid9") ? ["", "dino", "construction", "shark", "unicorns"] : [""];
  looks.forEach(look => [{}, LEVELS[31], LEVELS[6], LEVELS[1]].forEach((lv, li) => [{}, { weekNum: "week36", kidName: "Maximilian", numberCursor: { week: 35, from: 40, adv: 5 } }, { masteryItems: [], extraPages: {}, units: [], spelling: null }].forEach((extra, ei) => {
    const ctx = () => JSON.parse(JSON.stringify(full(look, lv, extra)));
    const a = JSON.stringify(NB.generate(kid, ctx())), b = JSON.stringify(OLD.generate(kid, ctx()));
    cmp++; if (a !== b) diff.push(kid + "/" + (look || "own") + "/lv" + li + "/x" + ei);
  })));
});
// …and six weeks in a row at both letter levels, so all 26 letter words and sound words of every earlier look print and are compared
["julian", "caleb", "kid9"].forEach(kid => (kid === "kid9" ? FIRST : [""].concat(FIRST)).forEach(look => [LEVELS[0], LEVELS[1]].forEach((lv, li) => { for (let w = 30; w <= 35; w++) {
  // a kid's own look is built with no name passed in, so it prints its own words (a new name swaps some of them — NBNAME)
  const ctx = () => JSON.parse(JSON.stringify(full(look, lv, Object.assign(walk(w), look ? {} : { kidName: undefined }))));
  const a = JSON.stringify(NB.generate(kid, ctx())), b = JSON.stringify(OLD.generate(kid, ctx()));
  cmp++; if (a !== b) diff.push(kid + "/" + (look || "own") + "/letters" + li + "/week" + w);
} })));
ok(!diff.length && cmp === 348, cmp + " notebooks — every kid's own notebook and each of the first three looks, at four level settings — byte-identical", diff.slice(0, 5).join(", "));
ok(JSON.stringify(I.JU_THEME) === JSON.stringify(OLD._internal.JU_THEME) && JSON.stringify(I.CB_THEME) === JSON.stringify(OLD._internal.CB_THEME), "the two kids' own looks hold the same words as without the block");
ok(FIRST.every(k => JSON.stringify(theme(NB, k)) === JSON.stringify(theme(OLD, k))) && JSON.stringify(NB.unitPageTheme("kid9", { notebookTheme: "shark" })) === JSON.stringify(OLD.unitPageTheme("kid9", { notebookTheme: "shark" })), "the first three looks' pieces and unit colours are the same objects' worth of data");
ok(JSON.stringify(NB.planFor("kid9", full("shark", {}))) === JSON.stringify(OLD.planFor("kid9", full("shark", {}))) && JSON.stringify(NB.notebookOptions("lincoln", {})) === JSON.stringify(OLD.notebookOptions("lincoln", {})), "planner and an older kid's options unchanged");
ok(JSON.stringify(OLD.generate("kid9", full("space", {}))) === JSON.stringify(OLD.generate("kid9", full("", {}))), "without the block an unknown look name falls back to the starter notebook (so removing the block is safe)");

console.log("page fit — colours only, the same skeleton");
const skel = (h, i) => (h.split('<div class="page-label">')[i] || "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/>[^<]*</g, "><").replace(/ style="[^"]*"/g, "").replace(/<path[^>]*>|<svg[^>]*>|<\/svg>/g, "").replace(/ (stroke|fill)="[^"]*"/g, "");   // tags + classes; a drawing's colour is the look's
[LEVELS[0], LEVELS[31], LEVELS[6]].forEach((lv, i) => {
  const sk = NB.generate("kid9", full("shark", lv)), n = sk.student.split('<div class="page-label">').length;
  const off = [];
  NEW.forEach(k => { const o = NB.generate("kid9", full(k, lv)); for (let p = 1; p < n; p++) if (skel(o.student, p) !== skel(sk.student, p)) off.push(k + " page " + p); if (skel(o.parent, 1) !== skel(sk.parent, 1)) off.push(k + " guide"); });
  ok(n > 10 && !off.length, ["Pre-K level", "kindergarten level", "capitals + find it"][i] + ": every page of every new look has the shark look's element skeleton (tags + classes)", off.slice(0, 4).join(", "));
});
const juCss = (OLD.generate("julian", base()).student.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || "";
NEW.forEach(k => {
  const css = (NB.generate("kid9", full(k, {})).student.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || "", added = css.slice(juCss.length);
  ok(css.indexOf(juCss) === 0 && added.length > 300 && !/(^|[;{\s])(height|width|padding|margin|font-size|font-family|gap|flex|display|line-height|top|bottom|border-width|border)\s*:/m.test(added) && !/undefined/.test(added), k + ": its CSS only adds colours and backgrounds on top of the first look's sheet");
});
// the words that sit in fixed-size spots are no longer than the longest one the first three looks already print there
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

console.log("no kid or family names in the new code");
const names = ["Julian", "Lincoln", "Ellis", "Lucy", "Caleb", "Taylor", "David", "Kenzie", "Howe", "DeWalt", "Burris", "3D"];
ok(block.length > 6000 && !names.some(n => new RegExp("\\b" + n + "\\b", "i").test(block)) && !/\b(he|his|him|she|her)\b/i.test(block.replace(/\/\/ .*her words[^\n]*/g, "")), "the block names no child or family and guesses no pronoun", names.filter(n => new RegExp("\\b" + n + "\\b", "i").test(block)).join(","));
ok(!/<img|https?:\/\/(?!www\.w3\.org\/2000\/svg)|url\((?!\\"data:image\/svg\+xml)/.test(block), "pictures are emoji and our own SVG — no outside image or address");
ok(!/🔀/.test(block), "no 🔀");

// ── Real page measurement ────────────────────────────────────────────────────────────────────────────────────────────
// Measured 2026-11-23 with `node test_nb_looks2.js --measure` (Google Chrome headless, notebooks built IN the browser so the
// emoji-to-image swap and the print fit are in, web fonts loaded): each look 70 notebooks / 420 pages (5 level settings ×
// 7 weeks, student + guide, all extra pages on with a "pages today" strip, a unit page, the spelling page, a 10-letter name
// with numbers 41–45) — widest and tallest overflow of any page or card: 0 px, 0 flags. A control run that made one line
// 90px taller raised 507 flags, so the measurement does see a clip.
const MEASURE_LV = [["Pre-K", {}], ["K", LEVELS[31]], ["capitals + find it", { nbFindIt: true, nbTeens: true }], ["little letters only", { nbLowercase: true }], ["find it only", { nbFindIt: true }]];
const MEASURE_EX = [["", {}], [" · 10-letter name, 41–45", { kidName: "Maximilian", weekNum: "week36", numberCursor: { week: 35, from: 40, adv: 5 } }]];
for (let w = 31; w <= 35; w++) MEASURE_EX.push([" · week " + w, { weekNum: "week" + w, letterCursor: { week: w - 1, idx: (w - 30) * 5, adv: 5, from: 30 } }]);
// runs inside the page: every .page and every fixed box in it, in px past its own edge
const MEASURE_FN = "function(doc){var b=[],pages=0,max=0;doc.querySelectorAll('.page').forEach(function(pg,i){pages++;" +
  "var oh=pg.scrollHeight-pg.clientHeight,ow=pg.scrollWidth-pg.clientWidth;max=Math.max(max,oh,ow);if(oh>1||ow>1)b.push(i+': page +'+oh+'h +'+ow+'w');" +
  "pg.querySelectorAll('.body,.card,.col,.grid2,.path-wrap,.cover-learn,.p-sec,.header,.todo,.cover-body').forEach(function(el){var h=el.scrollHeight-el.clientHeight,w=el.scrollWidth-el.clientWidth;max=Math.max(max,h,w);if(h>2||w>2)b.push(i+': .'+el.className.split(' ')[0]+' +'+h+'h +'+w+'w');});" +
  "var ft=pg.querySelector('.footer');if(ft&&ft.getBoundingClientRect().bottom>pg.getBoundingClientRect().bottom+1)b.push(i+': footer below the page');" +
  "var pw=pg.querySelector('.path-wrap');if(pw){var top=pw.getBoundingClientRect().top;pg.querySelectorAll('.grid2 .col .card').forEach(function(c){var r=c.getBoundingClientRect();if(r.top<top&&r.bottom>top+1)b.push(i+': a card runs under the warm-up strip');});}" +
  "});return{bad:b,pages:pages,max:max};}";

function chromeMeasure() {
  const chrome = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!fs.existsSync(chrome)) { console.log("Chrome page measurement — SKIPPED (no Google Chrome at " + chrome + "; set CHROME_BIN)"); return; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nb-looks2-"));
  const cfg = []; NEW.forEach(k => MEASURE_LV.forEach(l => MEASURE_EX.forEach(x => cfg.push({ name: k + " · " + l[0] + x[0], look: k, ctx: full(k, l[1], x[1]) }))));
  // notebooks.js is loaded by itself (never the app): the page builds each notebook, shows it in a frame, waits for its fonts, measures
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
    // Chrome can finish the page and still exit non-zero while shutting down (seen on a busy Mac) — the result is on stdout
    dom = String((e && e.stdout) || "");
    if (!/RESULT[\s\S]*ENDRESULT/.test(dom)) { console.log("Chrome page measurement — SKIPPED: " + String(e.message).split("\n")[0].slice(0, 160)); return; }
  }
  const m = /RESULT([\s\S]*?)ENDRESULT/.exec(dom);
  let res = null; try { res = JSON.parse(m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")); } catch (e) {}
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  if (!res || res.error) { ok(false, "Chrome page measurement ran", res ? res.error : "no result in the page"); return; }
  console.log("Chrome page measurement (Google Chrome headless; built in the browser; " + res[0].fonts + " font faces loaded, " + res[0].emj + " emoji as images on the first notebook)");
  NEW.forEach(k => {
    const r = res.filter(x => x.look === k), pages = r.reduce((a, x) => a + x.pages, 0), max = Math.max.apply(null, r.map(x => x.max)), bad = r.filter(x => x.bad.length);
    ok(r.length === 70 && pages === 420 && !bad.length && max <= 0, k + ": " + r.length + " notebooks, " + pages + " pages measured — largest overflow " + max + " px, " + bad.length + " clipped", bad.slice(0, 3).map(x => x.name + " → " + x.bad.slice(0, 2).join("; ")).join(" | "));
  });
}

(async () => {
  if (process.argv.includes("--measure")) chromeMeasure();
  else {
    let pw = null;
    try { pw = require("playwright"); } catch (e) { try { pw = require(path.join(require("child_process").execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(), "playwright")); } catch (e2) {} }
    let browser = null;
    if (!pw) console.log("Chromium page measurement — SKIPPED (Playwright not installed; run `node test_nb_looks2.js --measure` to measure in Google Chrome. Measured 2026-11-23: 3 looks × 420 pages, largest overflow 0 px)");
    else { try { browser = await pw.chromium.launch(); } catch (e) { console.log("Chromium page measurement — SKIPPED: " + e.message.split("\n")[0]); } }
    if (browser) {
      console.log("Chromium page measurement");
      const page = await browser.newPage();
      for (const k of NEW) for (const l of MEASURE_LV) for (const x of MEASURE_EX) {
        const out = NB.generate("kid9", full(k, l[1], x[1]));
        for (const part of ["student", "parent"]) {
          await page.setContent(out[part].replace(/<link[^>]*fonts\.googleapis[^>]*>/g, ""));
          const m = await page.evaluate("(" + MEASURE_FN + ")(document)");
          ok(!m.bad.length, k + " · " + l[0] + x[0] + " (" + part + "): " + m.pages + " pages, no page clips", m.bad.slice(0, 4).join("; "));
        }
      }
      await browser.close();
    }
  }
  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("  FAIL - threw: " + (e && e.stack || e)); process.exit(1); });
