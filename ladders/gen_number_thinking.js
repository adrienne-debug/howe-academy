#!/usr/bin/env node
"use strict";
// NUMBER-THINKING LADDER — generator (study §20 + §25, Mom's go-ahead 2026-11-23).
// Writes ladders/number_thinking.json: the missing rungs of the number-thinking ladder —
// prek, k, g1, g2, g3, g5, g7, g8 — 60 items each, easy → hard in stages.
// 4th and 6th are the boys' banks (ellis_quant_bank.json / lincoln_quant_bank.json) and are NOT made here.
// Nothing here is loaded or live. Deterministic: same seed → byte-identical file. No dependencies.
//
// Item shape (same as the boys' banks, plus a picture for the little ones):
//   { o, type, st, lv, text, c[], ans, rule, say?, pic? }
//   type  RP repeating pattern · BD bead string · GP growing pattern · MF more or fewer · MS make them the same
//         NE about how many · NS number series · NA number pairs · NP number puzzles
//   text  NS/NA use two spaces between terms, NP puts each line between " / " — exactly as notebooks.js prints them.
//   c     choices: 3 (Pre-K, K), 4 (1st, 2nd), 5 (3rd and up); numbers are sorted low → high, pictures are mixed.
//   ans   the letter of the one right choice. rule: one plain line for the parent page.
//   say   a short spoken-style prompt (the tablet can read it aloud; on paper Mom reads it).
//   pic   a STRUCTURED picture so a later build can draw it on paper or make it tappable.
// Run: node ladders/gen_number_thinking.js   (then node ladders/check_number_thinking.js)

const fs = require("fs"), path = require("path");
const SEED = 20261123;
const OUT = path.join(__dirname, "number_thinking.json");
const MINUS = "−";

