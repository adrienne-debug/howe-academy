// 🎨 NBLADPIC — the number ladder's pictures, drawn (notebooks study, her words 2026-11-24: "Build it"). Run: node test_nb_ladpic.js
//  · every question in ladders/number_thinking.json that has a picture recipe draws, and every one of its choices draws;
//    an unknown kind or token → null, and the placement sheet prints the plain-words line as before.
//  · the same question draws the same string; each of the six colours has its own fill style; a token draws the same markup
//    in a picture and in a choice; the marks drawn = the recipe's numbers; the empty box is there exactly where the recipe's
//    blank is; rows of at most five, never overlapping.
//  · the child's sheet never marks or hints the answer: its HTML is the same whatever the answer letter or rule is, has no
//    answer words, and every choice is the same size in the same frame.
//  · every notebook prints byte for byte what this tree prints with the NBLADPIC block cut out (no git, no pinned commit);
//    a placement sheet with no picture is the same too (only the stylesheet gains the picture rules).
//  · NBLADPIC_NUM (her pick 2026-11-24 "Add the numeral"): every Pre-K / K dots / blocks choice also shows its own amount's
//    numeral in the same square; same square, numeral place and mark size across a question's choices; child sheets and Number
//    Thinking pages byte-identical under answers A, B and C; every other kind, 1st grade and up, and ladder-off notebooks as before.
//  · page fit: every placement sheet measured in Google Chrome headless when it is on this machine (else SKIPPED, said plainly),
//    and the six colours told apart in grayscale there (pixel features of each fill, rendered and greyed in the browser).
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
const rd = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const nbSrc = rd("notebooks.js");
const NUM = JSON.parse(rd("ladders/number_thinking.json")), READ = JSON.parse(rd("ladders/read_and_answer.json"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 400) : "")); } };
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|caleb|taylor|dewalt|burris|howe)\b/i;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clone = (o) => JSON.parse(JSON.stringify(o));
const load = (s) => { const w = {}; (new Function("window", "document", s))(w, undefined); return w.HoweNotebooks; };

// ════════════════════════════════════════ the block ════════════════════════════════════════
console.log("── the block ──");
const b0 = nbSrc.indexOf("  // NBLADPIC_START"), b1 = nbSrc.indexOf("  // NBLADPIC_END\n");
const l0 = nbSrc.indexOf("  // NBLADDER_START"), l1 = nbSrc.indexOf("  // NBLADDER_END\n");
ok("one NBLADPIC block, inside NBLADDER, just before its end", b0 > l0 && b1 > b0 && b1 + "  // NBLADPIC_END\n".length === l1 && nbSrc.indexOf("NBLADPIC_START", b0 + 20) < 0);
const blk = nbSrc.slice(b0, b1);
const code = (s) => s.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n").replace(/\s\/\/ .*$/gm, "");
ok("no kid or family name in the block", !NAMES.test(blk), (blk.match(NAMES) || [])[0]);
ok("no DOM, no Firebase, no emoji in the block's code", !/db\.ref|firebase|document\.|getElementById|window\./i.test(code(blk)) && !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(code(blk)));
ok("no brand or character words", !/disney|lego|pokemon|marvel|barbie|sesame|paw patrol|peppa|crayola/i.test(blk));
// the call sites outside the block: each guarded by typeof, so the tree with the block cut out prints what it printed before
const CALLS = ['(typeof ladPicQ === "function") ? ladPicQ(q, qn, x.lv) : null', '(typeof LADPIC_HOW === "string" && body.indexOf("lp-pq") >= 0) ? LADPIC_HOW : ', '((typeof ladPicKeyNote === "function") ? ladPicKeyNote(q, x.lv) : "")'];
const n0 = nbSrc.indexOf("  // NBLADNUM_START"), n1 = nbSrc.indexOf("  // NBLADNUM_END\n");   // slice 4 draws these pictures on the notebook page, typeof-guarded in its own block — test_nb_ladnum.js
const noNum = (s) => { const a = s.indexOf("  // NBLADNUM_START"), z = s.indexOf("  // NBLADNUM_END\n"); return a >= 0 && z > a ? s.slice(0, a) + s.slice(z) : s; };
const rest = noNum(nbSrc.slice(0, b0) + nbSrc.slice(b1));
ok("three guarded call sites in the placement builder, nothing else names the block's functions", CALLS.every((c) => rest.split(c).length === 2) &&
  (rest.match(/\bladPicQ\b|\bladPicKeyNote\b|\bLADPIC_HOW\b|\bladPicture\b|\blpGlyph\b|\bLADPIC_CSS\b/g) || []).length === 6);

const NB = load(nbSrc), L = NB.ladders;
ok("exported: HoweNotebooks.ladders.picture", typeof L.picture === "function");
const ITEMS = [];
for (const lv of Object.keys(NUM.levels)) for (const [id, it] of Object.entries(NUM.levels[lv].items)) ITEMS.push(Object.assign({ id }, it));
const PIC = ITEMS.filter((it) => it.pic);

// ════════════════════════════════════════ every recipe draws ════════════════════════════════════════
console.log("── every picture recipe draws ──");
const kinds = {};
PIC.forEach((it) => { const k = it.lv + " " + it.pic.kind; kinds[k] = (kinds[k] || 0) + 1; });
console.log("  (" + PIC.length + " questions with a picture: " + Object.keys(kinds).map((k) => k + " ×" + kinds[k]).join(", ") + ")");
ok("the file's picture kinds are the eight this block draws", [...new Set(PIC.map((it) => it.pic.kind))].sort().join(",") === "beads,compare,estimate,grow,pairs,parts,pattern,trains");
ok("every Pre-K and K question has a picture", ITEMS.filter((it) => it.lv === "prek" || it.lv === "k").every((it) => it.pic));
const DRAWN = new Map();
const undrawn = PIC.filter((it) => { const r = L.picture(it); DRAWN.set(it.id, r); return !r; });
ok("every question with a picture draws (" + PIC.length + ")", PIC.length >= 150 && undrawn.length === 0, undrawn.map((x) => x.id));
ok("every choice draws, one per choice, in the item's order", PIC.every((it) => { const r = DRAWN.get(it.id); return r && r.choices.length === it.c.length && r.choices.every((s) => /^<svg [^>]*class="nbl-svg"/.test(s)); }));
const TOK = new Set();
PIC.forEach((it) => { if (it.pic.choicesAs === "tokens") { it.c.forEach((t) => TOK.add(t)); it.pic.seq.forEach((t) => t && TOK.add(t)); } });
const pat = (as) => ({ c: [], pic: { kind: "pattern", seq: [], choicesAs: as } });
const tokOne = (t) => L.picture({ c: [t], pic: { kind: "pattern", seq: [t, null], choicesAs: "tokens" } });
ok("every token in the file draws, alone, as a picture and as a choice (" + TOK.size + ")", TOK.size >= 40 && [...TOK].every((t) => { const r = tokOne(t); return r && r.pic.indexOf('class="nbl-tok"') > 0 && r.choices[0].indexOf('class="nbl-tok"') > 0; }));
ok("all 6 colours × 5 shapes and 6 × 3 beads draw", ["red", "blue", "yellow", "green", "purple", "orange"].every((c) => ["circle", "square", "triangle", "star", "heart", "round", "cube", "tube"].every((s) => tokOne(c + "-" + s))));

