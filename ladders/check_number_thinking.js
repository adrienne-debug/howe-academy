#!/usr/bin/env node
"use strict";
// NUMBER-THINKING LADDER — independent blind checker.
// Reads ladders/number_thinking.json and re-solves every item from its text (or its picture) ALONE:
// it never reads `ans` or `rule` while solving, and it shares no code with the generator.
// Then it compares: the solved value must be exactly one of the choices, and that choice must be `ans`.
//
// How it solves, kind by kind:
//   RP/BD  fill the gap with each choice; keep the choices that make a pattern whose repeating part shows at least twice
//   GP     fill the gap with each choice; keep the choices that make every step the same
//   MF     count the two sides;  MS  the difference of the two cars
//   NE     the choice nearest the count (or the exact sum), and it must be clearly nearest
//   NS     try every rule family below on the shown numbers; every family that fits (with a spare number to confirm it)
//          must predict the SAME next number, or the item is ambiguous
//            steps repeating in a cycle of 1, 2 or 3 (each a + or a ×) · steps that grow evenly (2nd / 3rd differences)
//            two patterns woven together · each number = the two before added · ×p then +q every time · steps that multiply
//   NA     straight-line rules y = a·x + b (a nice a) and the bends y = p·x² + q·x + r (p 1–3, q −2…2) and y = x³ + r;
//          every rule that fits all the shown pairs must give the same answer
//   NP     parse each line, solve any line with one unknown (then two lines with the same two unknowns), work toward "?"
// Run: node ladders/check_number_thinking.js   → prints agreement per level; exit 1 on any disagreement.

const fs = require("fs"), path = require("path");
const FILE = process.argv[2] || path.join(__dirname, "number_thinking.json");
const EPS = 1e-6;
const eq = (a, b) => Math.abs(a - b) < EPS;
const num = s => { const v = Number(String(s).replace(/−/g, "-")); return v; };
const isWhole = x => Math.abs(x - Math.round(x)) < 1e-9;

// ── pictures ──────────────────────────────────────────────────────────────
function hasRepeat(seq) {
  for (let p = 1; p * 2 <= seq.length; p++) { let ok = true; for (let i = p; i < seq.length && ok; i++) if (seq[i] !== seq[i - p]) ok = false; if (ok) return true; }
  return false;
}
function solvePattern(it) {
  const seq = it.pic.seq, gap = seq.indexOf(null);
  if (gap < 0 || seq.indexOf(null, gap + 1) >= 0) return { err: "pattern needs exactly one gap" };
  const good = it.c.filter(ch => hasRepeat(seq.map(t => (t === null ? ch : t))));
  return good.length === 1 ? { val: good[0] } : { err: `${good.length} choices make a pattern` };
}
function solveGrow(it) {
  const seq = it.pic.seq;
  const good = it.c.filter(ch => { const f = seq.map(t => (t === null ? num(ch) : t)); if (f.length < 3) return false; const d = f[1] - f[0]; return f.every((v, i) => i === 0 || eq(v - f[i - 1], d)) && d !== 0; });
  return good.length === 1 ? { val: good[0] } : { err: `${good.length} choices keep the steps even` };
}
function solveCompare(it) {
  const l = it.pic.left.n, r = it.pic.right.n, ask = it.pic.ask;
  return { val: l === r ? "same" : (ask === "more") === (l > r) ? "left" : "right" };
}
function solveTrains(it) { const [a, b] = it.pic.cars; return { val: String(Math.abs(a - b)) }; }
function solveEstimate(it) {
  if (it.pic && it.pic.kind === "estimate") {
    const n = it.pic.n, d = it.c.map(ch => Math.abs(Math.log(n / num(ch)))), order = d.map((v, i) => i).sort((p, q) => d[p] - d[q]);
    if (!(d[order[0]] <= Math.log(1.2) && d[order[1]] >= Math.log(1.6))) return { err: "no clearly-nearest choice" };
    return { val: it.c[order[0]] };
  }
  const m = it.text.match(/About how much is (\d+) ([+−]) (\d+)\?/);
  if (!m) return { err: "cannot read the estimate" };
  const exact = m[2] === "+" ? +m[1] + +m[3] : +m[1] - +m[3];
  const d = it.c.map(ch => Math.abs(num(ch) - exact)), order = d.map((v, i) => i).sort((p, q) => d[p] - d[q]);
  if (!(d[order[1]] - d[order[0]] >= 10)) return { err: "no clearly-nearest choice" };
  return { val: it.c[order[0]] };
}