// ── seeded random ─────────────────────────────────────────────────────────
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let R = mulberry32(SEED);
const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
const pick = a => a[Math.floor(R() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rnd = x => { x = Math.round(x * 1e6) / 1e6; return Object.is(x, -0) ? 0 : x; };
const isInt = x => Math.abs(x - Math.round(x)) < 1e-9;

// ── number text ───────────────────────────────────────────────────────────
function fmt(x) { x = rnd(x); return (x < 0 ? MINUS : "") + String(Math.abs(x)); }
const P = x => (rnd(x) < 0 ? "(" + fmt(x) + ")" : fmt(x));            // a negative after an operator gets brackets
const opTxt = (o, v) => o + (o === "×" || o === "÷" ? P(v) : fmt(v));  // "+6", "−2", "×(−2)", "÷2"
function applyOp(x, o, v) { return rnd(o === "+" ? x + v : o === MINUS ? x - v : o === "×" ? x * v : x / v); }
const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const sup = n => String(n).split("").map(d => SUP[d]).join("");

// ── choices ───────────────────────────────────────────────────────────────
// Where the right answer sits is dealt from a shuffled bag per level (build() sets TARGET before each item),
// so every letter is used about equally — a child can't learn "it's never A".
let TARGET = null;
// Numbers: the answer plus mistakes — the named mistakes first, then near misses — all different, sorted low → high,
// picked so that TARGET of them sit below the answer (as near as the numbers allow).
function numChoices(ans, mistakes, n, o) {
  o = o || {};
  ans = rnd(ans);
  const intOnly = o.int !== false && isInt(ans), min = o.min == null ? -Infinity : o.min;
  const seen = new Set([fmt(ans)]), pool = [];
  const add = v => {
    if (!Number.isFinite(v)) return;
    v = rnd(v);
    if (v < min || (o.max != null && v > o.max) || (intOnly && !isInt(v)) || !isInt(v * 100)) return;   // no 7.142857
    const k = fmt(v); if (seen.has(k)) return;
    seen.add(k); pool.push(v);
  };
  mistakes.forEach(add);
  const st = o.step || (isInt(ans) ? 1 : 0.5);
  for (let d = 1; d < 60; d++) { add(ans + d * st); add(ans - d * st); }
  const below = pool.filter(v => v < ans), above = pool.filter(v => v > ans);
  if (below.length + above.length < n - 1) return null;
  let t = TARGET == null || TARGET >= n ? Math.floor((n - 1) / 2) : TARGET;
  t = Math.min(t, below.length); if (n - 1 - t > above.length) t = n - 1 - above.length;
  const out = [ans, ...below.slice(0, t), ...above.slice(0, n - 1 - t)];
  out.sort((a, b) => a - b);
  return { c: out.map(fmt), ans: "ABCDE"[out.findIndex(v => fmt(v) === fmt(ans))] };
}
// Pictures (tokens): the answer + mistakes; the answer goes at TARGET, the rest are mixed.
function tokChoices(ans, cands, n) {
  const others = [];
  for (const t of cands) { if (t != null && t !== ans && !others.includes(t)) others.push(t); if (others.length === n - 1) break; }
  if (others.length < n - 1) return null;
  const sh = shuffle(others), at = TARGET == null || TARGET >= n ? 0 : TARGET;
  sh.splice(at, 0, ans);
  return { c: sh, ans: "ABCDE"[at] };
}

// ══════════════════════════════════════════════════════════════════════════
// PICTURE KINDS (Pre-K, K) — no reading; 3 choices
// ══════════════════════════════════════════════════════════════════════════
const COLORS = ["red", "blue", "yellow", "green", "purple", "orange"];
const SHAPES = ["circle", "square", "triangle", "star", "heart"];
const BEADS = ["round", "cube", "tube"];
const UNITS = { AB: [0, 1], AAB: [0, 0, 1], ABB: [0, 1, 1], ABC: [0, 1, 2], AABB: [0, 0, 1, 1], ABCD: [0, 1, 2, 3], ABAC: [0, 1, 0, 2], ABBC: [0, 1, 1, 2] };
const tokName = t => t.replace("-", " ");

// RP / BD — "what comes next" or "which one is missing" on a repeating pattern / bead string.
function pattern(type, o) {
  return () => {
    const uName = pick(o.units), u = UNITS[uName], k = Math.max(...u) + 1, p = u.length;
    const kinds = type === "BD" ? BEADS : SHAPES;
    const mode = pick(o.modes);
    if (mode !== "color" && k > kinds.length) return null;
    let els;
    if (mode === "color") { const sh = pick(kinds); els = shuffle(COLORS).slice(0, k).map(c => c + "-" + sh); }
    else if (mode === "shape") { const co = pick(COLORS); els = shuffle(kinds).slice(0, k).map(s => co + "-" + s); }
    else { const cs = shuffle(COLORS), ss = shuffle(kinds); els = cs.slice(0, k).map((c, i) => c + "-" + ss[i]); }
    const ask = pick(o.asks);
    let len, blank;
    if (ask === "next") { len = 2 * p + 1 + (p >= 4 ? 0 : ri(0, p - 1)); blank = len - 1; }   // the whole unit is seen twice before the blank
    else { len = 2 * p + ri(1, p); blank = ri(p, len - 2); }                                  // a link missing from the middle; first unit whole
    const full = Array.from({ length: len }, (_, i) => els[u[i % p]]);
    const ans = full[blank];
    const seq = full.map((t, i) => (i === blank ? null : t));
    const [co, sh] = ans.split("-");
    const near = shuffle([...COLORS.filter(c => c !== co).map(c => c + "-" + sh), ...kinds.filter(s => s !== sh).map(s => co + "-" + s)]).filter(t => !els.includes(t));
    const others = els.filter(t => t !== ans);
    const prev = full[blank - 1];
    const ch = tokChoices(ans, k >= 3 ? [prev, ...others, ...near] : [prev, ...near], 3);
    if (!ch) return null;
    const unitTxt = u.map(i => tokName(els[i])).join(", ");
    const what = type === "BD" ? "bead" : "one";
    return {
      type, text: (type === "BD" ? "beads: " : "") + seq.map(t => (t ? tokName(t) : "?")).join(", "),
      c: ch.c, ans: ch.ans,
      rule: `the part that repeats is ${unitTxt} (${uName}) — so the ${ask === "next" ? "next" : "missing"} ${what} is ${tokName(ans)}`,
      say: ask === "next" ? (type === "BD" ? "Look at the beads on the string. Which bead comes next?" : "Look at the pattern. Which one comes next?")
        : (type === "BD" ? "One bead is missing from the string. Which bead goes in the empty spot?" : "One is missing from the pattern. Which one goes in the empty spot?"),
      pic: { kind: type === "BD" ? "beads" : "pattern", seq, ask, choicesAs: "tokens" }
    };
  };
}

// GP — growing (or shrinking) pictures: 1, 2, 3 dots, ?
function grow(o) {
  return () => {
    const d = pick(o.d), n = ri(o.n[0], o.n[1]), s = ri(o.s[0], o.s[1]), unit = pick(o.units || ["dots", "blocks"]);
    const total = n + 1, terms = Array.from({ length: total }, (_, i) => s + i * d);
    if (terms.some(t => t < (o.min == null ? 1 : o.min) || t > o.max)) return null;
    const ask = pick(o.asks), blank = ask === "next" ? total - 1 : ri(1, total - 2);
    const ans = terms[blank];
    const mis = ask === "next" ? [terms[blank - 1], ans + d, ans + 2 * d] : [terms[blank - 1], terms[blank + 1], ans + 1, ans - 1];
    const ch = numChoices(ans, mis, o.nc, { min: o.min == null ? 1 : o.min });
    if (!ch) return null;
    const seq = terms.map((t, i) => (i === blank ? null : t));
    const ad = Math.abs(d);
    return {
      type: "GP", text: `${unit}: ` + seq.map(t => (t == null ? "?" : t)).join(", "), c: ch.c, ans: ch.ans,
      rule: `${ad === 1 ? "one" : ad === 2 ? "two" : ad} ${d > 0 ? "more" : "fewer"} each time: ${terms.join(", ")}`,
      say: ask === "next" ? `Each picture changes the same way. How many ${unit} come next?` : `One picture is missing. How many ${unit} go in the empty box?`,
      pic: { kind: "grow", seq, unit, ask, choicesAs: unit }
    };
  };
}

// MF — which side has more / fewer (or the same)?
function compare(o) {
  return () => {
    const item = pick(["dots", "stars", "hearts", "circles"]), nm = n => `${n} ${n === 1 ? item.slice(0, -1) : item}`;
    let l, r;
    if (o.same && R() < o.same) { l = r = ri(2, o.max); }
    else { l = ri(1, o.max); r = ri(1, o.max); const df = Math.abs(l - r); if (df < o.diff[0] || df > o.diff[1]) return null; }
    const ask = pick(o.asks);
    const ans = l === r ? "same" : (ask === "more") === (l > r) ? "left" : "right";
    const c = ["left", "right", "same"];
    const layout = o.tricky && l !== r ? "tricky" : "even";
    const big = Math.max(l, r), small = Math.min(l, r);
    return {
      type: "MF", text: `left: ${nm(l)} · right: ${nm(r)}${layout === "tricky" ? " (the smaller group is spread out wider)" : ""} — which side has ${ask}?`,
      c, ans: "ABC"[c.indexOf(ans)],
      rule: l === r ? `${l} and ${r} — the same` : `${ask === "more" ? big + " is more than " + small : small + " is fewer than " + big}, so the ${ans} side has ${ask}${layout === "tricky" ? " (count them — spread out does not mean more)" : ""}`,
      say: `Which side has ${ask}? Or are they the same?`,
      pic: { kind: "compare", left: { n: l, item }, right: { n: r, item }, ask, layout, choicesAs: "sides" }
    };
  };
}

// MS — two train cars of dots: how many more dots make them the same?
function trains(o) {
  return () => {
    const a = ri(1, o.max), b = ri(1, o.max), d = Math.abs(a - b);
    if (d < o.diff[0] || d > o.diff[1]) return null;
    const big = Math.max(a, b), small = Math.min(a, b);
    const ch = numChoices(d, [d + 1, d - 1, big, small, d + 2], 3, { min: 1 });
    if (!ch) return null;
    return {
      type: "MS", text: `train cars: ${a} dot${a === 1 ? "" : "s"} and ${b} dot${b === 1 ? "" : "s"} — how many more dots on the car with fewer make them the same?`,
      c: ch.c, ans: ch.ans, rule: `${small} + ${d} = ${big}`,
      say: "Here are two train cars. How many dots do we add to the car with fewer, so both cars have the same?",
      pic: { kind: "trains", cars: [a, b], ask: "add-to-fewer", choicesAs: "dots" }
    };
  };
}

// ══════════════════════════════════════════════════════════════════════════
// NE — about how many (1st, 2nd)
// ══════════════════════════════════════════════════════════════════════════
function estDots(o) {
  return () => {
    const ans = pick(o.answers), n = ri(Math.ceil(ans * 0.85), Math.floor(ans * 1.15));
    return {
      type: "NE", text: `about how many dots? (picture: ${n} dots, scattered)`, c: o.tiers.map(fmt), ans: "ABCD"[o.tiers.indexOf(ans)],
      rule: `there are ${n} — that is about ${ans}`,
      say: "Don't count them one by one. About how many dots are there?",
      pic: { kind: "estimate", n, as: "dots", layout: "scatter", seed: ri(1, 999999), choicesAs: "numbers" }
    };
  };
}
const near10 = () => pick([1, 2, 8, 9]);
function estSum(o) {
  return () => {
    const op = pick(o.ops);
    const a = ri(o.a[0], o.a[1]) * 10 + near10(), b = ri(o.b[0], o.b[1]) * 10 + near10();
    if (op === MINUS && a <= b + 15) return null;
    const ra = Math.round(a / 10) * 10, rb = Math.round(b / 10) * 10;
    const ans = op === "+" ? ra + rb : ra - rb, exact = op === "+" ? a + b : a - b;
    if (Math.abs(exact - ans) > 4 || ans <= 0) return null;
    const lo = ans - 20 * ri(0, 3);
    const opts = [0, 1, 2, 3].map(i => lo + 20 * i);
    if (opts[0] < 10) return null;
    return {
      type: "NE", text: `About how much is ${a} ${op} ${b}?`, c: opts.map(fmt), ans: "ABCD"[opts.indexOf(ans)],
      rule: `${a} is about ${ra} and ${b} is about ${rb}; ${ra} ${op} ${rb} = ${ans}`,
      say: `About how much is ${a} ${op === "+" ? "plus" : "minus"} ${b}? Round each number first.`
    };
  };
}

// ══════════════════════════════════════════════════════════════════════════
// NS — number series
// ══════════════════════════════════════════════════════════════════════════
// every series maker returns { terms (shown + hidden), blank, rule, mis }
function series(o, make) {
  return () => {
    const s = make();
    if (!s) return null;
    const { terms, blank } = s;
    if (terms.some(t => !Number.isFinite(t) || (o.min != null && t < o.min) || (o.max != null && t > o.max) || (o.int !== false && !isInt(t)))) return null;
    const ans = terms[blank];
    const ch = numChoices(ans, s.mis, o.nc, { min: o.cmin == null ? (o.min == null ? -Infinity : Math.min(0, o.min)) : o.cmin, int: o.int !== false });
    if (!ch) return null;
    const it = { type: "NS", text: terms.map((t, i) => (i === blank ? "?" : fmt(t))).join("  "), c: ch.c, ans: ch.ans, rule: s.rule };
    if (o.say) it.say = blank === terms.length - 1 ? "What number comes next?" : "What number is missing?";
    return it;
  };
}
const NSK = {
  arith: o => series(o, () => {
    const d = pick(o.d), s = ri(o.s[0], o.s[1]), n = ri(o.n[0], o.n[1]);
    const terms = Array.from({ length: n + 1 }, (_, i) => s + i * d);
    const mid = o.mid && (o.mid === true || R() < o.mid);
    const blank = mid ? ri(1, n - 1) : n, ans = terms[blank];
    return { terms, blank, rule: `${d > 0 ? "add " + fmt(d) : "subtract " + fmt(-d)} each time`,
      mis: mid ? [terms[blank - 1], terms[blank + 1], ans + 1, ans - 1, ans + 2 * d] : [terms[n - 1], ans + d, ans + 1, ans - 1, ans + 2 * d, ans - 2 * d] };
  }),
  geo: o => series(o, () => {
    const r = pick(o.r), s = pick(o.s), n = ri(o.n[0], o.n[1]);
    const terms = [s]; for (let i = 0; i < n; i++) terms.push(rnd(terms[i] * r));
    const ans = terms[n], last = terms[n - 1], prev = terms[n - 2];
    return { terms, blank: n,
      rule: r === 0.5 ? "halve each time" : r < 0 ? `multiply by ${fmt(r)} each time — the sign flips every step` : `multiply by ${fmt(r)} each time`,
      mis: [last + (last - prev), r < 0 ? -ans : last * r * r, last, ans + 1, ans - 1, ans * r] };
  }),
  alt: o => series(o, () => {
    const ops = pick(o.ops)(), k = ops.length, s = ri(o.s[0], o.s[1]), n = k === 2 ? 6 : ri(8, 9);
    const terms = [s]; for (let i = 0; i < n; i++) terms.push(applyOp(terms[i], ops[i % k][0], ops[i % k][1]));
    if (new Set(terms.map(fmt)).size < terms.length) return null;
    const ans = terms[n], last = terms[n - 1], turn = ops[(n - 1) % k];
    const wrong = ops.filter(q => q !== turn).map(q => applyOp(last, q[0], q[1]));
    const txt = ops.map(q => opTxt(q[0], q[1]));
    return { terms, blank: n,
      rule: k === 2 ? `two steps taking turns: ${txt[0]}, then ${txt[1]}` : `three steps repeat: ${txt.join(", ")}; it is ${opTxt(turn[0], turn[1])}’s turn`,
      mis: [...wrong, last, ans + 1, ans - 1, terms[n - 2]] };
  }),
  grow2: o => series(o, () => {
    const s = ri(o.s[0], o.s[1]), d0 = ri(o.d0[0], o.d0[1]), g = pick(o.g), n = ri(o.n[0], o.n[1]);
    const terms = [s]; for (let i = 0; i < n; i++) terms.push(terms[i] + d0 + i * g);
    const steps = terms.slice(1).map((t, i) => t - terms[i]);
    const ans = terms[n], last = terms[n - 1], ls = steps[n - 2];
    if (steps.some(x => x === 0)) return null;
    return { terms, blank: n,
      rule: `the step ${g > 0 ? "grows" : "shrinks"} by ${Math.abs(g)} each time: ${steps.slice(0, -1).map(x => (x > 0 ? "+" : "") + fmt(x)).join(", ")}, so the next step is ${steps[n - 1] > 0 ? "+" : ""}${fmt(steps[n - 1])}`,
      mis: [last + ls, ans + g, ans + 1, ans - 1, last] };
  }),
  inter: o => series(o, () => {
    const n = ri(6, 7);
    const A = pick(o.A)(), B = pick(o.B)();
    const a0 = ri(o.sA[0], o.sA[1]), b0 = ri(o.sB[0], o.sB[1]);
    const val = (sp, s0, j) => (sp[0] === "+" ? s0 + j * sp[1] : s0 * Math.pow(sp[1], j));
    const terms = Array.from({ length: n + 1 }, (_, i) => (i % 2 === 0 ? val(A, a0, i / 2) : val(B, b0, (i - 1) / 2)));
    const ans = terms[n], mine = n % 2 === 0 ? A : B, other = n % 2 === 0 ? B : A;
    const otherNext = n % 2 === 0 ? val(B, b0, n / 2) : val(A, a0, (n + 1) / 2);
    const nm = sp => (sp[0] === "+" ? (sp[1] > 0 ? "+" + fmt(sp[1]) : fmt(sp[1])) : sp[1] === 2 ? "doubling" : "×" + fmt(sp[1]));
    const first = terms.filter((_, i) => i % 2 === 0).slice(0, 3).map(fmt).join(", "), second = terms.filter((_, i) => i % 2 === 1).slice(0, 3).map(fmt).join(", ");
    void mine; void other;
    return { terms, blank: n,
      rule: `two patterns woven together: ${first}, … (${nm(A)}) and ${second}, … (${nm(B)}). The next number belongs to the ${n % 2 === 0 ? "first" : "second"} one`,
      mis: [otherNext, terms[n - 1], terms[n - 2], ans + 1, ans - 1] };
  }),
  fib: o => series(o, () => {
    const a = ri(o.a[0], o.a[1]), b = ri(o.b[0], o.b[1]), n = ri(6, 7);
    const terms = [a, b]; for (let i = 2; i <= n; i++) terms.push(terms[i - 1] + terms[i - 2]);
    const ans = terms[n], last = terms[n - 1], prev = terms[n - 2];
    return { terms, blank: n, rule: "each number is the sum of the two before it", mis: [last + (last - prev), 2 * last, ans + 1, ans - 1, last + prev + 1] };
  }),
  poly: o => series(o, () => {
    const f = pick(o.fns), i0 = ri(f.i0[0], f.i0[1]), n = ri(o.n[0], o.n[1]);
    const terms = Array.from({ length: n + 1 }, (_, j) => f.f(i0 + j));
    const ans = terms[n], last = terms[n - 1], ld = last - terms[n - 2];
    return { terms, blank: n, rule: f.name, mis: [last + ld, ans + 1, ans - 1, f.f(i0 + n + 1), last + ld + 1] };
  }),
  affine: o => series(o, () => {
    const [p, q] = pick(o.pq), s = ri(o.s[0], o.s[1]), n = ri(5, 6);
    const terms = [s]; for (let i = 0; i < n; i++) terms.push(terms[i] * p + q);
    const ans = terms[n], last = terms[n - 1];
    if (new Set(terms).size < terms.length) return null;
    return { terms, blank: n, rule: `each time: ${opTxt("×", p)}, then ${q >= 0 ? "+" + fmt(q) : fmt(q)}`,
      mis: [last * p, last + (last - terms[n - 2]), ans + 1, ans - 1, last * p - q] };
  }),
  diffgeo: o => series(o, () => {
    const s = ri(o.s[0], o.s[1]), d = pick(o.d), r = pick(o.r), n = ri(5, 6);
    const terms = [s]; for (let i = 0; i < n; i++) terms.push(terms[i] + d * Math.pow(r, i));
    const steps = terms.slice(1).map((t, i) => t - terms[i]);
    const ans = terms[n], last = terms[n - 1];
    return { terms, blank: n,
      rule: `the step ${r === 2 ? "doubles" : "triples"} each time: ${steps.slice(0, -1).map(x => "+" + fmt(x)).join(", ")}, so the next step is +${fmt(steps[n - 1])}`,
      mis: [last + steps[n - 2], last + 2 * steps[n - 2] + 1, ans + 1, ans - 1, last * r] };
  })
};

// ══════════════════════════════════════════════════════════════════════════
// NA — number pairs  [3 → 9]  [5 → 15]  [7 → ?]
// ══════════════════════════════════════════════════════════════════════════
// A two-pair item must not also fit a simple bend: p·x² + q·x (+ a number) with p 1–3, q −2…2, or x³ (+ a number) —
// otherwise a child who finds the bend has a second right answer.
function bendFits2(p1, p2) {
  for (const p of [1, 2, 3]) for (const q of [-2, -1, 0, 1, 2]) { const dy = p2[1] - p1[1], want = p * (p2[0] * p2[0] - p1[0] * p1[0]) + q * (p2[0] - p1[0]); if (Math.abs(dy - want) < 1e-9) return true; }
  if (Math.abs((p2[1] - p1[1]) - (p2[0] ** 3 - p1[0] ** 3)) < 1e-9) return true;
  return false;
}
function linName(a, b) {
  if (a === 1) return b > 0 ? `add ${fmt(b)}` : `subtract ${fmt(-b)}`;
  const first = a === 0.5 ? "halve it" : (!isInt(a) && isInt(1 / a) && a > 0) ? `÷${fmt(1 / a)}` : `×${P(a)}`;
  if (b === 0) return a === 0.5 ? "halve it" : first.startsWith("÷") ? `divide by ${fmt(1 / a)}` : `multiply by ${fmt(a)}`;
  return `two steps: ${first}, then ${b > 0 ? "+" + fmt(b) : fmt(b)}`;
}
function pairsText(xs, ys) { return xs.map((x, i) => `[${fmt(x)} → ${i === xs.length - 1 ? "?" : fmt(ys[i])}]`).join("  "); }
function lin(o) {
  return () => {
    const a = pick(o.a), b = o.b ? pick(o.b) : 0;
    const xs = []; let guard = 0;
    while (xs.length < 3 && guard++ < 50) { const x = o.xmul ? ri(o.x[0], o.x[1]) * o.xmul : ri(o.x[0], o.x[1]); if (!xs.includes(x)) xs.push(x); }
    if (xs.length < 3) return null;
    const ys = xs.map(x => rnd(a * x + b));
    if (ys.some(y => (o.int !== false && !isInt(y)) || (o.min != null && y < o.min) || (o.max != null && y > o.max))) return null;
    if (xs.some((x, i) => o.noSelf && x === ys[i])) return null;
    if (bendFits2([xs[0], ys[0]], [xs[1], ys[1]])) return null;
    const ans = ys[2], x3 = xs[2];
    const mis = [a * x3, x3 + (ys[0] - xs[0]), x3 + (ys[1] - xs[1]), ans + 1, ans - 1, ans + a, ans - b, x3];
    const ch = numChoices(ans, mis, o.nc, { min: o.cmin == null ? 0 : o.cmin, int: o.int !== false });
    if (!ch) return null;
    const it = { type: "NA", text: pairsText(xs, ys), c: ch.c, ans: ch.ans, rule: linName(a, b) };
    if (o.pic) it.pic = { kind: "pairs", as: "dots", pairs: xs.map((x, i) => [x, i === 2 ? null : ys[i]]), choicesAs: "numbers" };
    if (o.say) it.say = "Each number changes the same way. What does the last one change into?";
    return it;
  };
}
// three example pairs for a bend (not a straight-line rule)
function bend(o) {
  return () => {
    const f = pick(o.fns);
    const xs = shuffle(Array.from({ length: o.x[1] - o.x[0] + 1 }, (_, i) => o.x[0] + i)).slice(0, 4);
    if (o.sorted) xs.sort((p, q) => p - q);
    const ys = xs.map(f.f);
    if (ys.some(y => (o.max != null && Math.abs(y) > o.max))) return null;
    const ans = ys[3], x4 = xs[3];
    const slope = (ys[2] - ys[1]) / (xs[2] - xs[1]);
    const mis = [ys[2] + slope * (x4 - xs[2]), x4 * x4, ans + 1, ans - 1, f.f(x4 + 1), 2 * x4 + (ys[0] - 2 * xs[0])];
    const ch = numChoices(ans, mis, o.nc, { min: -Infinity });
    if (!ch) return null;
    return { type: "NA", text: pairsText(xs, ys), c: ch.c, ans: ch.ans, rule: f.name };
  };
}

// ══════════════════════════════════════════════════════════════════════════
// NP — number puzzles (one "?"; lines split by " / ")
// ══════════════════════════════════════════════════════════════════════════
function puzzle(o, make) {
  return () => {
    const p = make();
    if (!p) return null;
    if (!Number.isFinite(p.ans) || (o.min != null && p.ans < o.min) || (o.int !== false && !isInt(p.ans))) return null;
    if ((p.text.match(/\?/g) || []).length !== 1) throw new Error("one ? only: " + p.text);
    const ch = numChoices(p.ans, p.mis, o.nc, { min: o.cmin == null ? (o.min == null ? -Infinity : o.min) : o.cmin, int: o.int !== false });
    if (!ch) return null;
    const it = { type: "NP", text: p.text, c: ch.c, ans: ch.ans, rule: p.rule };
    if (p.pic) it.pic = p.pic;
    if (o.say) it.say = "What number goes in the box to make it true?";
    return it;
  };
}
const R2 = o => ri(o[0], o[1]);
const NPK = {
  addMissing: o => puzzle(o, () => { const a = R2(o.a), ans = R2(o.v), b = a + ans; if (b > o.max) return null;
    const left = R() < 0.5;
    return { text: left ? `? + ${a} = ${b}` : `${a} + ? = ${b}`, ans, rule: `${b} − ${a} = ${ans}`, mis: [b, a + b, ans + 1, ans - 1, a],
      pic: o.pic ? { kind: "parts", as: "dots", whole: b, part: a, choicesAs: "numbers" } : undefined }; }),
  subMissing: o => puzzle(o, () => { const a = R2(o.a), b = R2(o.v);
    if (R() < 0.5) { const ans = a + b; if (ans > o.max) return null; return { text: `? − ${a} = ${b}`, ans, rule: `${b} + ${a} = ${ans}`, mis: [b - a, b, ans + 1, ans - 1, a] }; }
    const top = a + b; if (top > o.max) return null; return { text: `${top} − ? = ${b}`, ans: a, rule: `${top} − ${b} = ${a}`, mis: [top + b, b, a + 1, a - 1, top] }; }),
  mulMissing: o => puzzle(o, () => { const a = R2(o.a), ans = R2(o.v), b = a * ans;
    return R() < 0.5 ? { text: `? × ${a} = ${b}`, ans, rule: `${b} ÷ ${a} = ${ans}`, mis: [b - a, b, ans + 1, ans - 1, b + a] }
      : { text: `${a} × ? = ${b}`, ans, rule: `${b} ÷ ${a} = ${ans}`, mis: [b - a, b, ans + 1, ans - 1, a] }; }),
  divMissing: o => puzzle(o, () => { const a = R2(o.a), b = R2(o.v), ans = a * b;
    return { text: `? ÷ ${a} = ${b}`, ans, rule: `${b} × ${a} = ${ans}`, mis: [b, a + b, ans + a, ans - a, ans + 1, ans - 1] }; }),
  balanceAdd: o => puzzle(o, () => { const a = R2(o.a), b = R2(o.a), c = R2(o.c), L = a + b, ans = L - c; if (ans < 0 || c === ans) return null;
    return { text: `${a} + ${b} = ? + ${c}`, ans, rule: `the left side is ${L}, so ? = ${L} − ${c} = ${ans}`, mis: [L, L + c, ans + 1, ans - 1, c] }; }),
  balanceSub: o => puzzle(o, () => { const b = R2(o.a), c = R2(o.c), L = b + c, ans = R2(o.v) + L; if (ans > o.max) return null;
    const a = ans - L;
    return R() < 0.5 ? { text: `? − ${a} = ${b} + ${c}`, ans, rule: `the right side is ${L}, so ? = ${L} + ${a} = ${ans}`, mis: [L, L - a, ans + 1, ans - 1, b + c + 1] }
      : { text: `${ans} − ? = ${b} + ${c}`, ans: a, rule: `the right side is ${L}, so ? = ${ans} − ${L} = ${a}`, mis: [L, ans + L, a + 1, a - 1, ans - b] }; }),
  plusTimes: o => puzzle(o, () => { const b = R2(o.b), c = R2(o.b), a = R2(o.a), L = b * c, sub = R() < 0.5;
    const ans = sub ? L + a : L - a; if (ans <= 0) return null;
    return { text: `? ${sub ? "−" : "+"} ${a} = ${b} × ${c}`, ans, rule: `the right side is ${L}, so ? ${sub ? "−" : "+"} ${a} = ${L} → ${ans}`,
      mis: [L, sub ? L - a : L + a, ans + 1, ans - 1, b + c] }; }),
  timesPlus: o => puzzle(o, () => { const a = R2(o.b), b = R2(o.b), c = R2(o.a), L = a * b, ans = L - c; if (ans <= 0) return null;
    return { text: `${a} × ${b} = ? + ${c}`, ans, rule: `the left side is ${L}, so ? = ${L} − ${c} = ${ans}`, mis: [L, L + c, ans + 1, ans - 1, a + b] }; }),
  timesTimes: o => puzzle(o, () => { const a = R2(o.b), b = R2(o.b), c = pick(o.c), L = a * b; if (L % c || c === a || c === b) return null; const ans = L / c;
    return { text: `${a} × ${b} = ? × ${c}`, ans, rule: `the left side is ${L}, so ? = ${L} ÷ ${c} = ${ans}`, mis: [L, L - c, ans + 1, ans - 1, ans * 2] }; }),
  // Lincoln-style: ? − 9 = 4 × ◆ / ◆ + 8 = 13
  subst: o => puzzle(o, () => { const m = R2(o.m), k = R2(o.k), c = R2(o.c), d0 = R2(o.a);
    const form = pick(["◆ + c = d", "d = ◆ − c", "◆ = c × d", "◆ = c ÷ d"]);
    let dia, line2;
    if (form === "◆ + c = d") { dia = m; line2 = `◆ + ${c} = ${m + c}`; }
    else if (form === "d = ◆ − c") { if (m - c < 1) return null; dia = m; line2 = `${m - c} = ◆ − ${c}`; }
    else if (form === "◆ = c × d") { const f = R2([2, 5]); dia = c * f; line2 = `◆ = ${c} × ${f}`; }
    else { const f = R2([2, 6]); dia = R2([2, 9]); line2 = `◆ = ${dia * f} ÷ ${f}`; }
    const sub = R() < 0.5, prod = k * dia, ans = sub ? prod + d0 : prod - d0; if (ans < 0) return null;
    return { text: `? ${sub ? "−" : "+"} ${d0} = ${k} × ◆ / ${line2}`, ans,
      rule: `◆ = ${dia}, so ${k} × ◆ = ${prod}, so ? = ${prod} ${sub ? "+" : "−"} ${d0} = ${ans}`,
      mis: [prod, sub ? prod - d0 : prod + d0, dia, ans + 1, ans - 1] }; }),
  // three lines, worked from the bottom up
  chain: o => puzzle(o, () => {
    const dia = R2([2, 12]); const mode = pick(["+", "×"]);
    const line3 = mode === "+" ? (() => { const c = R2([1, 9]); return `◆ + ${c} = ${dia + c}`; })() : (() => { const f = R2([2, 6]); return `◆ = ${dia * f} ÷ ${f}`; })();
    const op2 = pick(["×", "−", "+"]), k2 = op2 === "×" ? R2([2, 6]) : R2([1, 9]);
    const dot = op2 === "×" ? dia * k2 : op2 === "−" ? dia - k2 : dia + k2; if (dot <= 0) return null;
    const op1 = pick(["÷", "×", "−"]), k1 = op1 === "×" ? 2 : op1 === "÷" ? pick([2, 3, 4]) : R2([1, 9]);
    if (op1 === "÷" && dot % k1) return null;
    const ans = op1 === "÷" ? dot / k1 : op1 === "×" ? dot * k1 : dot - k1; if (ans < 0) return null;
    return { text: `? = ● ${op1} ${k1} / ● = ◆ ${op2} ${k2} / ${line3}`, ans,
      rule: `work from the bottom up: ◆ = ${dia}, ● = ${dot}, ? = ${ans}`, mis: [dot, dia, ans + 1, ans - 1, op1 === "÷" ? dot * k1 : dot / k1] }; }),
  // two symbols, two clues
  system: o => puzzle(o, () => {
    const d = R2(o.d), e = R2(o.e); if (d === e || d === 0 || e === 0 || d + e === 0 || (o.pos && (d <= 0 || e <= 0))) return null;
    const s = d + e, df = d - e, fin = pick(o.fin || ["×", "+", "−"]);
    const ans = fin === "×" ? d * e : fin === "+" ? 2 * d + e : d - 2 * e;
    const finTxt = fin === "×" ? "? = ◆ × ●" : fin === "+" ? "? = 2 × ◆ + ●" : "? = ◆ − 2 × ●";
    return { text: `◆ + ● = ${fmt(s)} / ◆ − ● = ${fmt(df)} / ${finTxt}`, ans,
      rule: `add the two clues: 2 × ◆ = ${fmt(s + df)}, so ◆ = ${fmt(d)} and ● = ${fmt(e)}; ? = ${fmt(ans)}`,
      mis: [s * df, d, e, ans + 1, ans - 1, fin === "×" ? d + e : d * e] }; }),
  signed: o => puzzle(o, () => {
    const form = pick(o.forms || ["subNeg", "mulNeg", "addTo", "divNeg"]), a = R2(o.a), b = R2(o.b);
    if (a === 0 || b === 0) return null;
    if (form === "subNeg") { const ans = b - a; return { text: `? − ${P(-a)} = ${fmt(b)}`, ans, rule: `subtracting ${fmt(-a)} adds ${a}, so ? = ${fmt(b)} − ${a} = ${fmt(ans)}`, mis: [b + a, -ans, ans + 1, ans - 1, a - b] }; }
    if (form === "mulNeg") { const ans = b, prod = -a * b; return { text: `${fmt(-a)} × ? = ${fmt(prod)}`, ans, rule: `${fmt(prod)} ÷ ${P(-a)} = ${fmt(ans)}`, mis: [-ans, prod + a, ans + 1, ans - 1, prod] }; }
    if (form === "divNeg") { const ans = -a * b; return { text: `? ÷ ${P(-a)} = ${fmt(b)}`, ans, rule: `${fmt(b)} × ${P(-a)} = ${fmt(ans)}`, mis: [-ans, b - a, ans + 1, ans - 1, b] }; }
    const ans = -b - a; return { text: `? + ${a} = ${fmt(-b)}`, ans, rule: `${fmt(-b)} − ${a} = ${fmt(ans)}`, mis: [a - b, b - a, ans + 1, ans - 1, -ans] }; }),
  ratio: o => puzzle(o, () => {
    const [p, q] = pick(o.pq), f = pick(o.f), g = pick(o.g);
    const A = rnd(p * f), B = rnd(q * f), C = rnd(p * g), D = rnd(q * g);
    if (A === C) return null;
    const where = pick(["C", "D", "A"]);
    if (where === "D") return { text: `${fmt(A)} : ${fmt(B)} = ${fmt(C)} : ?`, ans: D, rule: `${fmt(A)} : ${fmt(B)} is the same as ${p} : ${q}, so ? = ${fmt(C)} × ${q} ÷ ${p} = ${fmt(D)}`, mis: [C + (B - A), rnd(C * A / B), D + 1, D - 1, rnd(B * C / A + B)] };
    if (where === "C") return { text: `${fmt(A)} : ${fmt(B)} = ? : ${fmt(D)}`, ans: C, rule: `${fmt(A)} : ${fmt(B)} is the same as ${p} : ${q}, so ? = ${fmt(D)} × ${p} ÷ ${q} = ${fmt(C)}`, mis: [D - (B - A), rnd(D * B / A), C + 1, C - 1, rnd(A * D)] };
    return { text: `? : ${fmt(B)} = ${fmt(C)} : ${fmt(D)}`, ans: A, rule: `${fmt(C)} : ${fmt(D)} is the same as ${p} : ${q}, so ? = ${fmt(B)} × ${p} ÷ ${q} = ${fmt(A)}`, mis: [B - (D - C), rnd(B * D / C), A + 1, A - 1, rnd(C * B)] };
  }),
  percent: o => puzzle(o, () => {
    const pc = pick(o.p), n = pick(o.n), ans = rnd(pc * n / 100); if (o.int !== false && !isInt(ans)) return null;
    const ten = rnd(n / 10);
    return { text: `? = ${pc}% of ${n}`, ans, rule: pc === 50 ? `half of ${n} is ${fmt(ans)}` : `10% of ${n} is ${fmt(ten)}, so ${pc}% is ${fmt(ans)}`,
      mis: [rnd(n - ans), rnd(pc * n / 10), rnd(ans + ten), rnd(ans - ten), rnd(n / pc)] };
  }),
  bracket: o => puzzle(o, () => {
    const form = pick(o.forms || ["mulBr", "divPlus"]);
    if (form === "mulBr") { const a = R2(o.a), b = R2(o.b), v = R2(o.v), ans = v + b, c = a * v; if (c === 0) return null;
      return { text: `${fmt(a)} × (? − ${b}) = ${fmt(c)}`, ans, rule: `${fmt(c)} ÷ ${P(a)} = ${fmt(v)}, so ? − ${b} = ${fmt(v)} → ${fmt(ans)}`, mis: [v - b, v, rnd((c + b) / a), ans + 1, ans - 1] }; }
    if (form === "mulBrPlus") { const a = R2(o.a), b = R2(o.b), v = R2(o.v), ans = v - b, c = a * v; if (c === 0) return null;
      return { text: `${fmt(a)} × (? + ${b}) = ${fmt(c)}`, ans, rule: `${fmt(c)} ÷ ${P(a)} = ${fmt(v)}, so ? + ${b} = ${fmt(v)} → ${fmt(ans)}`, mis: [v + b, v, rnd((c - b) / a), ans + 1, ans - 1] }; }
    const a = R2([2, 6]), b = R2(o.b), v = R2(o.v), ans = v * a, c = v + b;
    return { text: `? ÷ ${a} + ${b} = ${fmt(c)}`, ans, rule: `? ÷ ${a} = ${fmt(c)} − ${b} = ${fmt(v)}, so ? = ${fmt(v)} × ${a} = ${fmt(ans)}`, mis: [(c + b) * a, c * a - b, v, ans + 1, ans - 1] };
  }),
  powers: o => puzzle(o, () => {
    const form = pick(o.forms || ["div", "mul", "root"]);
    if (form === "div") { const b = pick([2, 3, 10]), m = R2([4, 7]), n = R2([1, m - 1]), ans = Math.pow(b, m - n); if (ans > 1000) return null;
      return { text: `? = ${b}${sup(m)} ÷ ${b}${sup(n)}`, ans, rule: `${b}${sup(m)} ÷ ${b}${sup(n)} = ${b}${sup(m - n)} = ${ans}`, mis: [b * (m - n), Math.pow(b, m) - Math.pow(b, n), ans * b, rnd(m / n), ans + 1] }; }
    if (form === "mul") { const b = pick([2, 3]), m = R2([1, 4]), n = R2([1, 3]), ans = Math.pow(b, m + n); if (ans > 1000) return null;
      return { text: `? = ${b}${sup(m)} × ${b}${sup(n)}`, ans, rule: `${b}${sup(m)} × ${b}${sup(n)} = ${b}${sup(m + n)} = ${ans}`, mis: [Math.pow(b, m * n), b * (m + n), ans / b, ans * b, ans + 1] }; }
    if (form === "sq") { const a = R2([3, 12]), k = R2([1, 20]), sub = R() < 0.5, ans = sub ? a * a - k : a * a + k;
      return { text: `? ${sub ? "+" : "−"} ${k} = ${a}${sup(2)}`, ans, rule: `${a}${sup(2)} = ${a * a}, so ? = ${a * a} ${sub ? "−" : "+"} ${k} = ${ans}`, mis: [2 * a + (sub ? -k : k), a * a, sub ? a * a + k : a * a - k, ans + 1, ans - 1] }; }
    const r = R2([3, 15]), b = R2([r + 1, r + 30]), ans = b - r;
    return { text: `√${r * r} + ? = ${b}`, ans, rule: `√${r * r} = ${r}, so ? = ${b} − ${r} = ${ans}`, mis: [b - r * r / 2, b + r, ans + 1, ans - 1, b - r * r] };
  }),
  bothSides: o => puzzle(o, () => {
    const a = R2(o.a), c = R2(o.c); if (a <= c) return null;
    const dia = R2(o.v), bk = R2(o.b), d = (a - c) * dia - bk; if (dia === 0) return null;
    const e = R2([1, 9]), fin = pick(["+", "×"]), ans = fin === "+" ? dia + e : dia * 2;
    const cd = c === 1 ? "◆" : `${c} × ◆`;
    return { text: `${a} × ◆ − ${bk} = ${cd} ${d >= 0 ? "+ " + d : "− " + (-d)} / ? = ◆ ${fin === "+" ? "+ " + e : "× 2"}`, ans,
      rule: `take ${cd} from both sides: ${a - c} × ◆ = ${fmt(d + bk)}, so ◆ = ${fmt(dia)} and ? = ${fmt(ans)}`,
      mis: [dia, fin === "+" ? rnd((d - bk) / (a - c)) + e : rnd((d - bk) / (a - c)) * 2, rnd((d + bk) / (a + c)), ans + 1, ans - 1] };
  })
};

// ══════════════════════════════════════════════════════════════════════════
// THE LEVELS — stage by stage (each stage: [count, maker] slots, dealt round-robin so kinds alternate)
// ══════════════════════════════════════════════════════════════════════════
const op = (o, v) => [o, v];
const either = (...fs) => () => pick(fs)();
const PLUS = "+";
const L = {};
// ── Pre-K: 3 choices, numbers ≤ 5, nothing to read ──
{
  const nc = 3;
  L.prek = { label: "Pre-K", choices: 3, stages: [
    ["see it, say it — AB patterns, which has more", [[8, pattern("RP", { units: ["AB"], modes: ["color"], asks: ["next"] })], [7, compare({ max: 5, diff: [2, 4], asks: ["more"] })]]],
    ["shapes, fewer, and growing", [[5, pattern("RP", { units: ["AB"], modes: ["shape"], asks: ["next"] })], [5, compare({ max: 5, diff: [2, 4], asks: ["fewer"] })], [5, grow({ d: [1], s: [1, 2], n: [3, 4], max: 5, asks: ["next"], nc })]]],
    ["two of one kind — AAB / ABB, close counts, make them the same", [[5, pattern("RP", { units: ["AAB", "ABB"], modes: ["color", "shape"], asks: ["next"] })], [5, compare({ max: 5, diff: [1, 2], asks: ["more", "fewer"], same: 0.25 })], [5, trains({ max: 5, diff: [1, 1] })]]],
    ["three in a row — ABC, beads, missing pictures", [[4, pattern("RP", { units: ["ABC"], modes: ["color", "shape"], asks: ["next"] })], [4, pattern("BD", { units: ["AB", "ABB"], modes: ["color"], asks: ["next"] })], [3, grow({ d: [1, -1], s: [1, 5], n: [3, 4], max: 5, asks: ["middle", "next"], nc })], [4, trains({ max: 5, diff: [1, 2] })]]]
  ] };
}
// ── K: 3 choices, numbers ≤ 10 ──
{
  const nc = 3;
  L.k = { label: "Kindergarten", choices: 3, stages: [
    ["patterns of three, more or fewer to 10, counting on", [[4, pattern("RP", { units: ["AAB", "ABB", "ABC"], modes: ["color", "shape", "both"], asks: ["next"] })], [4, compare({ max: 10, diff: [3, 9], asks: ["more", "fewer"] })], [4, grow({ d: [1], s: [3, 7], n: [3, 4], max: 10, asks: ["next"], nc })]]],
    ["bead strings — the missing link, make them the same", [[4, pattern("BD", { units: ["AB", "ABB", "AAB"], modes: ["color", "shape"], asks: ["missing"] })], [4, trains({ max: 10, diff: [1, 3] })], [4, grow({ d: [1], s: [1, 6], n: [4, 4], max: 10, asks: ["middle"], nc })]]],
    ["longer patterns, close counts, growing by 2", [[4, pattern("RP", { units: ["AABB", "ABCD", "ABAC"], modes: ["color", "both"], asks: ["next"] })], [4, compare({ max: 10, diff: [1, 2], asks: ["more", "fewer"], same: 0.25 })], [4, grow({ d: [2], s: [1, 2], n: [3, 4], max: 10, asks: ["next"], nc })]]],
    ["harder bead strings, bigger gaps, shrinking", [[4, pattern("BD", { units: ["ABC", "AABB", "ABBC"], modes: ["color", "both"], asks: ["missing"] })], [4, trains({ max: 10, diff: [2, 5] })], [4, grow({ d: [-1, -2], s: [6, 10], n: [3, 4], max: 10, asks: ["next"], nc })]]],
    ["the missing link anywhere, tricky spreads, skip counts", [[4, pattern("RP", { units: ["ABCD", "ABAC", "AABB", "ABBC"], modes: ["both"], asks: ["missing"] })], [4, compare({ max: 10, diff: [1, 2], asks: ["more", "fewer"], tricky: true })], [4, grow({ d: [2, -2], s: [1, 10], n: [4, 4], max: 10, asks: ["middle"], nc })]]]
  ] };
}
// ── 1st: 4 choices, to 20 (patterns to 50) ──
{
  const nc = 4, base = { nc, min: 0, say: true };
  L.g1 = { label: "1st grade", choices: 4, stages: [
    ["count on", [[3, NSK.arith({ ...base, d: [1], s: [1, 15], n: [4, 5], max: 25 })], [3, NPK.addMissing({ ...base, a: [1, 5], v: [1, 5], max: 10, pic: true })], [3, lin({ ...base, a: [1], b: [1], x: [1, 8], max: 10, pic: true })], [3, estDots({ tiers: [2, 5, 10, 20], answers: [5, 10] })]]],
    ["count by 2s, 5s, 10s", [[3, NSK.arith({ ...base, d: [2, 5, 10], s: [0, 0], n: [4, 5], max: 60 })], [3, NPK.addMissing({ ...base, a: [2, 6], v: [2, 6], max: 10, pic: true })], [3, lin({ ...base, a: [1], b: [2], x: [1, 8], max: 12, pic: true })], [3, estDots({ tiers: [5, 10, 20, 50], answers: [10, 20] })]]],
    ["count back", [[3, NSK.arith({ ...base, d: [-1, -2], s: [10, 20], n: [4, 5] })], [3, NPK.subMissing({ ...base, a: [1, 6], v: [1, 6], max: 10 })], [3, lin({ ...base, a: [1], b: [-1, -2], x: [3, 10], pic: true })], [3, estDots({ tiers: [5, 10, 20, 50], answers: [10, 20] })]]],
    ["missing in the middle", [[3, NSK.arith({ ...base, d: [2, 5, 10], s: [1, 9], n: [5, 5], mid: true, max: 70 })], [3, NPK.subMissing({ ...base, a: [3, 9], v: [2, 9], max: 20 })], [3, lin({ ...base, a: [1], b: [3, 4, 5], x: [1, 15], max: 20 })], [3, estDots({ tiers: [5, 10, 20, 50], answers: [20, 50] })]]],
    ["both sides balance", [[3, either(NSK.arith({ ...base, d: [10], s: [3, 9], n: [4, 5], mid: 0.5 }), NSK.arith({ ...base, d: [-5, -10], s: [50, 60], n: [4, 5], mid: 0.5 }))], [3, NPK.balanceAdd({ ...base, a: [1, 9], c: [1, 9] })], [3, lin({ ...base, a: [2], b: [0], x: [1, 10], noSelf: true })], [3, estDots({ tiers: [10, 20, 50, 100], answers: [20, 50] })]]]
  ] };
}
// ── 2nd: 4 choices, to 100 ──
{
  const nc = 4, base = { nc, min: 0, say: true };
  L.g2 = { label: "2nd grade", choices: 4, stages: [
    ["skip count to 100", [[3, NSK.arith({ ...base, d: [2, 5, 10], s: [3, 40], n: [4, 5], max: 100 })], [3, NPK.addMissing({ ...base, a: [4, 12], v: [3, 9], max: 20 })], [3, lin({ ...base, a: [1], b: [3, 4, 5, 6, 7, 8, 9], x: [2, 40] })], [3, estDots({ tiers: [10, 20, 50, 100], answers: [20, 50] })]]],
    ["count back, take away", [[3, NSK.arith({ ...base, d: [-2, -5, -10], s: [40, 99], n: [4, 5] })], [3, NPK.subMissing({ ...base, a: [4, 9], v: [3, 11], max: 20 })], [3, lin({ ...base, a: [1], b: [-3, -4, -5, -6, -7, -8, -9], x: [12, 50] })], [3, estSum({ ops: ["+"], a: [1, 4], b: [1, 4] })]]],
    ["bigger jumps, two-digit puzzles", [[3, NSK.arith({ ...base, d: [3, 4, 10, -10], s: [1, 35], n: [5, 5], mid: true, max: 100 })], [3, NPK.addMissing({ ...base, a: [11, 40], v: [11, 45], max: 99 })], [3, lin({ ...base, a: [1], b: [10, -10, 20, 11, 9], x: [12, 70], max: 99 })], [3, estSum({ ops: ["+", "−"], a: [2, 6], b: [1, 3] })]]],
    ["growing steps, balance, doubles", [[3, NSK.grow2({ ...base, s: [1, 10], d0: [1, 2], g: [1], n: [5, 5], max: 60 })], [3, NPK.balanceAdd({ ...base, a: [5, 19], c: [2, 12] })], [3, lin({ ...base, a: [2, 0.5], b: [0], x: [2, 20], noSelf: true })], [3, estSum({ ops: ["−"], a: [5, 9], b: [1, 4] })]]],
    ["two steps taking turns — the bridge to 3rd", [[3, NSK.alt({ ...base, s: [1, 12], ops: [() => [op(PLUS, ri(2, 5)), op(MINUS, 1)], () => [op(PLUS, ri(3, 6)), op(MINUS, 2)]] })], [3, NPK.balanceSub({ ...base, a: [2, 9], c: [2, 9], v: [1, 9], max: 40 })], [3, lin({ ...base, a: [1], b: [12, 15, -12, -15, 25], x: [20, 60], max: 99 })], [3, estSum({ ops: ["+", "−"], a: [2, 7], b: [1, 4] })]]]
  ] };
}
// ── 3rd: 5 choices, boys' box shape — sits below Ellis's stage 2 and meets it at stage 5 ──
{
  const nc = 5, base = { nc, min: 0 };
  L.g3 = { label: "3rd grade", choices: 5, stages: [
    ["one rule — add", [[4, NSK.arith({ ...base, d: [2, 3, 4, 5, 6, 7, 8, 9], s: [1, 30], n: [5, 6] })], [4, lin({ ...base, a: [1], b: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], x: [1, 40] })], [4, NPK.addMissing({ ...base, a: [3, 20], v: [3, 25], max: 50 })]]],
    ["one rule — take away", [[4, NSK.arith({ ...base, d: [-2, -3, -4, -5, -6, -7, -8, -9], s: [40, 70], n: [5, 6] })], [4, lin({ ...base, a: [1], b: [-2, -3, -4, -5, -6, -7, -8, -9], x: [10, 60] })], [4, NPK.subMissing({ ...base, a: [3, 19], v: [3, 25], max: 50 })]]],
    ["times facts and growing steps", [[4, (() => { const g = NSK.geo({ ...base, r: [2], s: [1, 2, 3, 5], n: [4, 5], max: 100 }), h = NSK.grow2({ ...base, s: [1, 12], d0: [1, 3], g: [1], n: [5, 5], max: 60 }); return () => (R() < 0.5 ? g() : h()); })()], [4, lin({ ...base, a: [2, 5, 10], b: [0], x: [1, 10], noSelf: true })], [4, (() => { const m = NPK.mulMissing({ ...base, a: [2, 5], v: [2, 10] }), b = NPK.balanceAdd({ ...base, a: [3, 15], c: [2, 9] }); return () => (R() < 0.5 ? m() : b()); })()]]],
    ["two steps taking turns, more facts", [[4, NSK.alt({ ...base, s: [2, 20], ops: [() => [op(PLUS, ri(3, 6)), op(MINUS, ri(1, 2))], () => [op(PLUS, ri(4, 7)), op(MINUS, ri(2, 3))]] })], [4, lin({ ...base, a: [3, 4, 0.5, 0.2, 0.1], b: [0], x: [1, 10], xmul: 10, noSelf: true, max: 100 })], [4, (() => { const d = NPK.divMissing({ ...base, a: [2, 5], v: [2, 9] }), p = NPK.plusTimes({ ...base, a: [1, 6], b: [2, 4] }); return () => (R() < 0.5 ? d() : p()); })()]]],
    ["the bridge to 4th — woven patterns, bigger rules", [[4, (() => { const a = NSK.alt({ ...base, s: [2, 20], ops: [() => [op(PLUS, ri(4, 8)), op(MINUS, ri(1, 3))]] }), w = NSK.inter({ ...base, A: [() => op("+", ri(2, 4))], B: [() => op("+", ri(2, 5))], sA: [1, 9], sB: [20, 40] }); return () => (R() < 0.5 ? a() : w()); })()], [4, either(lin({ ...base, a: [1], b: [11, 12, 13, 15, -11, -12, -15], x: [16, 60], max: 100 }), lin({ ...base, a: [3, 4], b: [0], x: [3, 12], max: 100, noSelf: true }))], [4, (() => { const p = NPK.plusTimes({ ...base, a: [2, 9], b: [2, 6] }), t = NPK.timesPlus({ ...base, a: [2, 9], b: [2, 6] }); return () => (R() < 0.5 ? p() : t()); })()]]]
  ] };
}
// ── 5th: 5 choices — between Ellis's top (chains, half-steps) and Lincoln's top (squares, fractions) ──
{
  const nc = 5, base = { nc, min: 0 };
  L.g5 = { label: "5th grade", choices: 5, stages: [
    ["two-step rules", [[4, either(NSK.inter({ ...base, A: [() => op("+", ri(2, 5))], B: [() => op("+", -ri(2, 5))], sA: [1, 9], sB: [30, 50] }), NSK.alt({ ...base, s: [2, 6], ops: [() => [op("×", 2), op(MINUS, ri(1, 3))]], max: 200 }))], [4, lin({ ...base, a: [2, 3, 4], b: [1, 2, 3, 4, 5, -1, -2, -3], x: [2, 15], max: 100 })], [4, NPK.subst({ ...base, m: [2, 9], k: [2, 5], c: [2, 8], a: [1, 9] })]]],
    ["growing steps and three-step repeats", [[4, either(NSK.grow2({ ...base, s: [1, 20], d0: [1, 4], g: [2, 3], n: [5, 5], max: 150 }), NSK.alt({ ...base, s: [2, 15], ops: [() => [op(PLUS, ri(2, 4)), op(PLUS, ri(5, 8)), op(MINUS, ri(1, 2))]] }))], [4, lin({ ...base, a: [0.5, 1 / 3, 0.25], b: [1, 2, 3, -1, -2], x: [1, 8], xmul: 12, max: 100 })], [4, NPK.subst({ ...base, m: [3, 12], k: [2, 6], c: [3, 9], a: [2, 12] })]]],
    ["halves and chains", [[4, either(NSK.alt({ ...base, s: [2, 6], ops: [() => [op("×", 2), op(MINUS, 0.5)]], int: false, max: 200 }), NSK.arith({ ...base, d: [1.5, 2.5, 0.5], s: [1, 10], n: [5, 6], int: false }))], [4, lin({ ...base, a: [0.5], b: [1, 2, 3, 4], x: [3, 25], int: false })], [4, NPK.chain({ ...base })]]],
    ["squares and sums", [[4, either(NSK.poly({ ...base, fns: [{ f: i => i * i, i0: [1, 4], name: "square numbers (1×1, 2×2, 3×3 …) — the steps are the odd numbers" }, { f: i => i * i + 1, i0: [1, 3], name: "square numbers plus 1 (each is a number times itself, then +1)" }], n: [5, 5] }), NSK.fib({ ...base, a: [1, 5], b: [1, 6] }))], [4, bend({ ...base, fns: [{ f: x => x * x, name: "multiply the number by itself" }, { f: x => x * x + 1, name: "multiply the number by itself, then +1" }, { f: x => x * x - 1, name: "multiply the number by itself, then −1" }], x: [2, 10], max: 200 })], [4, either(NPK.timesTimes({ ...base, b: [2, 9], c: [2, 3, 4, 6] }), NPK.timesPlus({ ...base, a: [5, 20], b: [3, 9] }))]]],
    ["mixed — near the 6th-grade top", [[4, either(NSK.alt({ ...base, s: [2, 6], ops: [() => [op("×", 2), op(PLUS, ri(2, 4)), op(MINUS, 1)]], max: 300 }), NSK.inter({ ...base, A: [() => op("×", 2)], B: [() => op("+", -ri(2, 3))], sA: [1, 3], sB: [25, 40] }))], [4, lin({ ...base, a: [5, 6, 7], b: [-3, -4, -5, -6, 2, 3], x: [3, 12], max: 100 })], [4, NPK.chain({ ...base })]]]
  ] };
}
// ── 7th: 5 choices — above Lincoln's top: powers, below zero, ratio and percent, growing rules ──
{
  const nc = 5, base = { nc, min: -500, cmin: -1000 };
  L.g7 = { label: "7th grade", choices: 5, stages: [
    ["powers and patterns", [[4, either(NSK.geo({ ...base, r: [2, 3], s: [1, 2, 3, 5], n: [5, 5], max: 1000 }), NSK.poly({ ...base, fns: [{ f: i => i * i * i, i0: [1, 2], name: "cube numbers (1×1×1, 2×2×2 …)" }, { f: i => i * (i + 1), i0: [1, 4], name: "a number times the next number: 1×2, 2×3, 3×4 …" }], n: [5, 5] }), NSK.fib({ ...base, a: [2, 9], b: [3, 12] }))], [4, bend({ ...base, fns: [{ f: x => x * x + 3, name: "square it, then +3" }, { f: x => x * x - 4, name: "square it, then −4" }, { f: x => x * x * x, name: "cube it (x × x × x)" }], x: [1, 9], max: 750 })], [4, NPK.system({ ...base, d: [5, 15], e: [1, 9], pos: true })]]],
    ["below zero", [[4, either(NSK.arith({ ...base, d: [-3, -4, -6, -7], s: [5, 15], n: [6, 6] }), NSK.geo({ ...base, r: [-2], s: [1, 3, -1, -2], n: [5, 5] }))], [4, lin({ ...base, a: [-1, -2, -3], b: [1, 2, 3, 4, 5, -2], x: [-5, 6], cmin: -100 })], [4, NPK.signed({ ...base, a: [2, 9], b: [-12, 12] })]]],
    ["ratio and percent", [[4, either(NSK.geo({ ...base, r: [1.5], s: [16, 32, 64], n: [4, 4], int: true }), NSK.geo({ ...base, r: [0.5], s: [96, 160, 192, 224], n: [5, 5] }))], [4, lin({ ...base, a: [1.5, 2.5, 0.75], b: [0], x: [2, 12], xmul: 4, max: 200, noSelf: true })], [4, either(NPK.ratio({ ...base, cmin: 0, pq: [[2, 3], [3, 4], [3, 5], [4, 7], [5, 6]], f: [2, 3, 4], g: [5, 6, 7, 8, 9] }), NPK.percent({ ...base, cmin: 0, p: [10, 20, 25, 30, 40, 60, 75], n: [40, 60, 80, 120, 140, 160, 240] }))]]],
    ["growing rules", [[4, either(NSK.diffgeo({ ...base, s: [1, 9], d: [1, 2, 3], r: [2] }), NSK.grow2({ ...base, s: [1, 20], d0: [2, 6], g: [3, 4], n: [5, 5], max: 300 }), NSK.affine({ ...base, pq: [[2, 1], [2, -1], [3, -1]], s: [1, 4], max: 800 }))], [4, bend({ ...base, fns: [{ f: x => x * x - x, name: "square it, then take away the number (x × x − x)" }, { f: x => 2 * x * x, name: "square it, then double (2 × x × x)" }, { f: x => x * x + x, name: "square it, then add the number (x × x + x)" }], x: [1, 10], max: 300 })], [4, NPK.bracket({ ...base, forms: ["mulBr", "divPlus"], a: [2, 9], b: [1, 9], v: [2, 12] })]]],
    ["mixed — signed, woven, proportion", [[4, either(NSK.inter({ ...base, A: [() => op("+", -ri(3, 6))], B: [() => op("×", 2)], sA: [5, 10], sB: [1, 3] }), NSK.alt({ ...base, s: [1, 5], ops: [() => [op("×", -2), op(PLUS, ri(1, 3))]] }))], [4, lin({ ...base, a: [0.5, -0.5], b: [-3, -2, 2, 3, -4], x: [-12, 12], xmul: 2, cmin: -100 })], [4, either(NPK.ratio({ ...base, cmin: 0, pq: [[2, 5], [3, 8], [4, 5]], f: [0.5, 1.5, 2.5], g: [3, 4, 6], int: false }), NPK.percent({ ...base, cmin: 0, p: [110, 120, 150, 125, 15, 35], n: [20, 40, 60, 80, 120, 200] }), NPK.signed({ ...base, forms: ["divNeg", "mulNeg"], a: [3, 9], b: [-9, 9] }))]]]
  ] };
}
// ── 8th: 5 choices — exponents, signed two-step rules, proportion, unknowns on both sides ──
{
  const nc = 5, base = { nc, min: -1000, cmin: -2000 };
  L.g8 = { label: "8th grade", choices: 5, stages: [
    ["exponents", [[4, either(NSK.affine({ ...base, pq: [[2, 1], [2, -1], [3, 1]], s: [1, 3], max: 1000 }), NSK.geo({ ...base, r: [-3, 3], s: [1, 2, -1], n: [5, 5] }))], [4, bend({ ...base, fns: [{ f: x => x * x * x - 1, name: "cube it, then −1" }, { f: x => x * x + x, name: "square it, then add the number" }, { f: x => x * x * x + 2, name: "cube it, then +2" }], x: [1, 9], max: 750 })], [4, NPK.powers({ ...base, forms: ["div", "mul", "root", "sq"] })]]],
    ["signed two-step rules", [[4, either(NSK.grow2({ ...base, s: [10, 30], d0: [-1, 2], g: [-2, -3], n: [5, 5] }), NSK.affine({ ...base, pq: [[-2, 1], [-2, 3], [-3, 2]], s: [1, 3] }))], [4, lin({ ...base, a: [-3, -4, -5, 3, 4], b: [-4, -6, -7, 5, 8], x: [-6, 8], cmin: -200 })], [4, NPK.system({ ...base, d: [-6, 12], e: [-9, 6], fin: ["×", "−"] })]]],
    ["proportion", [[4, either(NSK.geo({ ...base, r: [1.5], s: [16, 32], n: [5, 5] }), NSK.geo({ ...base, r: [-0.5], s: [64, 96, 128, -96, 160], n: [5, 5] }))], [4, lin({ ...base, a: [2.5, 0.75, 1.25, 0.4], b: [0], x: [2, 12], xmul: 4, int: false, noSelf: true })], [4, either(NPK.ratio({ ...base, cmin: 0, pq: [[3, 5], [5, 8], [4, 9], [7, 10]], f: [1.5, 2.5, 0.5], g: [2, 3, 4, 6], int: false }), NPK.percent({ ...base, cmin: 0, p: [15, 35, 45, 65, 12.5, 2.5], n: [40, 60, 80, 120, 160, 240, 280], int: false }))]]],
    ["growing and woven", [[4, either(NSK.poly({ ...base, fns: [{ f: i => i * (i + 1) / 2, i0: [1, 4], name: "triangle numbers: the step grows by 1 each time (1, 1+2, 1+2+3 …)" }, { f: i => i * i * i - i, i0: [1, 3], name: "a number cubed, take away the number (x × x × x − x)" }], n: [5, 5] }), NSK.inter({ ...base, A: [() => op("×", 3)], B: [() => op("+", -ri(4, 7))], sA: [1, 2], sB: [5, 12] }), NSK.fib({ ...base, a: [-5, -1], b: [2, 7] }))], [4, bend({ ...base, fns: [{ f: x => x * x - 2 * x, name: "x × x − 2 × x (square it, take away double the number)" }, { f: x => 2 * x * x + 1, name: "square it, double it, then +1" }, { f: x => (x + 1) * (x + 1), name: "add 1, then square it" }], x: [1, 10], max: 300 })], [4, NPK.bothSides({ ...base, a: [4, 9], c: [1, 3], v: [2, 12], b: [1, 9] })]]],
    ["test level — mixed", [[4, either(NSK.alt({ ...base, s: [1, 6], ops: [() => [op("×", 2), op(MINUS, ri(3, 5)), op("×", -1)]] }), NSK.poly({ ...base, fns: [{ f: i => i * i * i - 10, i0: [1, 2], name: "cube numbers, each −10" }, { f: i => -(i * i) + 20, i0: [1, 2], name: "20 minus the square numbers (20 − 1, 20 − 4, 20 − 9 …)" }], n: [5, 5] }))], [4, bend({ ...base, fns: [{ f: x => x * x - 5, name: "square it, then −5 (a negative times itself is positive)" }, { f: x => 3 * x * x, name: "square it, then ×3 (a negative times itself is positive)" }], x: [-5, 5], max: 300 })], [4, either(NPK.bracket({ ...base, forms: ["mulBr", "mulBrPlus"], a: [-6, -2], b: [1, 9], v: [-9, 9] }), NPK.system({ ...base, d: [-9, 14], e: [-8, 9], fin: ["+", "−"] }), NPK.bothSides({ ...base, a: [5, 9], c: [2, 4], v: [-6, 12], b: [1, 9] }))]]]
  ] };
}

// ══════════════════════════════════════════════════════════════════════════
// BUILD
// ══════════════════════════════════════════════════════════════════════════
function hash(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36).padStart(7, "0"); }
const KINDS = { RP: "repeating pattern — what comes next / what is missing", BD: "bead string — next bead or the missing bead", GP: "growing pattern — dots or blocks that grow or shrink",
  MF: "more or fewer — which side has more / fewer / the same", MS: "make them the same — how many more dots on the car with fewer", NE: "about how many — estimate, don't count",
  NS: "number series", NA: "number pairs (analogies)", NP: "number puzzles (equations)" };

