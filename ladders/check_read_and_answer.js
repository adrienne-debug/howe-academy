#!/usr/bin/env node
/*
 * READ AND ANSWER ladder — shape check + readability report (draft 2026-11-23).
 *
 * The "Read and answer" ladder is unit #1 of the notebooks study (PLAN_notebooks_study_2026-11-23 §25): a short
 * passage with a few questions, seven levels (g1 … g78), 10 passages each. Nothing reads this file yet — it is
 * reviewable content only, not wired into the app.
 *
 *   run:   node ladders/check_read_and_answer.js            (table + flags; exit 1 only on a SHAPE error)
 *          node ladders/check_read_and_answer.js --json     (the numbers as JSON)
 *
 * Shape rules checked (each one is from Mom's brief, 2026-11-23):
 *   - ids unique, "ra_<level>_NN", lv matches the id, o = 1..10 inside each level (easier → harder)
 *   - word count stored = word count counted, and inside the level's range
 *   - 3 questions for g1–g2, 4 from g3; 3 choices g1–g2, 4 for g3–g4, 5 from g5 (matches the boys' banks)
 *   - exactly one answer letter, and it exists; choices unique; no "all/none of the above"
 *   - every question has a one-line "why" for the parent page
 *   - question kinds: find / infer / word / main at every level; purpose and support only from g5, and present there
 *
 * Readability: words, sentences, average sentence length, syllables per word and a Flesch-Kincaid grade estimate.
 * FK is an ESTIMATE (a syllable-counting formula): it runs low on very short texts and on dialogue, and high on
 * nonfiction full of long names. A passage is flagged when its estimate is more than 1.5 grades from its level.
 */
"use strict";
const fs = require("fs"), path = require("path");

const LEVELS = {
  g1:  { grade: 1,   label: "1st grade",     words: [15, 45],   sentences: [3, 5], qs: 3, choices: 3 },
  g2:  { grade: 2,   label: "2nd grade",     words: [40, 70],   qs: 3, choices: 3 },
  g3:  { grade: 3,   label: "3rd grade",     words: [80, 120],  qs: 4, choices: 4 },
  g4:  { grade: 4,   label: "4th grade",     words: [120, 160], qs: 4, choices: 4 },
  g5:  { grade: 5,   label: "5th grade",     words: [150, 200], qs: 4, choices: 5 },
  g6:  { grade: 6,   label: "6th grade",     words: [180, 240], qs: 4, choices: 5 },
  g78: { grade: 7.5, label: "7th–8th grade", words: [220, 300], qs: 4, choices: 5 },
};
const LEVEL_ORDER = Object.keys(LEVELS);
const QTYPES = {
  find:    "What the text says (find it)",
  infer:   "Work it out (inference)",
  word:    "What a word means here",
  main:    "Main idea or best title",
  purpose: "Author's purpose (from g5)",
  support: "What supports this claim (from g5)",
};
const LATE_TYPES = ["purpose", "support"];
const KINDS = ["story", "facts", "howto", "letter", "poem"];
const LETTERS = "ABCDE";
const FLAG_AT = 1.5;