// ── number series ─────────────────────────────────────────────────────────
// Each family returns null (does not fit, or not enough numbers to confirm it) or the predicted next number.
function fitStep(pairs) { // pairs of [from, to]; one + or one × for all of them
  const outs = [];
  const d = pairs[0][1] - pairs[0][0];
  if (pairs.every(([a, b]) => eq(b - a, d))) outs.push(x => x + d);
  if (pairs.every(([a]) => !eq(a, 0))) { const r = pairs[0][1] / pairs[0][0]; if (pairs.every(([a, b]) => eq(b / a, r))) outs.push(x => x * r); }
  return outs;
}
const FAMILIES = {
  cycle(t) {
    const preds = [];
    for (const k of [1, 2, 3]) {
      const fns = [];
      let ok = true;
      for (let ph = 0; ph < k && ok; ph++) {
        const pairs = []; for (let i = ph; i + 1 < t.length; i += k) pairs.push([t[i], t[i + 1]]);
        if (pairs.length < 2) { ok = false; break; }
        const f = fitStep(pairs); if (!f.length) ok = false; else fns[ph] = f;
      }
      if (!ok) continue;
      fns[(t.length - 1) % k].forEach(f => preds.push(f(t[t.length - 1])));
    }
    return preds;
  },
  evenGrowth(t) {
    const preds = [];
    for (const deg of [2, 3]) {
      if (t.length < deg + 2) continue;
      const rows = [t.slice()];
      for (let d = 0; d < deg; d++) { const r = rows[rows.length - 1]; rows.push(r.slice(1).map((v, i) => v - r[i])); }
      const last = rows[deg];
      if (!last.every(v => eq(v, last[0]))) continue;
      let add = last[0];
      for (let d = deg - 1; d >= 0; d--) { const r = rows[d]; add = r[r.length - 1] + add; }
      preds.push(add);
    }
    return preds;
  },
  woven(t) {
    const ev = t.filter((_, i) => i % 2 === 0), od = t.filter((_, i) => i % 2 === 1);
    if (ev.length < 3 || od.length < 3) return [];
    const nextOf = s => { const p = []; for (let i = 0; i + 1 < s.length; i++) p.push([s[i], s[i + 1]]); return fitStep(p).map(f => f(s[s.length - 1])); };
    const e = nextOf(ev), o = nextOf(od);
    if (!e.length || !o.length) return [];
    return t.length % 2 === 0 ? e : o;
  },
  sumOfTwo(t) {
    if (t.length < 4) return [];
    for (let i = 2; i < t.length; i++) if (!eq(t[i], t[i - 1] + t[i - 2])) return [];
    return [t[t.length - 1] + t[t.length - 2]];
  },
  timesThenAdd(t) {
    if (t.length < 5 || eq(t[1], t[0])) return [];
    const p = (t[2] - t[1]) / (t[1] - t[0]), q = t[1] - p * t[0];
    for (let i = 1; i < t.length; i++) if (!eq(t[i], p * t[i - 1] + q)) return [];
    return [p * t[t.length - 1] + q];
  },
  stepsMultiply(t) {
    if (t.length < 5) return [];
    const d = t.slice(1).map((v, i) => v - t[i]);
    if (d.some(v => eq(v, 0))) return [];
    const r = d[1] / d[0];
    if (!d.every((v, i) => i === 0 || eq(v / d[i - 1], r))) return [];
    return [t[t.length - 1] + d[d.length - 1] * r];
  }
};
function predictions(t) { const all = []; for (const k in FAMILIES) FAMILIES[k](t).forEach(v => all.push({ fam: k, v })); return all; }
function distinct(vals) { const out = []; vals.forEach(v => { if (!out.some(u => eq(u, v))) out.push(v); }); return out; }
function fitsWhole(t) { // does some family describe ALL of t (the last number is the confirmation)?
  const head = t.slice(0, -1), last = t[t.length - 1];
  return predictions(head).some(p => eq(p.v, last));
}
function solveSeries(it) {
  const toks = it.text.trim().split(/\s+/), gap = toks.indexOf("?");
  if (gap < 0) return { err: "no ?" };
  if (gap === toks.length - 1) {
    const t = toks.slice(0, -1).map(num);
    const vals = distinct(predictions(t).map(p => p.v));
    if (vals.length !== 1) return { err: vals.length ? "ambiguous: " + vals.join(" / ") : "no rule fits" };
    return { num: vals[0] };
  }
  const good = it.c.filter(ch => { const t = toks.map((s, i) => (i === gap ? num(ch) : num(s))); return fitsWhole(t); });
  return good.length === 1 ? { val: good[0] } : { err: `${good.length} choices fill the gap` };
}