function build() {
  const seen = new Set(), out = { ladder: "number-thinking", version: 1, made: "2026-11-23", seed: SEED,
    note: "Nothing here is loaded or live yet. Levels 4th (ellis_quant_bank.json) and 6th (lincoln_quant_bank.json) are the boys' banks and are not repeated here.",
    order: ["prek", "k", "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8"], haveElsewhere: { g4: "ellis_quant_bank.json", g6: "lincoln_quant_bank.json" },
    kinds: KINDS, levels: {} };
  for (const lv of ["prek", "k", "g1", "g2", "g3", "g5", "g7", "g8"]) {
    R = mulberry32(SEED ^ hash(lv).split("").reduce((a, ch) => a * 31 + ch.charCodeAt(0) | 0, 7));
    const spec = L[lv], items = {}; let o = 0, bag = [];
    spec.stages.forEach(([name, slots], si) => {
      const queues = slots.map(([n, f]) => ({ n, f }));
      while (queues.some(q => q.n > 0)) for (const q of queues) {
        if (q.n <= 0) continue;
        if (!bag.length) bag = shuffle(Array.from({ length: spec.choices }, (_, i) => i));
        TARGET = bag.pop();
        let it = null;
        for (let t = 0; t < 2000 && !it; t++) {
          const cand = q.f();
          if (!cand) continue;
          const key = cand.type + "|" + cand.text;
          if (seen.has(key)) continue;
          if (cand.c.length !== spec.choices) throw new Error(`${lv}: ${cand.c.length} choices for ${cand.text}`);
          seen.add(key); it = cand;
        }
        if (!it) throw new Error(`${lv} stage ${si + 1}: could not make a new item`);
        q.n--; o++;
        const id = `nt_${lv}_${hash(it.type + "|" + it.text)}`;
        const rec = { o, type: it.type, st: si + 1, lv, text: it.text, c: it.c, ans: it.ans, rule: it.rule };
        if (it.say) rec.say = it.say;
        if (it.pic) rec.pic = it.pic;
        if (items[id]) throw new Error("id clash " + id);
        items[id] = rec;
      }
    });
    out.levels[lv] = { label: spec.label, choices: spec.choices, stages: spec.stages.map(s => s[0]), items };
  }
  return out;
}

if (require.main === module) {
  const data = build();
  fs.writeFileSync(OUT, JSON.stringify(data, null, 1) + "\n");
  const summary = Object.entries(data.levels).map(([k, v]) => { const t = {}; Object.values(v.items).forEach(x => (t[x.type] = (t[x.type] || 0) + 1)); return `${k}: ${Object.keys(v.items).length} ${JSON.stringify(t)}`; });
  console.log("wrote " + path.relative(process.cwd(), OUT) + "\n" + summary.join("\n"));
}
module.exports = { build };