// ════════════════════════════════════════ unknown → null → plain words ════════════════════════════════════════
console.log("── an unknown kind or token: null, and the plain words print ──");
const first = PIC.find((it) => it.lv === "prek" && it.pic.kind === "pattern");
const bad = [
  ["an unknown kind", Object.assign(clone(first), { pic: Object.assign(clone(first.pic), { kind: "spiral" }) })],
  ["an unknown colour in the picture", Object.assign(clone(first), { pic: Object.assign(clone(first.pic), { seq: first.pic.seq.map((t, i) => (i === 0 ? "pink-star" : t)) }) })],
  ["an unknown shape in a choice", Object.assign(clone(first), { c: [first.c[0], "green-moon", first.c[2]] })],
  ["a built-in name as a token", Object.assign(clone(first), { c: [first.c[0], "red-constructor", first.c[2]] })],
  ["an unknown choicesAs", Object.assign(clone(first), { pic: Object.assign(clone(first.pic), { choicesAs: "beans" }) })],
  ["no recipe", Object.assign(clone(first), { pic: undefined })],
  ["a count past 20", { c: ["1", "2", "3"], pic: { kind: "trains", cars: [3, 40], choicesAs: "dots" } }],
  ["a sides choice that isn't left/right/same", { c: ["left", "up", "same"], pic: { kind: "compare", left: { n: 2, item: "dots" }, right: { n: 3, item: "dots" }, choicesAs: "sides" } }],
  ["an unknown counted thing", { c: ["left", "right", "same"], pic: { kind: "compare", left: { n: 2, item: "frogs" }, right: { n: 3, item: "dots" }, choicesAs: "sides" } }],
];
bad.forEach(([lab, it]) => ok(lab + " → null", L.picture(it) === null));
ok("null for junk input", L.picture(null) === null && L.picture({}) === null && L.picture({ pic: "x", c: ["a"] }) === null);
{
  const data = clone(NUM), pk = data.levels.prek.items, ids = Object.keys(pk).sort((a, b) => pk[a].o - pk[b].o);
  pk[ids[0]].pic.kind = "spiral";   // the first Pre-K question can't be drawn
  const pg = L.placementPages("number", data, { lv: "prek" }), ch = pg.child.join("\n"), pa = pg.parent.join("\n"), q = pk[ids[0]];
  ok("placement: that question prints its plain-words line, its say line and its choices as words (as before)", ch.indexOf('<div class="lp-nline">' + esc(q.text) + '</div>') > 0 &&
    ch.indexOf("Read aloud: “" + esc(q.say) + "”") > 0 && q.c.every((c) => ch.indexOf(esc(c.replace(/-/g, " "))) > 0));
  ok("…the other five still draw; the parent sheet has no 'the picture:' line for it", (ch.match(/class="lp-q lp-pq"/g) || []).length === 5 && pa.indexOf("the picture: " + esc(q.text)) < 0 && (pa.match(/the picture: /g) || []).length === 5);
}

// ════════════════════════════════════════ deterministic, colours, same token same markup ════════════════════════════════════════
console.log("── the same every time; six fill styles; a token is the same in a picture and a choice ──");
const NB2 = load(nbSrc);
ok("the same question → the same string (twice, and from a fresh load)", PIC.every((it) => { const a = L.picture(it), b = L.picture(clone(it)), c = NB2.ladders.picture(it); return JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(a) === JSON.stringify(c); }));
ok("sizes are parameters: small and large draw the same marks", PIC.every((it) => { const s = L.picture(it, { w: 200, h: 40, choice: 36 }), g = L.picture(it, { w: 700, h: 160, choice: 140 });
  const n = (r) => (r.pic.match(/class="nbl-(m|blank|tok)"/g) || []).length + "/" + r.choices.map((c) => (c.match(/class="nbl-(m|tok)"/g) || []).length).join(",");
  return s && g && n(s) === n(DRAWN.get(it.id)) && n(g) === n(DRAWN.get(it.id)) && s.w <= 200 && g.w <= 700 && s.cw === 36 && g.cw === 140; }));