// ── number pairs ──────────────────────────────────────────────────────────
function solvePairs(it) {
  const pairs = [...it.text.matchAll(/\[([^\]→]+?)\s*→\s*([^\]]+?)\]/g)].map(m => [m[1].trim(), m[2].trim()]);
  const known = pairs.filter(p => p[1] !== "?").map(p => [num(p[0]), num(p[1])]), q = pairs.filter(p => p[1] === "?");
  if (q.length !== 1 || known.length < 2) return { err: "cannot read the pairs" };
  const x = num(q[0][0]), preds = [];
  // straight line through the first two pairs, confirmed by any others
  const [[x1, y1], [x2, y2]] = known;
  if (!eq(x1, x2)) {
    const a = (y2 - y1) / (x2 - x1), b = y1 - a * x1;
    const nice = !eq(a, 0) && Math.abs(a) <= 12 && isWhole(a * 60) && isWhole(b * 4);
    if (nice && known.every(([u, v]) => eq(a * u + b, v))) preds.push(a * x + b);
  }
  // bends
  for (const p of [1, 2, 3]) for (const qq of [-2, -1, 0, 1, 2]) {
    const r = y1 - (p * x1 * x1 + qq * x1);
    if (known.every(([u, v]) => eq(p * u * u + qq * u + r, v))) preds.push(p * x * x + qq * x + r);
  }
  { const r = y1 - x1 ** 3; if (known.every(([u, v]) => eq(u ** 3 + r, v))) preds.push(x ** 3 + r); }
  const vals = distinct(preds);
  if (vals.length !== 1) return { err: vals.length ? "ambiguous: " + vals.join(" / ") : "no rule fits" };
  return { num: vals[0] };
}

// ── number puzzles ────────────────────────────────────────────────────────
const SUPD = { "⁰": 0, "¹": 1, "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6, "⁷": 7, "⁸": 8, "⁹": 9 };
const SYMS = ["?", "◆", "●"];
function tokenize(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) { let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++; out.push({ t: "n", v: parseFloat(s.slice(i, j)) }); i = j; continue; }
    if (ch in SUPD) { let j = i, e = ""; while (j < s.length && s[j] in SUPD) { e += SUPD[s[j]]; j++; } out.push({ t: "^", v: +e }); i = j; continue; }
    if (SYMS.includes(ch)) { out.push({ t: "s", v: ch }); i++; continue; }
    if ("+−-×÷()√".includes(ch)) { out.push({ t: ch === "-" ? "−" : ch }); i++; continue; }
    throw new Error("cannot read '" + ch + "' in " + s);
  }
  return out;
}
function parse(s) {
  const tk = tokenize(s); let i = 0;
  const peek = () => tk[i], take = () => tk[i++];
  function expr() { let a = term(); while (peek() && (peek().t === "+" || peek().t === "−")) { const o = take().t, b = term(); const A = a; a = o === "+" ? e => A(e) + b(e) : e => A(e) - b(e); } return a; }
  function term() { let a = unary(); while (peek() && (peek().t === "×" || peek().t === "÷")) { const o = take().t, b = unary(); const A = a; a = o === "×" ? e => A(e) * b(e) : e => A(e) / b(e); } return a; }
  function unary() { if (peek() && peek().t === "−") { take(); const a = unary(); return e => -a(e); } return power(); }
  function power() { const a = primary(); if (peek() && peek().t === "^") { const k = take().v; return e => Math.pow(a(e), k); } return a; }
  function primary() {
    const t = take(); if (!t) throw new Error("unexpected end in " + s);
    if (t.t === "n") return () => t.v;
    if (t.t === "s") return e => { if (!(t.v in e)) throw new Error("unknown " + t.v); return e[t.v]; };
    if (t.t === "(") { const a = expr(); if (!peek() || take().t !== ")") throw new Error("missing ) in " + s); return a; }
    if (t.t === "√") { const a = primary(); return e => Math.sqrt(a(e)); }
    throw new Error("unexpected " + t.t + " in " + s);
  }
  const f = expr(); if (i !== tk.length) throw new Error("left over in " + s); return f;
}
function readLine(line) {
  let L = line.replace(/(\d+(?:\.\d+)?)%\s*of\s*/g, "($1 ÷ 100) × ");
  const rat = L.match(/^(.+?):(.+?)=(.+?):(.+)$/);
  if (rat) L = `(${rat[1]}) × (${rat[4]}) = (${rat[2]}) × (${rat[3]})`;
  const sides = L.split("=");
  if (sides.length !== 2) throw new Error("not an equation: " + line);
  const lhs = parse(sides[0]), rhs = parse(sides[1]);
  return { f: e => lhs(e) - rhs(e), syms: SYMS.filter(s => L.includes(s)) };
}
function solveOne(f, env, s) {
  const at = x => f({ ...env, [s]: x });
  const f0 = at(0), f1 = at(1), f2 = at(2);
  if ([f0, f1, f2].every(Number.isFinite) && eq(f2 - f1, f1 - f0) && !eq(f1, f0)) { const x = -f0 / (f1 - f0); return eq(at(x), 0) ? [x] : []; }
  const roots = []; for (let x = -2000; x <= 2000; x += 0.25) { const v = at(x); if (Number.isFinite(v) && Math.abs(v) < 1e-9) roots.push(x); }
  return roots;
}
function solvePuzzle(it) {
  let lines;
  try { lines = it.text.split(" / ").map(readLine); } catch (e) { return { err: e.message }; }
  const env = {};
  for (let round = 0; round < 6 && !("?" in env); round++) {
    let progress = false;
    for (const ln of lines) {
      const open = ln.syms.filter(s => !(s in env));
      if (open.length !== 1) continue;
      const roots = solveOne(ln.f, env, open[0]);
      if (roots.length !== 1) return { err: `${roots.length} values for ${open[0]}` };
      env[open[0]] = roots[0]; progress = true;
    }
    if (progress) continue;
    // two lines with the same two unknowns: solve them together (straight-line equations)
    for (let a = 0; a < lines.length && !progress; a++) for (let b = a + 1; b < lines.length && !progress; b++) {
      const oa = lines[a].syms.filter(s => !(s in env)), ob = lines[b].syms.filter(s => !(s in env));
      if (oa.length !== 2 || ob.length !== 2 || oa.some(s => !ob.includes(s))) continue;
      const [u, v] = oa, g = (ln, x, y) => ln.f({ ...env, [u]: x, [v]: y });
      const co = ln => { const c0 = g(ln, 0, 0); return [g(ln, 1, 0) - c0, g(ln, 0, 1) - c0, -c0]; };
      const [A1, B1, C1] = co(lines[a]), [A2, B2, C2] = co(lines[b]), det = A1 * B2 - A2 * B1;
      if (eq(det, 0)) continue;
      const x = (C1 * B2 - C2 * B1) / det, y = (A1 * C2 - A2 * C1) / det;
      if (!eq(g(lines[a], x, y), 0) || !eq(g(lines[b], x, y), 0)) continue;
      env[u] = x; env[v] = y; progress = true;
    }
    if (!progress) return { err: "stuck" };
  }
  if (!("?" in env)) return { err: "? not reached" };
  // every line must hold with the values found
  if (!lines.every(ln => eq(ln.f(env), 0))) return { err: "values do not satisfy every line" };
  return { num: env["?"] };
}

