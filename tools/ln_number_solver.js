// LN_PLAINQ — a blind solver for the 6th-grade notebook's built-in number questions (iowa_math). It reads ONLY the question
// text and the choices — never the answer key — pulls the numbers out of the words, works the problem, and returns the
// one choice letter whose value matches (or null when it cannot tell, or when two choices match).
// The rules below are by problem family (elapsed time, totals, sharing, fractions, units); the numbers all come from the text.
const W = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
function frac(s) {   // "1 and 2/3", "3/4", "6", "1/4 m" → number
  s = String(s).replace(/,/g, "");
  let m = /^\s*(\d+) and (\d+)\/(\d+)/.exec(s); if (m) return +m[1] + m[2] / m[3];
  m = /^\s*(\d+)\/(\d+)/.exec(s); if (m) return m[1] / m[2];
  m = /(-?\d+(?:\.\d+)?)/.exec(s); return m ? +m[1] : NaN;
}
const fracsIn = (t) => (t.match(/\d+ and \d+\/\d+|\d+\/\d+/g) || []).map(frac);
const nums = (t) => (t.replace(/(\d),(\d{3})/g, "$1$2").match(/\d+(?:\.\d+)?/g) || []).map(Number);
const near = (a, b) => Math.abs(a - b) < 1e-9;

function solve(q) {
  const t = q.text, ch = q.choices || [];
  const pick = (fn) => { const m = ch.filter(fn); return m.length === 1 ? m[0].l : null; };
  const byVal = (v) => pick(c => near(frac(c.t), v));
  let m;
  // elapsed time: two clock times
  const times = [...t.matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/g)].map(x => (+x[1] % 12 + (x[3] === "PM" ? 12 : 0)) * 60 + +x[2]);
  if (times.length === 2 && /how long/i.test(t)) { const d = times[1] - times[0]; return pick(c => { const k = /(\d+) hr (\d+) min/.exec(c.t); return k && +k[1] * 60 + +k[2] === d; }); }
  // N things for $A each and M things for $B each
  if ((m = /(\d+) [\w ]+? for \$(\d+) each and (\d+) [\w ]+? for \$(\d+) each/.exec(t))) return byVal(m[1] * m[2] + m[3] * m[4]);
  // every N days, first on Day a, today Day b, not counting Day a
  if ((m = /every (\d+) days[\s\S]*Day (\d+)[\s\S]*Day (\d+)[\s\S]*not counting/.exec(t))) return byVal(Math.floor((m[3] - m[2]) / m[1]));
  // X per day, D days done, T needed: how many more days
  if ((m = /(\d+) [\w ]+? per day[\s\S]*?(\d+) days[\s\S]*?(\d+) total[\s\S]*how many more days/i.exec(t))) return pick(c => near(frac(c.t), (m[3] - m[1] * m[2]) / m[1]));
  // a length with K pieces of W inches each taken out
  if ((m = /(\d+) inches long\. (\w+) [\w ]+? take up (\d+) inches each/i.exec(t))) return byVal(m[1] - (W[m[2].toLowerCase()] || +m[2]) * m[3]);
  // how many of the lighter make the heavier
  if ((m = /weighs (\d+(?:\.\d+)?) kg\. [\s\S]*?weighs (\d+(?:\.\d+)?) kg\. How many/.exec(t))) return byVal(m[1] / m[2]);
  // N members, half are …, a third of those …
  if ((m = /has (\d+) members\. Half [\s\S]*A third of/.exec(t))) return byVal(m[1] / 2 / 3);
  // a points per one thing and b per another; c and d of them
  if ((m = /(\d+) points per [\s\S]*?(\d+) points per [\s\S]*?got (\d+) [\s\S]*?and (\d+) /.exec(t))) return byVal(m[1] * m[3] + m[2] * m[4]);
  // fractions
  const f = fracsIn(t);
  if (/which fraction is greater/i.test(t) && f.length === 2) { const g = t.match(/\d+\/\d+/g)[f[0] > f[1] ? 0 : 1]; return pick(c => c.t.indexOf(g) === 0); }
  if (f.length === 2 && /something else/i.test(t)) return byVal(1 - f[0] - f[1]);
  if (f.length === 2 && /how much more|left/i.test(t)) return byVal(f[0] - f[1]);
  if (f.length === 2 && /total|what fraction has/i.test(t)) return byVal(f[0] + f[1]);
  // units and measurement
  if ((m = /(\d+) meters[\s\S]*how many centimeters/i.exec(t))) return byVal(m[1] * 100);
  if ((m = /(\d+) gallons\. 1 gallon ≈ (\d+(?:\.\d+)?) liters/.exec(t))) { const v = m[1] * m[2]; const best = ch.map(c => [c.l, Math.abs(frac(c.t) - v)]).sort((a, b) => a[1] - b[1]); return best[0][1] < 1 && best[1][1] > 1 ? best[0][0] : null; }
  if ((m = /(\d[\d,]*) grams[\s\S]*1,000 grams in a kilogram[\s\S]*kilograms/.exec(t))) return byVal(+m[1].replace(/,/g, "") / 1000);
  if ((m = /(\d+) feet long and (\d+) feet wide[\s\S]*area/.exec(t))) return byVal(m[1] * m[2]);
  if ((m = /(\d+) inches long\. [\s\S]*?(\d+) feet long\. How many times/.exec(t))) return byVal(m[2] * 12 / m[1]);
  if ((m = /(\d+) watts for (\d+) hours/.exec(t))) return byVal(m[1] * m[2]);
  if ((m = /(\d+)°F[\s\S]*?(\d+)°F[\s\S]*difference/.exec(t))) return byVal(Math.abs(m[1] - m[2]));
  return null;
}
module.exports = { solve, frac, nums };

if (require.main === module) {
  const inv = require("./ln_theme_inventory.js"), d = inv.data(process.argv[2]);
  d.banks.iowa_math.forEach(q => { const s = solve(q); console.log(q.id + "  solver " + (s || "?") + "  key " + q.ans + (s === q.ans ? "" : "   ✗ DISAGREE") + "   " + q.text); });
}