// ── counting ───────────────────────────────────────────────────────────────────────────────────────────────
function wordList(text) {
  return String(text || "").split(/\s+/).filter(t => /[A-Za-z0-9]/.test(t));
}
function countWords(text) { return wordList(text).length; }
function countSentences(text) {
  const t = String(text || "").trim();
  if (!t) return 0;
  const ends = t.match(/[.!?]+["'”’)]*(?=\s|$)/g) || [];
  // text after the last end mark that still holds a word (a letter's sign-off, a poem's last line) is one more
  const tail = t.replace(/^[\s\S]*[.!?]+["'”’)]*(?=\s|$)/, "");
  return ends.length + (/[A-Za-z0-9]/.test(tail) ? 1 : 0);
}
function syllables(word) {
  const raw = String(word).toLowerCase();
  if (/^[0-9,]+$/.test(raw.replace(/[^a-z0-9,]/g, "")) && /[0-9]/.test(raw)) return 2; // a number, read aloud
  let w = raw.replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|(?<![td])ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const m = w.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}
function readability(text) {
  const ws = wordList(text), n = ws.length, s = Math.max(1, countSentences(text));
  const syl = ws.reduce((a, w) => a + syllables(w), 0);
  const asl = n / s, spw = n ? syl / n : 0;
  const fk = 0.39 * asl + 11.8 * spw - 15.59;
  return { words: n, sentences: s, asl: +asl.toFixed(1), spw: +spw.toFixed(2), fk: +fk.toFixed(1) };
}

// ── shape ──────────────────────────────────────────────────────────────────────────────────────────────────
function load(file) {
  return JSON.parse(fs.readFileSync(file || path.join(__dirname, "read_and_answer.json"), "utf8"));
}
function checkShape(data) {
  const errs = [], err = (id, m) => errs.push((id ? id + ": " : "") + m);
  if (!data || typeof data !== "object") return ["file is not an object"];
  const P = data.passages;
  if (!P || typeof P !== "object" || Array.isArray(P)) return ["passages must be an object keyed by id"];
  // the levels block in the file must agree with this checker
  for (const lv of LEVEL_ORDER) {
    const L = (data.levels || {})[lv], W = LEVELS[lv];
    if (!L) { err(null, "levels." + lv + " missing"); continue; }
    if (L.qs !== W.qs || L.choices !== W.choices || String(L.words) !== String(W.words))
      err(null, "levels." + lv + " disagrees with the checker (qs/choices/words)");
  }
  const byLevel = {};
  for (const id of Object.keys(P)) {
    const p = P[id];
    if (p.id !== undefined && p.id !== id) err(id, "id field differs from its key");
    const m = /^ra_(g1|g2|g3|g4|g5|g6|g78)_(\d\d)$/.exec(id);
    if (!m) { err(id, "id must look like ra_g3_07"); continue; }
    const lv = m[1], W = LEVELS[lv];
    if (p.lv !== lv) err(id, "lv '" + p.lv + "' does not match the id");
    (byLevel[lv] = byLevel[lv] || []).push(p);
    if (!p.title || typeof p.title !== "string") err(id, "no title");
    if (!p.topic || typeof p.topic !== "string") err(id, "no topic");
    if (KINDS.indexOf(p.kind) < 0) err(id, "kind '" + p.kind + "' is not one of " + KINDS.join("/"));
    if (!p.text || typeof p.text !== "string") { err(id, "no text"); continue; }
    const n = countWords(p.text);
    if (p.words !== n) err(id, "words says " + p.words + " but the text has " + n);
    if (n < W.words[0] || n > W.words[1]) err(id, n + " words is outside " + W.words.join("–"));
    if (W.sentences) {
      const s = countSentences(p.text);
      if (s < W.sentences[0] || s > W.sentences[1]) err(id, s + " sentences is outside " + W.sentences.join("–"));
    }
    if (p.stretch !== undefined) {
      if (!Array.isArray(p.stretch)) err(id, "stretch must be a list");
      else for (const sw of p.stretch) if (p.text.toLowerCase().indexOf(String(sw).toLowerCase()) < 0)
        err(id, "stretch word '" + sw + "' is not in the text");
    }
    if (!Array.isArray(p.q)) { err(id, "q must be a list"); continue; }
    if (p.q.length !== W.qs) err(id, p.q.length + " questions, level wants " + W.qs);
    p.q.forEach((q, i) => {
      const qi = id + " q" + (i + 1);
      if (!QTYPES[q.type]) err(qi, "type '" + q.type + "' unknown");
      if (LATE_TYPES.indexOf(q.type) >= 0 && LEVEL_ORDER.indexOf(lv) < LEVEL_ORDER.indexOf("g5"))
        err(qi, q.type + " questions start at g5");
      if (!q.text || typeof q.text !== "string") err(qi, "no question text");
      if (!Array.isArray(q.c)) { err(qi, "c must be a list"); return; }
      if (q.c.length !== W.choices) err(qi, q.c.length + " choices, level wants " + W.choices);
      const seen = {};
      q.c.forEach(c => {
        if (!c || typeof c !== "string") err(qi, "empty choice");
        const k = String(c).trim().toLowerCase();
        if (seen[k]) err(qi, "choice repeated: " + c); seen[k] = 1;
        if (/\b(all|none|both) of (the|these) (above|answers)\b|\bboth [a-e] and [a-e]\b/i.test(c))
          err(qi, "no 'all/none of the above' choices");
      });
      if (typeof q.ans !== "string" || !/^[A-E]$/.test(q.ans)) err(qi, "ans must be one letter A–E");
      else if (LETTERS.indexOf(q.ans) >= q.c.length) err(qi, "ans " + q.ans + " has no choice");
      if (!q.why || typeof q.why !== "string") err(qi, "no why line for the parent page");
      else if (/\n/.test(q.why) || q.why.length > 240) err(qi, "why must be one short line");
    });
  }
  for (const lv of LEVEL_ORDER) {
    const list = byLevel[lv] || [];
    if (list.length !== 10) err(lv, list.length + " passages, want 10");
    const os = list.map(p => p.o).sort((a, b) => a - b);
    if (os.join() !== "1,2,3,4,5,6,7,8,9,10") err(lv, "o must be 1..10 once each (got " + os.join() + ")");
    const types = {};
    list.forEach(p => (p.q || []).forEach(q => { types[q.type] = 1; }));
    const want = ["find", "infer", "word", "main"].concat(LEVEL_ORDER.indexOf(lv) >= LEVEL_ORDER.indexOf("g5") ? LATE_TYPES : []);
    for (const t of want) if (!types[t]) err(lv, "no '" + t + "' question at this level");
  }
  return errs;
}

// ── report ─────────────────────────────────────────────────────────────────────────────────────────────────
function rows(data) {
  const out = [];
  for (const lv of LEVEL_ORDER) {
    const list = Object.keys(data.passages).filter(id => data.passages[id].lv === lv)
      .map(id => Object.assign({ id }, data.passages[id])).sort((a, b) => a.o - b.o);
    for (const p of list) {
      const r = readability(p.text), off = r.fk - LEVELS[lv].grade;
      out.push(Object.assign({ id: p.id, lv, o: p.o, kind: p.kind, title: p.title, flag: Math.abs(off) > FLAG_AT ? (off > 0 ? "HIGH" : "LOW") : "" }, r));
    }
  }
  return out;
}
function summary(data) {
  const R = rows(data), s = {};
  for (const lv of LEVEL_ORDER) {
    const L = R.filter(r => r.lv === lv);
    if (!L.length) continue;
    const avg = k => +(L.reduce((a, r) => a + r[k], 0) / L.length).toFixed(1);
    const ans = {};
    Object.keys(data.passages).filter(id => data.passages[id].lv === lv)
      .forEach(id => data.passages[id].q.forEach(q => { ans[q.ans] = (ans[q.ans] || 0) + 1; }));
    s[lv] = { n: L.length, words: avg("words"), asl: avg("asl"), fk: avg("fk"),
      fkMin: Math.min.apply(null, L.map(r => r.fk)), fkMax: Math.max.apply(null, L.map(r => r.fk)),
      flagged: L.filter(r => r.flag).map(r => r.id), answers: ans };
  }
  return s;
}
function pad(s, n) { s = String(s); return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length); }
function printReport(data) {
  const R = rows(data);
  console.log(pad("id", 11) + pad("kind", 7) + pad("title", 34) + pad("words", 6) + pad("sent", 5) + pad("w/s", 6) + pad("syl/w", 6) + pad("FK", 6) + "flag");
  let last = "";
  for (const r of R) {
    if (r.lv !== last) { console.log("── " + r.lv + " (" + LEVELS[r.lv].label + ", target FK " + LEVELS[r.lv].grade + " ± " + FLAG_AT + ")"); last = r.lv; }
    console.log(pad(r.id, 11) + pad(r.kind, 7) + pad(r.title, 34) + pad(r.words, 6) + pad(r.sentences, 5) + pad(r.asl, 6) + pad(r.spw, 6) + pad(r.fk, 6) + r.flag);
  }
  console.log("\nLevel  avg words  avg w/sent  avg FK  FK range      flagged  answer letters");
  const S = summary(data);
  for (const lv of LEVEL_ORDER) if (S[lv]) {
    const x = S[lv];
    console.log(pad(lv, 7) + pad(x.words, 11) + pad(x.asl, 12) + pad(x.fk, 8) + pad(x.fkMin + " – " + x.fkMax, 14) + pad(x.flagged.length, 9) +
      Object.keys(x.answers).sort().map(k => k + x.answers[k]).join(" "));
  }
}

module.exports = { LEVELS, LEVEL_ORDER, QTYPES, KINDS, countWords, countSentences, syllables, readability, load, checkShape, rows, summary };

if (require.main === module) {
  const data = load(process.argv.find(a => /\.json$/.test(a)));
  const errs = checkShape(data);
  if (process.argv.indexOf("--json") >= 0) { console.log(JSON.stringify({ errors: errs, rows: rows(data), summary: summary(data) }, null, 1)); process.exit(errs.length ? 1 : 0); }
  printReport(data);
  if (errs.length) { console.log("\nSHAPE ERRORS (" + errs.length + "):"); errs.forEach(e => console.log("  ✗ " + e)); process.exit(1); }
  const flagged = rows(data).filter(r => r.flag);
  console.log("\nShape: OK (" + Object.keys(data.passages).length + " passages). Readability flags: " + flagged.length +
    (flagged.length ? " — " + flagged.map(r => r.id + " " + r.flag).join(", ") : ""));
}