// ── run ───────────────────────────────────────────────────────────────────
const SOLVERS = { RP: solvePattern, BD: solvePattern, GP: solveGrow, MF: solveCompare, MS: solveTrains, NE: solveEstimate, NS: solveSeries, NA: solvePairs, NP: solvePuzzle };
function check(data) {
  const report = { total: 0, agree: 0, problems: [], perLevel: {} };
  for (const [lv, L] of Object.entries(data.levels)) {
    const pl = report.perLevel[lv] = { total: 0, agree: 0 };
    for (const [id, it] of Object.entries(L.items)) {
      report.total++; pl.total++;
      const blind = { type: it.type, text: it.text, c: it.c, pic: it.pic }; // what the solver may see
      let res;
      try { res = SOLVERS[blind.type] ? SOLVERS[blind.type](blind) : { err: "no solver for " + blind.type }; } catch (e) { res = { err: e.message }; }
      let idx = -1;
      if (!res.err) {
        const hits = res.num != null ? blind.c.map((ch, i) => (eq(num(ch), res.num) ? i : -1)).filter(i => i >= 0) : blind.c.map((ch, i) => (ch === res.val ? i : -1)).filter(i => i >= 0);
        if (hits.length !== 1) res.err = `solved ${res.num != null ? res.num : res.val}, found in ${hits.length} choices`;
        else idx = hits[0];
      }
      const ok = !res.err && "ABCDE"[idx] === it.ans;
      if (ok) { report.agree++; pl.agree++; }
      else report.problems.push(`${lv} ${id} [${it.type}] ${it.text} → ${res.err || "solved " + "ABCDE"[idx] + ", key says " + it.ans}`);
    }
  }
  return report;
}
if (require.main === module) {
  const rep = check(JSON.parse(fs.readFileSync(FILE, "utf8")));
  for (const [lv, p] of Object.entries(rep.perLevel)) console.log(`${lv.padEnd(5)} ${p.agree}/${p.total}`);
  rep.problems.forEach(p => console.log("  ✗ " + p));
  console.log(`blind checker agrees on ${rep.agree}/${rep.total}${rep.agree === rep.total ? " — 100%" : ""}`);
  process.exit(rep.agree === rep.total ? 0 : 1);
}
module.exports = { check };