const COLS = ["red", "blue", "yellow", "green", "purple", "orange"];
const fillOf = (c) => { const s = tokOne(c + "-square").pic; const m = new RegExp('<pattern id="nblp-' + c + '"[\\s\\S]*?</pattern>').exec(s); return { pat: m ? m[0].replace(/nblp-[a-z]+/, "") .replace(/#[0-9a-f]{6}/g, "#") : null, solid: !m && /fill="#[0-9a-f]{6}" stroke/.test(s) }; };
const FILLS = COLS.map(fillOf);
ok("red is solid; the other five each have a fill pattern", FILLS[0].solid && FILLS.slice(1).every((f) => f.pat));
ok("the six fill styles are all different, even with the colours taken away", new Set(FILLS.map((f) => f.solid ? "solid" : f.pat)).size === 6);
ok("every colour draws its fill with its own outline colour (dark, for black-and-white)", COLS.every((c) => { const m = /stroke="(#[0-9a-f]{6})" stroke-width="3.5"/.exec(tokOne(c + "-circle").pic); if (!m) return false;
  const h = m[1], lum = 0.299 * parseInt(h.slice(1, 3), 16) + 0.587 * parseInt(h.slice(3, 5), 16) + 0.114 * parseInt(h.slice(5, 7), 16); return lum < 110; }));
const glyphs = (s) => s.match(/<g class="nbl-tok">[\s\S]*?<\/g>/g) || [];
ok("a token's markup is the same in the picture and in its choice (every token item)", PIC.filter((it) => it.pic.choicesAs === "tokens").every((it) => {
  const r = DRAWN.get(it.id), inPic = glyphs(r.pic), seq = it.pic.seq.filter(Boolean);
  if (inPic.length !== seq.length) return false;
  const byTok = {}; seq.forEach((t, i) => { if (byTok[t] && byTok[t] !== inPic[i]) byTok[t] = "MISMATCH"; else byTok[t] = inPic[i]; });
  return Object.values(byTok).every((g) => g !== "MISMATCH") && it.c.every((t, i) => !byTok[t] || glyphs(r.choices[i])[0] === byTok[t]);
}));
ok("a pattern's fill is defined in the same svg that uses it (so a sheet never depends on another picture)", PIC.every((it) => { const r = DRAWN.get(it.id);
  return [r.pic].concat(r.choices).every((s) => (s.match(/url\(#nblp-([a-z]+)\)/g) || []).every((u) => s.indexOf('<pattern id="' + u.slice(5, -1) + '"') > 0)); }));

// ════════════════════════════════════════ counts and blanks ════════════════════════════════════════
console.log("── the marks drawn = the recipe's numbers; the empty box where the blank is ──");
const groups = (s) => (s.match(/<g class="nbl-grp">[\s\S]*?<\/g>(?=<\/g>|<rect|<g class="nbl-slot"|<\/svg>|<path|<circle|<line)/g) || []).map((g) => (g.match(/class="nbl-m"/g) || []).length);
const grpCounts = (s) => { const out = []; const re = /<g class="nbl-grp">/g; let m; while ((m = re.exec(s))) { let i = m.index + m[0].length, depth = 1, n = 0;
  while (depth && i < s.length) { const o = s.indexOf("<g", i), c = s.indexOf("</g>", i); if (o >= 0 && o < c) { if (s.slice(o, o + 40).indexOf('class="nbl-m"') > 0) n++; depth++; i = o + 2; } else { depth--; i = c + 4; } }
  out.push(n + (s.slice(m.index, i).match(/<(circle|rect) class="nbl-m"/g) || []).length); } return out; };
const slots = (s) => s.split('<g class="nbl-slot">').slice(1);
const want = (it) => { const p = it.pic;
  if (p.kind === "compare") return [p.left.n, p.right.n];
  if (p.kind === "trains") return p.cars;
  if (p.kind === "grow") return p.seq.filter((v) => v != null);
  if (p.kind === "parts") return [p.whole, p.part];
  if (p.kind === "pairs") return p.pairs.flat().filter((v) => v != null);
  if (p.kind === "estimate") return [p.n];
  return []; };
const cntBad = PIC.filter((it) => { const g = grpCounts(DRAWN.get(it.id).pic); return JSON.stringify(g) !== JSON.stringify(want(it)); });
ok("counted marks in the picture = the recipe's numbers, group by group (" + PIC.filter((it) => want(it).length).length + " pictures)", cntBad.length === 0, cntBad.slice(0, 3).map((it) => [it.id, grpCounts(DRAWN.get(it.id).pic), want(it)]));
ok("tokens in a pattern / bead string = the recipe's tokens, in order", PIC.filter((it) => it.pic.choicesAs === "tokens").every((it) => glyphs(DRAWN.get(it.id).pic).length === it.pic.seq.filter(Boolean).length));
const chBad = PIC.filter((it) => /^(dots|blocks)$/.test(it.pic.choicesAs)).filter((it) => DRAWN.get(it.id).choices.some((s, i) => (s.match(/class="nbl-m"/g) || []).length !== +it.c[i]));
ok("a dots / blocks choice draws exactly that many", chBad.length === 0, chBad.map((x) => x.id));
ok("a number choice draws its number", PIC.filter((it) => it.pic.choicesAs === "numbers").every((it) => DRAWN.get(it.id).choices.every((s, i) => s.indexOf(">" + it.c[i].replace("-", "−") + "</text>") > 0)));
const blankAt = (it) => { const p = it.pic;
  if (p.seq) return p.seq.map((v, i) => (v == null ? i : -1)).filter((i) => i >= 0);
  if (p.kind === "pairs") return p.pairs.flat().map((v, i) => (v == null ? i : -1)).filter((i) => i >= 0);
  if (p.kind === "parts") return [/^\s*\?/.test(it.text) ? 1 : 2];   // slots: whole, then the two parts left to right
  return []; };
const blBad = PIC.filter((it) => { const sl = slots(DRAWN.get(it.id).pic), at = sl.map((s, i) => (s.indexOf('class="nbl-blank"') >= 0 ? i : -1)).filter((i) => i >= 0);
  return JSON.stringify(at) !== JSON.stringify(blankAt(it)) || (DRAWN.get(it.id).pic.match(/class="nbl-blank"/g) || []).length !== blankAt(it).length; });
ok("the empty box: exactly once, in the recipe's blank spot (none where the recipe has none)", blBad.length === 0 && PIC.filter((it) => blankAt(it).length === 1).length >= 80, blBad.slice(0, 3).map((x) => x.id));
ok("every choice holds no empty box", PIC.every((it) => DRAWN.get(it.id).choices.every((s) => s.indexOf("nbl-blank") < 0)));
// the empty box is the same size as its neighbours (a token cell, a frame, a part box, a pair box)
const num = (s, a) => { const m = new RegExp(" " + a + '="([\\d.]+)"').exec(s); return m ? +m[1] : null; };
ok("the empty box is the size of its neighbours", PIC.filter((it) => blankAt(it).length).every((it) => {
  const r = DRAWN.get(it.id), sl = slots(r.pic), bi = blankAt(it)[0], bl = /<rect class="nbl-blank"[^>]*>/.exec(sl[bi])[0], bw = num(bl, "width") + 2 * num(bl, "stroke-width");
  if (it.pic.choicesAs === "tokens") { const t = /scale\(([\d.]+)\)/.exec(sl[bi === 0 ? 1 : 0]); return Math.abs(bw - 80 * +t[1]) < 0.2; }
  const nb = sl[it.pic.kind === "parts" ? (bi === 1 ? 2 : 1) : (bi === 0 ? 1 : bi - 1)], fr = /<rect x="[\d.]+" y="[\d.]+" width="([\d.]+)"/.exec(nb);
  return fr && Math.abs(bw - (+fr[1] + 2)) < 0.2;
}));
// rows of at most five, evenly spaced, never overlapping (all but the scatter); the scatter never overlaps either
const marks = (g) => { const out = []; const re = /<circle class="nbl-m" cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"|<rect class="nbl-m" x="([\d.]+)" y="([\d.]+)" width="([\d.]+)"|<g class="nbl-m" transform="translate\(([\d.]+) ([\d.]+)\) scale\(([\d.]+)\)/g; let m;
  while ((m = re.exec(g))) out.push(m[1] ? { x: +m[1], y: +m[2], r: +m[3] } : m[4] ? { x: +m[4] + m[6] / 2, y: +m[5] + m[6] / 2, r: m[6] / 2 } : { x: +m[7] + 40 * m[9], y: +m[8] + 40 * m[9], r: 34 * m[9] }); return out; };
const layoutBad = [];
PIC.concat(PIC.map((it) => ({ id: it.id + ":choices", lv: it.lv, pic: it.pic, _ch: true }))).forEach((it) => {
  const r = DRAWN.get(it.id.replace(":choices", "")), svgs = it._ch ? r.choices : [r.pic];
  svgs.forEach((s) => (s.match(/<g class="nbl-grp">[\s\S]*?<\/g>(?=<\/g>|<rect|<g class="nbl-slot"|<\/svg>|<path)/g) || []).forEach((g) => {
    const ms = marks(g);
    for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) { const d = Math.hypot(ms[i].x - ms[j].x, ms[i].y - ms[j].y); if (d < ms[i].r + ms[j].r - 0.01) { layoutBad.push(it.id + " overlap"); return; } }
    if (it.pic.kind === "estimate" && !it._ch) return;
    const rows = {}; ms.forEach((m) => { const k = m.y.toFixed(1); (rows[k] = rows[k] || []).push(m.x); });
    const ys = Object.keys(rows).map(Number).sort((a, b) => a - b), xs0 = rows[ys[0].toFixed(1)];
    if (Object.values(rows).some((xs) => xs.length > 5)) layoutBad.push(it.id + " row>5");
    ys.slice(0, -1).forEach((y) => { if (rows[y.toFixed(1)].length !== 5) layoutBad.push(it.id + " a short row before a full one"); });
    Object.values(rows).forEach((xs) => { const st = xs.slice(1).map((x, i) => x - xs[i]); if (st.some((d) => Math.abs(d - st[0]) > 0.05)) layoutBad.push(it.id + " uneven"); if (Math.abs(xs[0] - xs0[0]) > 0.05) layoutBad.push(it.id + " rows not lined up"); });
  }));
});
ok("counted marks: rows of at most five, the first rows full, evenly spaced, lined up, never overlapping (pictures + choices)", layoutBad.length === 0, layoutBad.slice(0, 5));
ok("the 'about how many' dots are scattered (not in rows), the same every time from the recipe's seed", PIC.filter((it) => it.pic.kind === "estimate").every((it) => {
  const ms = marks(DRAWN.get(it.id).pic); return new Set(ms.map((m) => m.y.toFixed(1))).size > Math.min(ms.length - 1, Math.ceil(ms.length / 5) + 1); }));
{
  const tr = PIC.find((it) => it.pic.layout === "tricky" && it.pic.left.n === 7 && it.pic.right.n === 6) || PIC.find((it) => it.pic.layout === "tricky" && it.pic.left.n > 2 && it.pic.right.n > 2);
  const sl = slots(DRAWN.get(tr.id).pic), span = (s) => { const ms = marks(s); return Math.max(...ms.map((m) => m.x)) - Math.min(...ms.map((m) => m.x)); };
  const small = tr.pic.left.n < tr.pic.right.n ? 0 : 1;
  ok("'tricky' more-or-fewer: the smaller group really is spread out wider", span(sl[small]) > span(sl[1 - small]));
}

// ════════════════════════════════════════ nothing marks the answer ════════════════════════════════════════
console.log("── the child's sheet never marks the answer ──");
// Each question with a picture placed alone at the head of its level, so every one of them is on a sheet.
const LV_SHEET = { prek: "prek", k: "k", g1: "g1", g2: "g2" };
const SHEET_SIZE = (lv) => (lv === "prek" || lv === "k") ? { w: 380, h: 80, choice: 80 } : { w: 380, h: 72, choice: 54 };   // the sizes the placement sheet draws at
const leak = [], dep = [], size = [];
for (const it of PIC) {
  const sheet = (data) => { const pg = L.placementPages("number", data, { lv: LV_SHEET[it.lv] }); return { ch: pg.child.join("\n"), pa: pg.parent.join("\n") }; };
  const withIt = (q) => { const d = clone(NUM); const items = d.levels[it.lv].items; const o = Object.assign(clone(q), { o: 0 }); delete o.id; items[it.id] = o; return d; };
  const s = sheet(withIt(it)), ch = s.ch, blocks = ch.match(/<div class="lp-q lp-pq">[\s\S]*?<\/div><\/div><\/div>/g) || [];
  const P = L.picture(it, SHEET_SIZE(it.lv)), mine = blocks.find((b) => b.indexOf(P.pic) > 0);
  if (!mine) { leak.push(it.id + " not on the sheet"); continue; }
  const ansI = "ABCDE".indexOf(it.ans), ansC = it.c[ansI];
  if (/✔|✓|correct|answer|data-ans|\bans\b|right answer|<b>|<strong>|font-weight="800"/i.test(mine)) leak.push(it.id + " marker");
  if (it.pic.choicesAs === "tokens" && (ch.indexOf(ansC) >= 0 || ch.indexOf(ansC.replace("-", " ")) >= 0)) leak.push(it.id + " token words");
  if (ch.indexOf(esc(it.rule)) >= 0) leak.push(it.id + " rule");
  if ((it.lv === "prek" || it.lv === "k" || it.pic.kind === "estimate") && ch.indexOf(esc(it.text)) >= 0) leak.push(it.id + " plain words on the child sheet");
  if ((it.lv === "prek" || it.lv === "k" || it.pic.kind === "estimate") && s.pa.indexOf("the picture: " + esc(it.text)) < 0) leak.push(it.id + " plain words not on the parent sheet");
  // the same sheet whatever the answer letter and rule are → nothing on it can depend on the answer
  const other = Object.assign(clone(it), { ans: "ABCDE"[(ansI + 1) % it.c.length], rule: "something else" });
  if (sheet(withIt(other)).ch !== ch) dep.push(it.id);
  // every choice: the same frame, the same svg size, in the item's own order
  const cs = mine.match(/<span class="lp-pc"><span class="lp-l">[A-E]<\/span><svg [^>]*>/g) || [];
  if (cs.length !== it.c.length || new Set(cs.map((c) => c.replace(/lp-l">[A-E]/, ""))).size !== 1 || cs.map((c) => /lp-l">([A-E])/.exec(c)[1]).join("") !== "ABCDE".slice(0, it.c.length)) size.push(it.id);
  P.choices.forEach((c, i) => { if (mine.indexOf('<span class="lp-l">' + "ABCDE"[i] + '</span>' + c + '</span>') < 0) size.push(it.id + " order"); });
}
ok("every question with a picture (" + PIC.length + "): no answer words, marker, rule or plain-words line on the child's sheet; plain words on the parent's", leak.length === 0, leak.slice(0, 5));
ok("…the child's sheet is byte-identical whatever the answer letter and rule are", dep.length === 0, dep.slice(0, 5));
ok("…every choice sits in the same frame at the same size, in the item's order (A, B, C …)", size.length === 0, size.slice(0, 5));
ok("the drawing never sees the answer (the picture function's code never reads .ans or .rule)", !/\.ans\b|\.rule\b|\["ans"\]/.test(code(blk.slice(0, blk.indexOf("function ladPicKeyNote")))));
{
  const pg = L.placementPages("number", NUM, { lv: "prek" }), ch = pg.child.join("\n");
  ok("Pre-K / K sheet: 'with a grown-up', the say line printed for the grown-up, the new how-to line", /with a grown-up/.test(ch) && /Read aloud: “/.test(ch) && ch.indexOf("Circle the answer — the picture or its letter.") > 0);
  ok("…six questions, every one a picture with three choices", (ch.match(/class="lp-q lp-pq"/g) || []).length === 6 && (ch.match(/class="lp-pc"/g) || []).length === 18);
}

// ════════════════════════════════════════ byte for byte ════════════════════════════════════════
console.log("── every notebook = this tree minus NBLADPIC ──");
const base = nbSrc.slice(0, b0) + nbSrc.slice(b1 + "  // NBLADPIC_END\n".length);
ok("the baseline has no trace of the block (only the guarded call sites)", !/NBLADPIC_|ladPicture|lpGlyph|LADPIC_CSS/.test(code(noNum(base))) && base.length < nbSrc.length - 10000 &&
  (code(base).match(/\bladPicture\b|\bLADPIC_OWN_TEXT\b/g) || []).length === (code(nbSrc.slice(n0, n1)).match(/\bladPicture\b|\bLADPIC_OWN_TEXT\b/g) || []).length && /typeof ladPicture === "function"/.test(nbSrc.slice(n0, n1)));
const NB0 = load(base);
ok("the baseline has no picture function and loads", NB0 && NB0.ladders && NB0.ladders.picture === undefined);
const dates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const tasks = (kid) => Object.keys(dates).map((d, i) => ({ id: kid + i, who: kid, day: d, title: "📖 Reading " + i, time: "10:00 AM", mom: "none" }));
const XP = { allAboutMe: { on: true }, moneyLife: { on: true }, wilderness: { on: true }, memoryCivics: { on: true }, notes: { on: true } };
const mk = (kid, extra) => Object.assign({ weekData: { dates, tasks: tasks(kid) }, weekNum: 12, weekDates: "Nov 16–20, 2026", extraPages: XP, prevSummary: {}, pace: [], units: [], nbKidName: "Student" }, extra || {});
const all = (o) => (o.student || "") + "\n<<PARENT>>\n" + (o.parent || "");
const tN = L.track("number", NUM), tR = L.track("reading", READ);
const LCTX = { number: { on: true, lv: "prek", lvFrom: "saved", opt: false, cur: null, ready: true, next: L.next(tN, { lv: "prek" }, 12) }, reading: { on: true, lv: "g2", lvFrom: "saved", opt: false, cur: null, ready: true, next: L.next(tR, { lv: "g2" }, 12) } };
const themes = Object.keys(NB.themes || {});
const GENS = Object.keys(NB.GENERATORS).map((k) => [k]).concat(themes.map((th) => ["kidt_" + th, { notebookTheme: th, nbGrade: "Pre-K", kidName: "Sam" }]), [["kidz"], ["kidg", { gradeBand: "3rd–4th", grade: "3rd Grade" }]]);
ok("every generator + every Pre-K look + a starter notebook (" + GENS.length + ")", GENS.length >= Object.keys(NB.GENERATORS).length + 2 && themes.length >= 1);
for (const [kid, extra] of GENS) {
  const was = all(NB0.generate(kid, mk(kid, extra)));
  const lc = NB.ladderPages(kid, extra || {}).number ? { reading: LCTX.reading } : LCTX;   // a notebook that prints number questions draws these pictures — test_nb_ladnum.js
  ok(kid + ": student + guide = before, ladders or not", all(NB.generate(kid, mk(kid, extra))) === was && all(NB.generate(kid, mk(kid, Object.assign({ ladders: lc }, extra)))) === all(NB0.generate(kid, mk(kid, Object.assign({ ladders: lc }, extra)))));
}
{
  const byKid = {}; Object.keys(NB.GENERATORS).forEach((k) => (byKid[k] = mk(k)));
  ok("the combined parent packet = before", NB.combinedParent(byKid) === NB0.combinedParent(byKid));
}
const LADPIC_CSS = (/var LADPIC_CSS =\n([\s\S]*?);\n/.exec(blk) || [])[1];
const cssText = LADPIC_CSS ? (new Function("return " + LADPIC_CSS))() : null;
ok("the picture rules are one block of stylesheet text", typeof cssText === "string" && cssText.length > 200);
const PAIRS = { reading: ["g1", "g2", "g3", "g4", "g5", "g6", "g78"], number: ["prek", "k", "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8"] };
const docs = [];
for (const kind of ["reading", "number"]) for (const lv of PAIRS[kind]) {
  const data = kind === "reading" ? READ : NUM, doc = L.placementDoc(kind, data, { lv, kidName: "Sam" }), doc0 = NB0.ladders.placementDoc(kind, data, { lv, kidName: "Sam" });
  const hasPic = doc.indexOf('class="lp-q lp-pq"') > 0;
  if (!hasPic) ok(kind + " " + lv + ": no picture on this sheet → the same document as before (only the stylesheet gains the picture rules)", doc.replace(cssText, "") === doc0 && doc !== doc0);
  else ok(kind + " " + lv + ": pictures on this sheet; the parent page lists every answer as before", (doc.match(/<div class="lp-key"><b>\d+\. [A-E]<\/b>/g) || []).length === (doc0.match(/<div class="lp-key"><b>\d+\. [A-E]<\/b>/g) || []).length);
  docs.push({ lab: kind + " " + lv, html: doc });
}

// ════════════════════════════════════════ NBLADPIC_NUM — the numeral under each counted choice ════════════════════════════════════════
// Her pick 2026-11-24 ("Add the numeral"): every Pre-K / K choice that is an amount drawn as dots or blocks also shows that amount's
// numeral, inside the same square. OLD = this tree with the NBLADPIC_NUM block put back to the drawing it replaced (no git).
console.log("── NBLADPIC_NUM: the numeral under each dots / blocks choice ──");
const nm0 = nbSrc.indexOf("      // NBLADPIC_NUM_START"), nm1 = nbSrc.indexOf("      // NBLADPIC_NUM_END\n");
ok("one NBLADPIC_NUM block, inside NBLADPIC, in the dots / blocks choice", nm0 > b0 && nm1 > nm0 && nm1 < b1 && nbSrc.indexOf("NBLADPIC_NUM_START", nm0 + 30) < 0 &&
  nbSrc.lastIndexOf('as === "dots" || as === "blocks"', nm0) > nbSrc.lastIndexOf("function lpChoice", nm0) && !NAMES.test(nbSrc.slice(nm0, nm1)));
const oldSrc = nbSrc.slice(0, nm0) + "      cell = Math.min(px * 0.86 / d.c, px * 0.86 / d.r, px * 0.3);\n      out = lpGridIn(n, as, 0, 0, px, px, cell);\n" + nbSrc.slice(nm1 + "      // NBLADPIC_NUM_END\n".length);
const NBO = load(oldSrc), LO = NBO.ladders;
const COUNT = PIC.filter((it) => /^(dots|blocks)$/.test(it.pic.choicesAs));
{
  const by = {}; COUNT.forEach((it) => { const k = it.lv + " " + it.pic.kind + " (" + it.pic.choicesAs + ")"; by[k] = (by[k] || 0) + 1; });
  console.log("  (" + COUNT.length + " questions with counted choices: " + Object.keys(by).map((k) => k + " ×" + by[k]).join(", ") + ")");
  ok("the counted-choice questions are all Pre-K / K, grow (dots or blocks) or trains (dots) — 45 of them", COUNT.length === 45 &&
    COUNT.every((it) => (it.lv === "prek" || it.lv === "k") && (it.pic.kind === "grow" || (it.pic.kind === "trains" && it.pic.choicesAs === "dots"))));
}
const SIZES = [{ w: 380, h: 80, choice: 80 }, { w: 360, h: 96, choice: 88, cellMax: 28 }, { w: 300, h: 56, choice: 56 }, { w: 700, h: 160, choice: 140 }];   // placement, Number Thinking, the smallest box, a tablet
const numTag = (s) => s.match(/<text class="nbl-num"[^>]*>[^<]*<\/text>/g) || [];
const att = (tag, a) => { const m = new RegExp(" " + a + '="([^"]*)"').exec(tag); return m ? m[1] : null; };
const markSize = (s) => { const m = /<circle class="nbl-m"[^>]* r="([\d.]+)"|<rect class="nbl-m"[^>]* width="([\d.]+)"/.exec(s); return m ? (m[1] ? 2 * m[1] : +m[2]) : null; };   // a dot's or a block's width across
const markBottom = (s) => Math.max(0, ...marks(s).map((m) => m.y + m.r));
const numBad = [], sameBad = [], placeBad = [];
let minFont = Infinity, minCell80 = Infinity;
for (const it of COUNT) for (const o of SIZES) {
  const r = L.picture(it, o), px = o.choice;
  r.choices.forEach((s, i) => {
    const t = numTag(s);
    if (t.length !== 1 || t[0].replace(/<[^>]*>/g, "") !== String(+it.c[i]) || (s.match(/class="nbl-m"/g) || []).length !== +it.c[i]) numBad.push(it.id + " " + px + " " + i);
    const fs_ = +att(t[0] || "", "font-size"), top = +att(t[0] || "", "y") - 0.75 * fs_;
    if (markBottom(s) > top - 0.03 * px || +att(t[0] || "", "y") > px * 0.95 || att(t[0] || "", "fill") !== "#1f2937") placeBad.push(it.id + " " + px + " " + i);
    if (fs_ < minFont * px / 80 || minFont === Infinity) minFont = Math.min(minFont, fs_ * 80 / px);
    if (px === 80 && markSize(s)) minCell80 = Math.min(minCell80, markSize(s));
  });
  // the same square, the same numeral place and size, the same mark size, whatever the amount
  const hdr = new Set(r.choices.map((s) => /^<svg [^>]*>/.exec(s)[0])), nt = new Set(r.choices.map((s) => numTag(s)[0].replace(/>[^<]*</, "><"))), ms = new Set(r.choices.map(markSize).filter((x) => x != null));
  if (hdr.size !== 1 || nt.size !== 1 || ms.size !== 1 || r.cw !== Math.ceil(px)) sameBad.push(it.id + " " + px);
}
ok("every counted choice of every such question, at every size: one numeral, the choice's own amount, and that many marks", numBad.length === 0, numBad.slice(0, 5));
ok("…the numeral sits under the marks (no overlap), inside the square, dark ink (black-and-white safe)", placeBad.length === 0, placeBad.slice(0, 5));
ok("…a question's choices share one square, one numeral place and size, one mark size (" + COUNT.length * SIZES.length + " question × size)", sameBad.length === 0, sameBad.slice(0, 5));
ok("…the numeral is big enough for a 4–5 year old (≥ 21px at the placement sheet's 80px choice; it is " + Math.round(minFont * 10) / 10 + "px)", minFont >= 21);
{
  let oldMin = Infinity, worst = 1;
  COUNT.forEach((it) => { const a = L.picture(it).choices, z = LO.picture(it).choices; z.forEach((s, i) => { const o = markSize(s), n = markSize(a[i]); if (o) { oldMin = Math.min(oldMin, o); worst = Math.min(worst, n / o); } }); });
  ok("…the marks stay readable: the smallest dot / block at 80px is " + Math.round(minCell80 * 10) / 10 + "px across (before " + Math.round(oldMin * 10) / 10 + "px); no mark shrinks below " + Math.round(worst * 100) + "% of its old size (only 1–3 across shrink)",
    minCell80 >= oldMin - 0.01 && worst >= 0.8);
}
ok("…the question's picture is the same as before; only the choices changed", COUNT.every((it) => SIZES.every((o) => { const a = L.picture(it, o), z = LO.picture(it, o); return a.pic === z.pic && a.w === z.w && a.h === z.h && a.cw === z.cw && a.choices.every((s, i) => s !== z.choices[i]); })));
ok("every other choice kind (tokens, left / right / same, numbers) and every picture is exactly as before, and has no numeral added", PIC.filter((it) => COUNT.indexOf(it) < 0).every((it) => SIZES.every((o) => JSON.stringify(L.picture(it, o)) === JSON.stringify(LO.picture(it, o)))) &&
  PIC.every((it) => numTag(L.picture(it).pic).length === 0) && PIC.filter((it) => COUNT.indexOf(it) < 0).every((it) => L.picture(it).choices.every((s) => numTag(s).length === 0)));
// the child's sheets, under EVERY answer letter, and against OLD (only the choice pictures differ)
const stripSvg = (s) => s.replace(/<svg [\s\S]*?<\/svg>/g, "<svg/>");
const withLead = (data, by) => { const d = clone(data); Object.keys(by).forEach((lv) => { const items = d.levels[lv].items; by[lv].forEach((q, k) => { const o = Object.assign(clone(q), { o: -by[lv].length + k }); delete o.id; items[q.id] = o; }); }); return d; };
const chunks = (a, n) => { const out = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out; };
// placement sheets (the Pre-K check: three Pre-K + three K questions) led by counted-choice questions, so every one of the 45 is on a sheet
const PKC = chunks(COUNT.filter((it) => it.lv === "prek"), 3), KC = chunks(COUNT.filter((it) => it.lv === "k"), 3), PACKS = [];
for (let i = 0; i < Math.max(PKC.length, KC.length); i++) PACKS.push({ prek: PKC[i % PKC.length], k: KC[i % KC.length] });
const sheetOf = (LL, by) => LL.placementPages("number", withLead(NUM, by), { lv: "prek" }).child.join("\n");
const letBad = [], oldBad = [], onSheet = new Set();
for (const pk of PACKS) {
  const base_ = sheetOf(L, pk), want = pk.prek.concat(pk.k);
  want.forEach((q) => { if (base_.indexOf(L.picture(q).choices[0]) > 0) onSheet.add(q.id); });
  if (numTag(base_).length !== want.reduce((n, q) => n + q.c.length, 0) || stripSvg(base_) !== stripSvg(sheetOf(LO, pk))) oldBad.push(want[0].id);
  for (let k = 0; k < 3; k++) { const re = (qs) => qs.map((q) => Object.assign(clone(q), { ans: "ABC"[k], rule: "rule " + k })); if (sheetOf(L, { prek: re(pk.prek), k: re(pk.k) }) !== base_) letBad.push(want[0].id + " " + "ABC"[k]); }
}
PACKS.forEach((pk, i) => docs.push({ lab: "counted pack " + (i + 1), html: L.placementDoc("number", withLead(NUM, pk), { lv: "prek", kidName: "Sam" }) }));   // measured below
ok("placement: every counted question on a sheet (" + onSheet.size + " on " + PACKS.length + " sheets, three Pre-K + three K each) — the child's sheet is byte-identical under answer A, B and C", letBad.length === 0 && onSheet.size === COUNT.length, letBad.slice(0, 5));
ok("…and is the old sheet with only the choice pictures changed (one numeral per choice)", oldBad.length === 0, oldBad);
// Number Thinking pages packed with five counted questions each, in every Pre-K look
const PKLOOKS = themes.map((th) => ["kidt_" + th, { notebookTheme: th, nbGrade: "Pre-K", kidName: "Sam" }]);
const NTNEXT = L.next(tN, { lv: "prek" }, 12);
const ntCtx = (qs) => ({ number: { on: true, lv: qs[0].lv, lvFrom: "saved", opt: false, cur: null, ready: true, next: Object.assign(clone(NTNEXT), {
  items: qs.map((q, k) => Object.assign(clone(NTNEXT.items[0]), { lv: q.lv, label: q.lv === "k" ? "Kindergarten" : "Pre-K", i: k, num: k + 1, id: q.id, item: clone(q) })) }) } });
const NTPACKS = []; for (const lv of ["prek", "k"]) chunks(COUNT.filter((it) => it.lv === lv), 5).forEach((qs) => NTPACKS.push(qs));
const ntLet = [], ntOld = [], ntPages = [];
for (const [kid, extra] of PKLOOKS) for (const qs of NTPACKS) {
  const st = (q2) => NB.generate(kid, mk(kid, Object.assign({ ladders: ntCtx(q2) }, extra))).student, s0 = st(qs), sOld = NBO.generate(kid, mk(kid, Object.assign({ ladders: ntCtx(qs) }, extra))).student;
  if (numTag(s0).length !== qs.reduce((n, q) => n + q.c.length, 0) || stripSvg(s0) !== stripSvg(sOld)) ntOld.push(kid + " " + qs[0].id);
  for (let k = 0; k < 3; k++) if (st(qs.map((q) => Object.assign(clone(q), { ans: "ABC"[k], rule: "rule " + k }))) !== s0) ntLet.push(kid + " " + qs[0].id + " " + "ABC"[k]);
  ntPages.push({ kid, lab: kid + " · " + qs[0].lv + " " + qs[0].id, html: s0, old: sOld });
}
ok("Number Thinking: " + NTPACKS.length + " pages of five counted questions × " + PKLOOKS.length + " Pre-K looks — byte-identical under answer A, B and C", ntLet.length === 0, ntLet.slice(0, 5));
ok("…and the old page with only the choice pictures changed (one numeral per choice)", ntOld.length === 0, ntOld.slice(0, 5));
{
  const off = [];
  for (const [kid, extra] of GENS_NUM()) { const a = all(NB.generate(kid, mk(kid, extra))), z = all(NBO.generate(kid, mk(kid, extra))); if (a !== z) off.push(kid); }
  ok("every notebook with the number ladder off: byte-identical to before", off.length === 0, off);
  const g1 = [];
  for (const lv of ["g1", "g2", "g3"]) { const lc = { number: Object.assign(clone(LCTX.number), { lv, next: L.next(tN, { lv }, 12) }) };
    for (const kid of Object.keys(NB.GENERATORS)) { const x = mk(kid, { ladders: lc }); if (all(NB.generate(kid, x)) !== all(NBO.generate(kid, x))) g1.push(kid + " " + lv); } }
  ok("1st grade and up on the number ladder: every notebook byte-identical to before", g1.length === 0, g1);
  const pl = [];
  for (const kind of ["reading", "number"]) for (const lv of PAIRS[kind]) { const data = kind === "reading" ? READ : NUM, a = L.placementDoc(kind, data, { lv, kidName: "Sam" }), z = LO.placementDoc(kind, data, { lv, kidName: "Sam" });
    if (numTag(a).length ? stripSvg(a) !== stripSvg(z) : a !== z) pl.push(kind + " " + lv); }
  ok("placement documents: no counted choice → byte-identical; with one → only the choice pictures differ", pl.length === 0, pl);
}
function GENS_NUM() { return Object.keys(NB.GENERATORS).map((k) => [k]).concat(PKLOOKS); }

// ════════════════════════════════════════ page fit + grayscale (Chrome) ════════════════════════════════════════
console.log("── page fit (8.5×11in, overflow hidden) and the six colours in grayscale ──");
const CHROME = process.env.CHROME_BIN || process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const runChrome = (html, tag) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nbladpic-")), f = path.join(dir, tag + ".html");
  fs.writeFileSync(f, html);
  for (let tryN = 0; tryN < 3; tryN++) {
    const r = cp.spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--user-data-dir=" + path.join(dir, "prof" + tryN), "--virtual-time-budget=5000", "--dump-dom", "file://" + f], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 28, timeout: 60000 });
    const m = /data-r="([^"]*)"/.exec(String(r.stdout || ""));
    if (m) return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
  }
  return null;
};
if (!fs.existsSync(CHROME)) console.log("  page measurement and grayscale — SKIPPED (no Google Chrome at " + CHROME + "; set CHROME_BIN)");
else {
  const MEASURE = function () {
    return [].map.call(document.querySelectorAll(".page"), function (pg) {
      const r = pg.getBoundingClientRect(), cs = getComputedStyle(pg), lim = r.bottom - parseFloat(cs.paddingBottom), limR = r.right - parseFloat(cs.paddingRight);
      let low = r.top, right = r.left; [].forEach.call(pg.querySelectorAll("*"), function (el) { const b = el.getBoundingClientRect(); if (b.bottom > low) low = b.bottom; if (b.right > right) right = b.right; });
      return { lab: pg.getAttribute("data-lab"), h: Math.round(r.height), spare: Math.round(lim - low), spareR: Math.round(limR - right), wide: pg.scrollWidth - pg.clientWidth };
    });
  };
  // each document measured on its own, as printed (web fonts off, as the other notebook fit tests)
  const body = docs.map((d) => { let n = 0; return d.html.slice(d.html.indexOf("<body>") + 6, d.html.lastIndexOf("</body>")).replace(/<div class="page ([a-z-]+)">/g, (m, cl) => '<div class="page ' + cl + '" data-lab="' + d.lab + " · " + (++n) + '">'); }).join("\n");
  const head = docs[docs.length - 1].html.slice(0, docs[docs.length - 1].html.indexOf("<body>") + 6).replace(/<link[^>]*fonts\.googleapis[^>]*>/g, "");
  const res = runChrome(head + body + "<script>window.addEventListener('load',function(){document.body.setAttribute('data-r',JSON.stringify((" + MEASURE.toString() + ")()));});</script></body></html>", "fit");
  if (!res) console.log("  page measurement — SKIPPED (Google Chrome would not run headless here)");
  else {
    const bad = res.filter((p) => p.spare < 0 || p.spareR < 0 || p.wide > 0 || p.h !== 1056);
    const tight = res.filter((p) => /number (prek|k|g1|g2) · 1/.test(p.lab)).sort((a, b) => a.spare - b.spare).map((p) => p.lab + " " + p.spare + "px below, " + p.spareR + "px right");
    ok("Google Chrome headless: " + res.length + " placement pages, every one 11in tall, nothing clipped below or to the right (picture sheets: " + tight.join("; ") + ")",
      !bad.length && res.length === docs.reduce((n, d) => n + (d.html.match(/<div class="page /g) || []).length, 0), bad);
    const packs = res.filter((p) => /^counted pack \d+ · 1$/.test(p.lab)).sort((a, b) => a.spare - b.spare);
    ok("…the " + packs.length + " sheets led by counted questions (numerals in every choice) fit too — tightest " + (packs[0] ? packs[0].lab + " " + packs[0].spare + "px below" : "none"), packs.length === PACKS.length && packs.every((p) => p.spare >= 0 && p.spareR >= 0 && p.h === 1056));
  }
  // NBLADPIC_NUM: every Number Thinking page packed with counted questions, in every Pre-K look, each notebook with its own CSS
  const NTM = function () {
    return [].map.call(document.querySelectorAll(".page[data-lab]"), function (pg) {
      var b = pg.querySelector(".body"), r = pg.getBoundingClientRect(), low = 0, out = { lab: pg.getAttribute("data-lab"), h: Math.round(r.height), wide: pg.scrollWidth - pg.clientWidth, clip: pg.scrollHeight - pg.clientHeight };
      [].forEach.call(b.children, function (c) { var y = c.getBoundingClientRect().bottom; if (y > low) low = y; });
      out.spare = Math.round(b.getBoundingClientRect().bottom - parseFloat(getComputedStyle(b).paddingBottom) - low); out.clip = Math.max(out.clip, b.scrollHeight - b.clientHeight);
      return out;
    });
  };
  const ntRes = [];
  for (const [kid] of PKLOOKS) {
    const mine = ntPages.filter((p) => p.kid === kid), h0 = mine[0].html;
    const ntPage = (html, lab) => { const a = html.indexOf("<div class=\"page-label\">Number Thinking — Week"), z = html.indexOf("<div class=\"page-label\">", a + 10);
      return html.slice(a, z < 0 ? html.lastIndexOf("</body>") : z).replace("<div class=\"page\">", "<div class=\"page\" data-lab=\"" + lab + "\">"); };
    const pages = mine.map((p) => ntPage(p.html, p.lab)).concat(mine.map((p) => ntPage(p.old, "old|" + p.lab)));   // the same page drawn the old way, for the before / after
    const r = runChrome(h0.slice(0, h0.indexOf("<body>") + 6).replace(/<link[^>]*fonts\.googleapis[^>]*>/g, "") + pages.join("\n") + "<script>window.addEventListener('load',function(){document.body.setAttribute('data-r',JSON.stringify((" + NTM.toString() + ")()));});</script></body></html>", "nt_" + kid);
    if (!r) { console.log("  Number Thinking page measurement — SKIPPED for " + kid + " (Google Chrome would not run headless here)"); continue; }
    r.forEach((p) => ntRes.push(p));
  }
  if (ntRes.length) {
    const now = ntRes.filter((p) => !/^old\|/.test(p.lab)), was = {}; ntRes.filter((p) => /^old\|/.test(p.lab)).forEach((p) => (was[p.lab.slice(4)] = p.spare));
    const nb = now.filter((p) => p.spare < 0 || p.clip > 0 || p.wide > 0 || p.h !== 1056), nt = now.slice().sort((a, b) => a.spare - b.spare)[0], moved = now.filter((p) => was[p.lab] !== p.spare);
    ok("Number Thinking pages packed with counted questions: " + now.length + " pages (" + PKLOOKS.length + " looks), every one 11in tall, nothing clipped — tightest " + nt.lab + " " + nt.spare + "px spare (before the numerals: " + was[nt.lab] + "px)",
      !nb.length && now.length === ntPages.length, nb.slice(0, 3));
    ok("…every one of them has exactly the spare it had before the numerals (the choice squares did not grow)", moved.length === 0, moved.slice(0, 3).map((p) => p.lab + " " + was[p.lab] + "→" + p.spare));
  }
  // grayscale: each colour's square drawn in the browser, greyed (luma), and described by pixel features — how dark, how much
  // it varies, and which way its edges run (across, down, slanted). Every pair of colours must differ clearly.
  const sq = COLS.map((c) => tokOne(c + "-square").choices[0].replace('width="80" height="80"', 'width="240" height="240"'));
  const GRAY = function (svgs) {
    return Promise.all(svgs.map(function (s) {
      return new Promise(function (ok) {
        const im = new Image(); im.onload = function () {
          const cv = document.createElement("canvas"); cv.width = 240; cv.height = 240; const g = cv.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 240, 240); g.drawImage(im, 0, 0, 240, 240);
          const d = g.getImageData(70, 70, 100, 100).data, Y = function (x, y) { const i = (y * 100 + x) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; };
          let sum = 0, sum2 = 0, h = 0, v = 0, dg = 0, n = 0;
          for (let y = 0; y < 99; y++) for (let x = 0; x < 99; x++) { const a = Y(x, y); sum += a; sum2 += a * a; n++; if (Math.abs(a - Y(x + 1, y)) > 40) h++; if (Math.abs(a - Y(x, y + 1)) > 40) v++; if (Math.abs(a - Y(x + 1, y + 1)) > 40) dg++; }
          const m = sum / n, runs = [];
          let starts0 = null, same = 0, all = 0;
          for (let y = 0; y < 100; y++) { let r = 0, edge = true; const starts = {};
            for (let x = 0; x < 100; x++) { if (Y(x, y) < m) { if (!r) starts[x] = 1; r++; } else { if (r && !edge) runs.push(r); r = 0; edge = false; } }   // dark runs across, not cut by the crop
            if (starts0) Object.keys(starts).forEach(function (k) { all++; if (starts0[k]) same++; });
            starts0 = starts; }
          const rm = runs.length ? runs.reduce(function (a, b) { return a + b; }, 0) / runs.length : 0, rs = runs.length ? Math.sqrt(runs.reduce(function (a, b) { return a + (b - rm) * (b - rm); }, 0) / runs.length) : 0;
          ok({ mean: Math.round(m), sd: Math.round(Math.sqrt(sum2 / n - m * m)), h: h, v: v, dg: dg, run: Math.round(rm * 10) / 10, runSd: Math.round(rs * 10) / 10, upright: all ? Math.round(100 * same / all) : 0 });
        };
        im.onerror = function () { ok(null); };
        im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
      });
    }));
  };
  const gr = runChrome("<!DOCTYPE html><html><body><script>(" + GRAY.toString() + ")(" + JSON.stringify(sq) + ").then(function(r){document.body.setAttribute('data-r',JSON.stringify(r));});</script></body></html>", "gray");
  if (!gr || gr.some((x) => !x)) console.log("  grayscale — SKIPPED (Google Chrome would not draw the squares here)");
  else {
    // features scaled so each counts about the same: darkness, texture, edge direction (share of across / down / slanted), and
    // the dark runs across a row (dots: short and uneven; checks: even; stripes: whole rows), and how often a run starts where
    // the row above's did (checks: upright edges; slanted stripes: never)
    const f = gr.map((x) => { const e = x.h + x.v + x.dg || 1; return [x.mean / 25, x.sd / 10, 10 * x.h / e, 10 * x.v / e, Math.min(x.h + x.v + x.dg, 4000) / 400, Math.min(x.run, 100) / 5, x.runSd / 2, x.upright / 15]; });
    let near = Infinity, pair = "";
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) { const d = Math.hypot(...f[i].map((v, k) => v - f[j][k])); if (d < near) { near = d; pair = COLS[i] + "/" + COLS[j]; } }
    console.log("  (grayscale: " + COLS.map((c, i) => c + " mean " + gr[i].mean + " sd " + gr[i].sd + " edges →" + gr[i].h + " ↓" + gr[i].v + " ↘" + gr[i].dg + " dark runs " + gr[i].run + "±" + gr[i].runSd + " lined up " + gr[i].upright + "%").join("; ") + ")");
    ok("grayscale: the six colours' fills are told apart (closest pair " + pair + ", distance " + near.toFixed(1) + " ≥ 2)", near >= 2);
  }
}

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
