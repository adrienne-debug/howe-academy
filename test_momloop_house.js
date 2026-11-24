/*
 * test_momloop_house.js — Household step 7 "Mixed in", slice 1 (PLAN_house_step7_2026-11-19 §3 and §5 row 1): the HOUSEGAP block
 * works out Mom's busy times, her gaps, and where each unanswered house chore WOULD sit. Proven, not drawn: nothing calls it yet.
 * Her answers 2026-11-20: a chore may sit during a "May need Mom" card ("Yes") · "Yes, 5 minutes" free before her next lesson.
 * A MADE-UP family only (Ada, Ben, Cal here; kid_a … kid_d in the whole-app world). No real family's names or data.
 *
 *   1 · source: the block is pure (no database, no page, no timers, no global but toMin) and nothing outside it names it
 *   2 · the rules on a made-up day (the plan's worked example, the cushion, "May need Mom", time of day, ties, the day moving)
 *   3 · the replay: the REAL Mom loop, the clock every 5 min from 8:00 to school end with check-offs played in; the day laid with none
 *       of her chores and with 0 / 1 / 5 / 12 → every card's laid time identical; every placement = an independent minute-by-minute
 *       first-fit; the placement moves when the day moves; her own Now tap still holds her time (as today)
 *   4 · the whole app: Mom's schedule, Mom's Day and Dad's Day byte-identical to this tree minus the block, the same writes; the
 *       slice-2 call shape run on the real lay writes nothing and gives legal times
 *   5 · mutation checks: each planted fault (a placed chore fed into _blkIv, no cushion, "May need Mom" held, …) → a check fails
 *   6 · slice 2 (§5 row 2, "Your schedule shows them"): with "Mixed in" not tapped every screen = this tree minus HOUSEMIX; tapped, each
 *       unanswered chore is drawn at hgapLay's time (= the first fit) with ✓ Done · Now · ⏰ Later · Not now, each tap writes what
 *       today's row writes, the day moving moves chores and never a card, Mom-off / no school → by time of day, the switch's one write
 *       · a chore ticked ✓ but never answered holds no gap · anything inside throws → today's rows
 *   7 · slice 2 mutation checks (the plan's: placed chores fed to the Mom loop → the identical-lay check fails)
 *
 *   run:  node test_momloop_house.js
 */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm"), os = require("os");
const SRC = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra).slice(0, 600) + ")" : "")); }
}
const fnText = (s, name) => { const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name); let d = 0; for (let k = s.indexOf("{", i); k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}" && --d === 0) return s.slice(i, k + 1); } throw new Error("unclosed " + name); };
const cut = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return s.slice(i, s.indexOf("\n", j) + 1); };
const BLOCK = cut(SRC, "// HOUSEGAP_START", "// HOUSEGAP_END");
const MOMLOOP = SRC.slice(SRC.indexOf("// MOMLOOP_START"), SRC.indexOf("// MOMLOOP_END"));
const TOMIN = fnText(SRC, "toMin"), FROMMIN = fnText(SRC, "fromMin");
const NAMES = ["hgapBusy", "hgapGaps", "hgapPlace", "hgapLay", "HGAP_CUSHION"];
const H = (h, m) => h * 60 + (m || 0);
const hm = m => Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0");
const T = m => { let h = Math.floor(m / 60); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + String(m % 60).padStart(2, "0") + " " + ap; };
const J = v => JSON.parse(JSON.stringify(v));

// The block alone, in a bare context: only toMin beside it. Any other global it read would throw here.
function load(block) { const ctx = {}; vm.createContext(ctx); vm.runInContext(TOMIN + "\n" + block + "\nthis.lay=hgapLay; this.gaps=hgapGaps; this.busy=hgapBusy;", ctx); return ctx; }

// An independent first-fit, minute by minute (the oracle): busy as the plan words it, then each chore in score order (ties in room
// order) at the earliest minute its whole length is free, inside the window and its time of day.
function oracle(o) {
  const free = new Array(24 * 60 + 300).fill(false), start = Math.max(o.now || 0, o.start || 0), end = o.end, cu = o.cushion == null ? 5 : o.cushion;
  for (let m = start; m < end; m++) free[m] = true;
  const hold = (a, b) => { for (let m = Math.max(0, a); m < b; m++) free[m] = false; };
  (o.cards || []).forEach(t => { if (!t || !t.time || (o.done && o.done(t))) return; const s = toMinJs(t.time), d = t.dur || 20;
    if (t.mom === "required" && !t.momPartDone && !(o.helper && o.helper(t))) { const w = o.span ? o.span(t, s, d) : [s, s + d]; hold(w[0] - cu, w[1]); }
    else if (o.lead && o.lead(t)) hold(s - cu, s + d); });
  if (o.lunch) hold(o.lunch[0], o.lunch[1]); (o.blocks || []).forEach(w => hold(w[0], w[1]));
  const L = o.lunch || [720, 720];
  const order = (o.chores || []).map((c, i) => ({ c, i, s: Number.isFinite(parseFloat(c.score)) ? parseFloat(c.score) : 1 })).sort((x, y) => (y.s - x.s) || (x.i - y.i));
  return order.map(({ c }) => { const m = parseInt(c.mins, 10);
    if (m > 0 && c.slot !== "night") { const lo = c.slot === "afternoon" ? L[1] : 0, hi = c.slot === "morning" ? L[0] : 1e9;
      for (let s = Math.max(start, lo); s + m <= Math.min(end, hi); s++) { let fit = true; for (let k = s; k < s + m; k++) if (!free[k]) { fit = false; break; } if (fit) { hold(s, s + m); return { id: c.id, at: s, end: s + m, how: "gap" }; } } }
    return { id: c.id, at: end, end: end + (m > 0 ? m : 0), how: "after" }; });
}
function toMinJs(s) { const p = String(s).match(/(\d+):(\d+)\s*(AM|PM)/i); if (!p) return 0; let h = +p[1]; if (/PM/i.test(p[3]) && h !== 12) h += 12; if (/AM/i.test(p[3]) && h === 12) h = 0; return h * 60 + +p[2]; }

// ── 1 · source ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
function sourceChecks() {
  console.log("── 1 · source: one pure block, called from nowhere ──");
  ok("HOUSEGAP_START / _END each appear once", SRC.split("// HOUSEGAP_START").length === 2 && SRC.split("// HOUSEGAP_END").length === 2);
  ok("the block sits after HOUSECARDS_END, outside MOMLOOP", SRC.indexOf("// HOUSEGAP_START") > SRC.indexOf("// HOUSECARDS_END") && (SRC.indexOf("// HOUSEGAP_START") < SRC.indexOf("// MOMLOOP_START") || SRC.indexOf("// HOUSEGAP_START") > SRC.indexOf("// MOMLOOP_END")));
  const rest = SRC.replace(BLOCK, "");
  const MIX1 = cut(SRC, "// HOUSEMIX_START", "// HOUSEMIX_END");   // slice 2: HOUSEMIX calls hgapLay once (this check was "named nowhere" in slice 1)
  NAMES.forEach(n => ok(n + " is named nowhere in index.html outside the block, but for HOUSEMIX's one call of hgapLay (slice 2)", !new RegExp("\\b" + n + "\\b").test(rest.replace(MIX1, "")) && (n === "hgapLay" ? MIX1.split("hgapLay(").length === 2 : !new RegExp("\\b" + n + "\\b").test(MIX1))));
  const others = fs.readdirSync(__dirname).filter(f => /\.(js|html)$/.test(f) && f !== "index.html" && !/^test_/.test(f));
  ok("…nor in any other app file (" + others.length + " files: house.js, notebooks.js, …)", others.every(f => !NAMES.some(n => new RegExp("\\b" + n + "\\b").test(fs.readFileSync(path.join(__dirname, f), "utf8")))), others.filter(f => NAMES.some(n => fs.readFileSync(path.join(__dirname, f), "utf8").includes(n))));
  ok("MOMLOOP, hhHouseBlocksOpen, hhHouseBlockSet, momSchedHouse, momAgendaHtml and mpSchTasks never name it", [MOMLOOP, fnText(SRC, "hhHouseBlocksOpen"), fnText(SRC, "hhHouseBlockSet"), fnText(SRC, "momSchedHouse"), fnText(SRC, "momAgendaHtml"), fnText(SRC, "mpSchTasks")].every(s => !/hgap|HGAP/.test(s)));
  const code = BLOCK.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
  const bad = ["db", "document", "window", "localStorage", "sessionStorage", "HA_LS", "setTimeout", "setInterval", "requestAnimationFrame", "fetch", "momBlocks", "_blkIv", "_mlBlkLaid", "renderAll", "checked", "Date", "typeof", "innerHTML", "getElementById", "mlQueueLay", "_mlQueueLayCore", "hhHouseBlockSet"]
    .filter(w => new RegExp("\\b" + w + "\\b").test(code));
  ok("no database, page, storage, timer, clock or Mom-loop name inside the block's code", bad.length === 0, bad);
  ok("no write call inside it (.set / .update / .remove / .transaction / .push( on a ref)", !/\.(set|update|remove|transaction)\(|ref\(/.test(code));
  ok("no top-level `let` / `var` (it keeps no state between draws)", !/^(let|var)\s/m.test(code));
  let c = null; try { c = load(BLOCK); } catch (e) { }
  ok("it runs in a bare context with only toMin beside it", !!c && typeof c.lay === "function");
}

// ── 2 · the rules on a made-up day ──────────────────────────────────────────────────────────────────────────────────────────
// The plan's worked example (§2), made up: 9:30 Ada's Reading · 10:10 Ben's Math · Cal's Spelling laid 11:05–11:40 · lunch 1–2 ·
// school 9:30–4:15. Returns [name, pass, detail] rows so the mutation checks (§5) can run them against a planted fault.
function rules(block) {
  const R = []; const chk = (n, c, x) => R.push([n, !!c, x]);
  let c; try { c = load(block); } catch (e) { return [["the block loads", false, String(e)]]; }
  const card = (id, who, time, dur, mom, x) => Object.assign({ id, who, time, dur, mom, title: id }, x || {});
  const DAY = [card("ada_read", "ada", "9:30 AM", 40, "required"), card("ben_math", "ben", "10:10 AM", 30, "required"),
    card("cal_spell", "cal", "11:05 AM", 35, "required"), card("ada_hist", "ada", "11:45 AM", 25, "maybe"), card("ben_art", "ben", "2:00 PM", 30, "none")];
  const base = { cards: DAY, now: H(9, 15), start: H(9, 30), end: H(16, 15), lunch: [H(13), H(14)] };
  const CH = [{ id: "fridge", mins: 10, slot: "", score: 1.4 }, { id: "porch", mins: 15, slot: "", score: 1.0 }, { id: "oven", mins: 45, slot: "", score: 2.0, deep: true }];
  const lay = o => J(c.lay(Object.assign({}, base, o)));
  const at = (r, id) => { const p = r.placed.find(x => x.id === id); return p ? (p.how === "after" ? "after " + hm(p.at) : hm(p.at) + "–" + hm(p.end)) : "missing"; };
  const r = lay({ chores: CH });
  chk("busy = her three Mom cards (5-min cushion before each) + lunch; Ada's May-need-Mom History and Ben's own Art are not busy",
    JSON.stringify(r.busy) === JSON.stringify([{ a: H(9, 30), b: H(10, 10), c: 1 }, { a: H(10, 10), b: H(10, 40), c: 1 }, { a: H(11, 5), b: H(11, 40), c: 1 }, { a: H(13), b: H(14), c: 0 }]), r.busy);
  chk("gaps = 10:40–11:00 (ends 5 min before Cal's Spelling), 11:40–1:00 (no cushion before lunch), 2:00–4:15 (none before school end)",
    JSON.stringify(r.gaps) === JSON.stringify([[H(10, 40), H(11)], [H(11, 40), H(13)], [H(14), H(16, 15)]]), r.gaps.map(g => hm(g[0]) + "–" + hm(g[1])));
  chk("most needed first: the oven ✨ (2.0), the fridge (1.4), the porch (1.0)", r.placed.map(p => p.id).join() === "oven,fridge,porch", r.placed.map(p => p.id));
  chk("the oven needs 45 → 11:40–12:25 (the 20-min gap is too short)", at(r, "oven") === "11:40–12:25", at(r, "oven"));
  chk("the fridge → 10:40–10:50", at(r, "fridge") === "10:40–10:50", at(r, "fridge"));
  chk("the porch needs 15, 10:50–11:00 has 10 → never split → 12:25–12:40", at(r, "porch") === "12:25–12:40", at(r, "porch"));
  chk("her answer \"Yes\": the oven sits 11:40–12:25 across Ada's May-need-Mom History (11:45)", at(r, "oven") === "11:40–12:25");
  chk("her answer \"Yes, 5 minutes\": a 20-min chore fits 10:40–11:00 exactly, a 21-min one does not",
    at(lay({ chores: [{ id: "x", mins: 20 }] }), "x") === "10:40–11:00" && at(lay({ chores: [{ id: "x", mins: 21 }] }), "x") === "11:40–12:01");
  chk("…and the cushion is 5 minutes, not more: a 20-min chore with Cal's card at 11:06 still starts 10:40",
    at(lay({ cards: DAY.map(t => t.id === "cal_spell" ? Object.assign({}, t, { time: "11:06 AM" }) : t), chores: [{ id: "x", mins: 21 }] }), "x") === "10:40–11:01");
  chk("a chore may run right up to lunch (80 min → 11:40–1:00) and to school end (135 min → 2:00–4:15)",
    at(lay({ chores: [{ id: "x", mins: 80 }] }), "x") === "11:40–13:00" && at(lay({ chores: [{ id: "x", mins: 135 }] }), "x") === "14:00–16:15");
  chk("too long for any gap (140 min) → after school at 4:15, as today", at(lay({ chores: [{ id: "x", mins: 140 }] }), "x") === "after 16:15");
  { const t = lay({ chores: [{ id: "m", mins: 30, slot: "morning" }, { id: "m90", mins: 90, slot: "morning" }, { id: "a", mins: 10, slot: "afternoon" }, { id: "n", mins: 5, slot: "night" }, { id: "any", mins: 5, slot: "" }] });
    chk("time of day: Morning ends by lunch (30 → 11:40), a Morning chore too long for the morning → after school (not after lunch)", at(t, "m") === "11:40–12:10" && at(t, "m90") === "after 16:15", [at(t, "m"), at(t, "m90")]);
    chk("…Afternoon starts after lunch (10 → 2:00, not 10:40); Night is never in school time; any time → the first gap", at(t, "a") === "14:00–14:10" && at(t, "n") === "after 16:15" && at(t, "any") === "10:40–10:45", [at(t, "a"), at(t, "n"), at(t, "any")]); }
  { const t = lay({ lunch: null, chores: [{ id: "m", mins: 10, slot: "morning" }, { id: "a", mins: 10, slot: "afternoon" }] });
    chk("no lunch today: noon splits Morning from Afternoon", at(t, "m") === "10:40–10:50" && at(t, "a") === "12:00–12:10", [at(t, "m"), at(t, "a")]); }
  { const t = lay({ chores: [{ id: "p", mins: 10 }, { id: "q", mins: 10 }, { id: "s", mins: 10, score: "x" }, { id: "u", mins: 10, score: Infinity }, { id: "v", mins: 10, score: 1 }] });
    chk("ties keep room order; no score (or none readable) counts as 1.0", t.placed.map(p => p.id).join() === "p,q,s,u,v", t.placed.map(p => p.id)); }
  { const t = lay({ chores: [{ id: "z", mins: 0 }, { id: "y", mins: "" }] }); chk("a chore with no minutes is not placed (after school)", t.placed.every(p => p.how === "after")); }
  { const span = (t, s, d) => t.id === "ben_math" ? [s + d - 10, s + d] : [s, s + d];
    const t = lay({ span, chores: [{ id: "x", mins: 5 }] });
    chk("only a card's Mom part holds her (Ben's Math, Mom for the last 10 min) → a gap 10:10–10:25 before it", JSON.stringify(t.gaps[0]) === JSON.stringify([H(10, 10), H(10, 25)]) && at(t, "x") === "10:10–10:15", [t.gaps[0], at(t, "x")]); }
  { const t = lay({ done: x => x.id === "ben_math", chores: [{ id: "x", mins: 30 }] });
    chk("a Mom card already done holds nothing (Ben's Math done → 10:10–11:00 is free)", at(t, "x") === "10:10–10:40", at(t, "x")); }
  { const t = lay({ cards: DAY.concat([card("ada_fam", "ada", "10:45 AM", 10, "none", { famBlock: "x" })]), lead: x => !!x.famBlock, chores: [{ id: "x", mins: 5 }] });
    chk("family time she leads holds her, with the cushion (10:45 → the 10:40 gap is gone)", at(t, "x") === "10:55–11:00", at(t, "x")); }
  { const t = lay({ helper: x => x.id === "ben_math", chores: [{ id: "x", mins: 30 }] });
    chk("a Mom card handed to a helper holds nothing (as the Mom loop treats it)", at(t, "x") === "10:10–10:40", at(t, "x")); }
  { const t = lay({ blocks: [[H(11, 40), H(12, 10)]], chores: [{ id: "x", mins: 45 }, { id: "y", mins: 50 }] });
    chk("her own blocks (laundry, meal prep, a tapped chore) hold her, with no cushion: 11:40–12:10 taken → 12:10–12:55", at(t, "x") === "12:10–12:55" && at(t, "y") === "14:00–14:50", [at(t, "x"), at(t, "y")]); }
  { const t = lay({ now: H(10, 45), chores: CH });
    chk("the window starts now (10:45): the fridge 10:45–10:55", at(t, "fridge") === "10:45–10:55", at(t, "fridge")); }
  { const t = lay({ now: H(16, 20), chores: CH }); chk("after school end everything is after school", t.placed.every(p => p.how === "after" && p.at === H(16, 15))); }
  { // The day moves (the plan's example): Cal finishes his own work early, the Mom loop lays his Spelling at 10:45 → next draw.
    const moved = DAY.map(t => t.id === "cal_spell" ? Object.assign({}, t, { time: "10:45 AM" }) : t);
    const t = lay({ cards: moved, chores: CH });
    chk("the day moves: Cal's Spelling re-laid at 10:45 → the 10:40 gap is gone and the fridge moves after his card (11:20)", at(t, "fridge") === "12:05–12:15" && at(t, "oven") === "11:20–12:05" && at(t, "porch") === "12:15–12:30", t.placed.map(p => p.id + " " + hm(p.at)));
    chk("…Cal's card stays where the Mom loop put it (the block hands back only chore times)", JSON.stringify(Object.keys(t)) === '["busy","gaps","placed"]' && t.placed.every(p => ["fridge", "porch", "oven"].includes(p.id))); }
  { const inp = { cards: J(DAY), chores: J(CH), blocks: [[H(14), H(14, 30)]] }; const before = JSON.stringify(inp);
    const a = lay(inp), b = lay(inp);
    chk("it changes none of its inputs and gives the same answer twice", JSON.stringify(inp) === before && JSON.stringify(a) === JSON.stringify(b)); }
  { const o = Object.assign({}, base, { chores: CH.concat([{ id: "m", mins: 30, slot: "morning", score: 1.2 }, { id: "n", mins: 5, slot: "night" }, { id: "big", mins: 200 }]) });
    chk("the worked example agrees with the independent minute-by-minute first fit", JSON.stringify(J(c.lay(o)).placed) === JSON.stringify(oracle(o))); }
  { const r0 = lay({ chores: [] }), r1 = lay({}); chk("no chores → nothing placed", r0.placed.length === 0 && r1.placed.length === 0); }
  return R;
}

// ── 3 · the replay on the real Mom loop ─────────────────────────────────────────────────────────────────────────────────────
// A made-up Thursday for Ada, Ben and Cal: notebooks, their own work, Mom-required and May-need-Mom cards; lunch 1–2; school
// 10:00–4:15 (the Settings defaults). The clock steps every 5 minutes from 8:00 to 4:15; a card is checked off when the clock
// reaches its laid end (Ben's and Cal's own work 5–10 minutes early), stamped at that step, so the Mom loop re-lays the day.
const KIDS = ["ada", "ben", "cal"];
function dayCards() {
  const c = (who, n, time, dur, mom, title, sk) => ({ id: who + "_" + n, who, day: "thursday", time, dur, mom: mom || "none", title: title || (who + " " + n), subjectKey: sk || n });
  return [c("ada", "nb", "10:00 AM", 15, "none", "Morning Notebook", "morning_nb"), c("ada", "read", "10:15 AM", 30, "required"), c("ada", "typing", "10:45 AM", 20),
    c("ada", "hist", "11:05 AM", 25, "maybe"), c("ada", "math", "11:30 AM", 30, "required"), c("ada", "piano", "2:00 PM", 20), c("ada", "sci", "2:20 PM", 30, "required"),
    c("ben", "nb", "10:00 AM", 15, "none", "Morning Notebook", "morning_nb"), c("ben", "spell", "10:15 AM", 20), c("ben", "math", "10:35 AM", 30, "required"),
    c("ben", "read", "11:05 AM", 30), c("ben", "write", "11:35 AM", 25, "required"), c("ben", "art", "2:00 PM", 30, "maybe"), c("ben", "latin", "2:30 PM", 30, "required"),
    c("cal", "nb", "10:00 AM", 10, "none", "Morning Notebook", "morning_nb"), c("cal", "phon", "10:10 AM", 20, "required"), c("cal", "hand", "10:30 AM", 15),
    c("cal", "app", "10:45 AM", 20), c("cal", "math", "11:05 AM", 25, "required"), c("cal", "letters", "2:00 PM", 15, "maybe"), c("cal", "story", "2:15 PM", 20, "required")];
}
const EARLY = { ben_spell: 10, ben_read: 5, cal_hand: 5, cal_app: 10, ada_typing: 5 };
// Twelve of her chores: mixed minutes, times of day, scores, one grown-up turn (✨ — placed like any chore).
const CHORES = [{ id: "c_fridge", mins: 10, slot: "", score: 1.4 }, { id: "c_oven", mins: 45, slot: "", score: 2.0, deep: true }, { id: "c_porch", mins: 15, slot: "afternoon", score: 1 },
  { id: "c_beds", mins: 5, slot: "morning", score: 1 }, { id: "c_sort", mins: 30, slot: "", score: 1.2 }, { id: "c_lock", mins: 20, slot: "night", score: 1 },
  { id: "c_mail", mins: 25, slot: "", score: 3 }, { id: "c_garage", mins: 60, slot: "", score: 1 }, { id: "c_plants", mins: 10, slot: "morning", score: 1 },
  { id: "c_towels", mins: 15, slot: "afternoon", score: 1.1 }, { id: "c_closet", mins: 90, slot: "", score: 1 }, { id: "c_desk", mins: 40, slot: "", score: 1.6 }];
const HHOPEN = fnText(SRC, "hhHouseKey") + "\n" + fnText(SRC, "hhHouseBlocksOpen");
// A context for one way of laying the day: kind "none" (no house code at all), "chores" (her real hhHouseBlocksOpen, n unanswered
// chores), "tap" (one chore she tapped Now: a real block, as today), "planted" (the mutation: the placed chores fed into _blkIv).
function loopCtx(kind, n, momloop) {
  const ctx = { console, ROSTER: KIDS, db: null, checked: {}, momMoves: {}, getActiveTasks: () => ctx.__tasks || [],
    morningComplete: () => true, bbActive: () => null, momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1), esc: s => String(s == null ? "" : s), mwTodayIso: () => "2026-11-19",
    momBlockOpen: () => [] };   // the app always has it (laundry); the Mom loop reads her house blocks only beside it
  ctx._mlNowOverride = H(8); ctx._mlLunchOverride = [H(13), H(14)];
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx);
  vm.runInContext(TOMIN + "\n" + FROMMIN + "\n" + (momloop || MOMLOOP), ctx);
  vm.runInContext("momLoop={cursor:0,order:" + JSON.stringify(KIDS) + "};", ctx);
  if (kind === "chores") { vm.runInContext(HHOPEN, ctx); ctx.hhHouseToday = () => CHORES.slice(0, n).map(c => ({ r: { id: c.id, mins: c.mins, done: false }, rec: null })); }
  if (kind === "tap") { vm.runInContext(HHOPEN, ctx); ctx.hhHouseToday = () => [{ r: { id: "c_fridge", mins: 30, done: false }, rec: { iso: "2026-11-19", kind: "house", at: "now", startMin: ctx.__tapAt, mins: 30 } }]; }
  return ctx;
}
function layIn(ctx, tasks, now, checked) { ctx._mlNowOverride = now; ctx.checked = checked; ctx.__tasks = tasks; const out = vm.runInContext("mlQueueLay(" + JSON.stringify(tasks) + ")", ctx); return J(out); }
const timesOf = laid => { const o = {}; laid.forEach(t => { o[t.id] = t.time; }); return o; };
function replay(o) {
  o = o || {}; const tasks = dayCards(), checked = {}, out = { steps: 0, cmp: 0, diff: [], oracleBad: [], legalBad: [], moved: 0, placedGap: 0, after: 0, tapDiff: 0, plantDiff: 0, momMoved: 0 };
  const A = loopCtx("none"), B = [0, 1, 5, 12].map(n => ({ n, ctx: loopCtx("chores", n) })), TAP = loopCtx("tap"), P = o.planted ? loopCtx("none", 0, o.planted) : null;
  let prevPl = null, prevMom = null, lastGaps = [];
  for (let now = H(8); now <= H(16, 15); now += 5) {
    out.steps++;
    const a = layIn(A, tasks, now, checked), ta = timesOf(a);
    B.forEach(b => { const tb = timesOf(layIn(b.ctx, tasks, now, checked)); out.cmp++; const d = Object.keys(ta).filter(id => ta[id] !== tb[id]); if (d.length) out.diff.push([hm(now), b.n, d.slice(0, 3)]); });
    // What slice 2 will hand the block: the laid day, what is done, lunch, school start / end, now.
    const inp = { cards: a, chores: CHORES, now, start: H(10), end: H(16, 15), lunch: [H(13), H(14)], done: t => !!checked[t.id] };
    const blk = load(o.block || BLOCK).lay(inp), pl = J(blk).placed;
    if (JSON.stringify(pl) !== JSON.stringify(oracle(inp))) out.oracleBad.push(hm(now));
    pl.forEach(p => { if (p.how === "gap") out.placedGap++; else out.after++; });
    const prevGaps = lastGaps; lastGaps = pl.filter(p => p.how === "gap").map(p => [p.at, p.end]);
    const k = JSON.stringify(pl); if (prevPl !== null && k !== prevPl) out.moved++; prevPl = k;
    const mk = JSON.stringify(a.filter(t => t.mom === "required").map(t => t.time)); if (prevMom !== null && mk !== prevMom) out.momMoved++; prevMom = mk;
    // Her own Now tap (Q2, "as today"): a 30-min block from this moment, in the school day, still makes her lessons step around it.
    if (now >= H(10) && now <= H(15)) { TAP.__tapAt = now; const tt = timesOf(layIn(TAP, tasks, now, checked)); if (Object.keys(ta).some(id => ta[id] !== tt[id])) out.tapDiff++; }
    // The mutation: the chores placed on the LAST draw fed into _blkIv (holding her time like a block). On the same draw they sit
    // in free time by construction; the harm shows when the day moves and a kid's Mom card would come into that gap.
    if (P) { P._hgapPlanted = prevGaps; const tp = timesOf(layIn(P, tasks, now, checked)); if (Object.keys(ta).some(id => ta[id] !== tp[id])) out.plantDiff++; }
    // check-offs at this step (some kids finish their own work early), so the next step re-lays the day
    a.forEach(t => { if (checked[t.id] || /lunch/i.test(t.title)) return; const s = toMinJs(t.time), e = s + (t.dur || 20) - (EARLY[t.id] || 0); if (now >= e && now >= s) checked[t.id] = T(now); });
  }
  return out;
}

// Slice 2's call shape, on the real lay.
const CALL = "(function(){ const dn=mdTodayName(); const cards=mpSchTasks('mom',dn);"
  + " const blocks=momBlockOpen().concat(hhHouseBlocksOpen(),kitPrepBlocksOpen()).filter(function(b){ return _mlBlkLaid[b.key]!=null; }).map(function(b){ return [_mlBlkLaid[b.key],_mlBlkLaid[b.key]+b.mins]; });"
  + " const chores=hhHouseToday().filter(function(x){ return !x.r.done&&!x.rec; }).map(function(x){ return {id:x.r.id,mins:x.r.mins,slot:mcSlotOf(x.r.job),score:1}; });"
  + " const inp={cards:cards,chores:chores,now:_mlNowMin(),start:gateStartMin(dn),end:coSchoolEnd(),lunch:_mlLunchWin(),blocks:blocks};"
  + " const r=hgapLay(Object.assign({done:function(t){ return !!_mlFinished(t.id,t); },lead:function(t){ return famIsMomCard(t); },helper:function(t){ return helperHolds(t); },span:mlMomSpan},inp));"
  + " return JSON.stringify({r:r,inp:inp,done:cards.filter(function(t){ return !!_mlFinished(t.id,t); }).map(function(t){ return t.id; }),lead:cards.filter(function(t){ return famIsMomCard(t); }).map(function(t){ return t.id; })}); })()";
// ── 4 · the whole app, this tree vs. this tree minus the block ──────────────────────────────────────────────────────────────
async function wholeApp() {
  console.log("\n── 4 · the whole app (made-up family kid_a … kid_d): Mom's schedule, Mom's Day, Dad's Day ──");
  const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
  const BASE = path.join(os.tmpdir(), "momloop_house_base_" + process.pid + ".html");
  fs.writeFileSync(BASE, SRC.replace(BLOCK, ""));
  const household = () => { const h = W.household("off"); const K = o => Object.assign({ status: "active", area: "cleaning", verdict: "", note: "", level: 1 }, o);
    h.jobs.m_oven = K({ label: "Clean the oven", who: "mom", slot: "", cad: "daily", minutes: 45, src: { kind: "momChore", id: "oven" }, order: 2 });
    h.jobs.m_porch = K({ label: "Sweep the porch", who: "mom", slot: "afternoon", cad: "daily", minutes: 15, src: { kind: "momChore", id: "porch" }, order: 3 });
    h.jobs.m_beds = K({ label: "Strip the beds", who: "mom", slot: "morning", cad: "daily", minutes: 20, src: { kind: "momChore", id: "beds" }, order: 4 });
    h.jobs.m_lock = K({ label: "Lock up", who: "mom", slot: "night", cad: "daily", minutes: 5, src: { kind: "momChore", id: "lock" }, order: 5 });
    return h; };
  const TIMES = [[9, 30], [10, 30], [11, 40], [13, 10], [15, 0]];
  const SHOW = "(function(){ const dn=mdTodayName(), iso=mwTodayIso(); return JSON.stringify({sched:mpSchAgendaHTML('mom',dn), momDay:momDayStripHTML(iso,dn), dadDay:momDayStripHTML(iso,dn,'dad'), dadSched:dadSchedHTML(dn)}); })()";
  async function run(index, call) {
    const w = await W.world({ household: household(), index }), out = [];
    for (let i = 0; i < TIMES.length; i++) {
      await w.at(2026, 11, 16, TIMES[i][0], TIMES[i][1]);
      const A = w.boot("A" + i, "devA" + i, { mom: true }); await w.flush();
      if (i === 2) { A.run("hhHouseBlockSet('m_fridge','now')"); await w.flush(); }   // her own Now tap at 11:40 (the same in both copies)
      const shown = JSON.parse(A.run(SHOW)); const row = { at: hm(TIMES[i][0] * 60 + TIMES[i][1]), shown };
      if (call) { const m = w.mark(), ls = JSON.stringify(A.ctx.localStorage); row.call = JSON.parse(A.run(CALL)); row.writes = w.since(m).length; row.lsSame = JSON.stringify(A.ctx.localStorage) === ls;
        row.again = JSON.parse(A.run(SHOW)); }
      out.push(row);
    }
    return { out, log: w.db.log.map(e => [e.op, e.path, e.at, e.keys || null]) };
  }
  try {
    const base = await run(BASE, false), mine = await run(path.join(__dirname, "index.html"), true);
    ["sched", "momDay", "dadDay", "dadSched"].forEach(k => {
      const lbl = { sched: "Mom's schedule (Mom mode, today)", momDay: "Mom's Day ▸ 🏡 My day", dadDay: "Dad's Day ▸ 🏡 My day", dadSched: "Dad's Day ▸ 🗓 My schedule today" }[k];
      ok(lbl + ": byte-identical to this tree minus the block at " + TIMES.map(t => hm(t[0] * 60 + t[1])).join(", "), base.out.every((b, i) => b.shown[k] === mine.out[i].shown[k] && b.shown[k].length > 0), base.out.map((b, i) => b.shown[k] === mine.out[i].shown[k]));
    });
    ok("…and the house chores really are on Mom's schedule (unanswered: \"block out time?\")", mine.out[0].shown.sched.includes("Clean the oven") && /block out time\?/.test(mine.out[0].shown.sched));
    ok("every database write is the same, in the same order, in both copies (" + mine.log.length + " writes)", JSON.stringify(base.log) === JSON.stringify(mine.log));
    ok("slice 2's call on the real lay writes nothing to the database and changes no saved copy on the device", mine.out.every(r => r.writes === 0 && r.lsSame), mine.out.map(r => [r.writes, r.lsSame]));
    ok("…and the screen after it is byte-identical to before it", mine.out.every(r => JSON.stringify(r.again) === JSON.stringify(r.shown)));
    let legal = true, anyGap = false; const why = [];
    mine.out.forEach(r => { const c = r.call, inp = Object.assign({}, c.inp, { done: t => c.done.includes(t.id), lead: t => c.lead.includes(t.id) });
      const orc = oracle(inp); if (JSON.stringify(orc) !== JSON.stringify(c.r.placed)) { legal = false; why.push([r.at, c.r.placed, orc]); }
      if (c.r.placed.some(p => p.how === "gap")) anyGap = true; });
    ok("on the real lay at every time, the placement = the independent first fit (Mom-part spans aside: none set here)", legal, why[0]);
    ok("…and some chore really finds a gap (not everything after school)", anyGap);
    const at11 = mine.out[2].call; ok("her Now tap at 11:40 holds her time: it is a busy block and no chore is placed over it", at11.inp.blocks.length === 1 && at11.r.placed.every(p => p.how !== "gap" || p.end <= at11.inp.blocks[0][0] || p.at >= at11.inp.blocks[0][1]) && !at11.r.placed.some(p => p.id === "m_fridge"), at11.inp.blocks);
    const ex = mine.out[1].call; console.log("    (10:30 on the real lay: busy " + ex.r.busy.map(b => hm(b.a) + "–" + hm(b.b) + (b.c ? "*" : "")).join(" ") + " · gaps " + ex.r.gaps.map(g => hm(g[0]) + "–" + hm(g[1])).join(" ") + " · " + ex.r.placed.map(p => p.id + " " + (p.how === "gap" ? hm(p.at) : "after")).join(", ") + ")");
  } finally { try { fs.unlinkSync(BASE); } catch (e) { } }
}

// ── 6 · slice 2: her schedule draws them (HOUSEMIX) — this tree vs. this tree minus HOUSEMIX ───────────────────────────────────
// PLAN_house_step7 §5 row 2. Her answer 2026-11-20: it starts "When I tap Mixed in". The base is this tree with the HOUSEMIX block and
// its two hook lines in momSchedHouse taken out (and house.js without HOUSEMIXSET), never a pinned commit.
const MIX = cut(SRC, "// HOUSEMIX_START", "// HOUSEMIX_END");
const HOOK1 = ", P=(typeof hmixPlaced===\"function\")?hmixPlaced(dayName,dayTasks||[],list):null;   // 🏡 HOUSEMIX\n";
const HOOK2 = "    if(!b&&P&&P[r.id]){ out.push(hmixRow(r,lbl,P[r.id],doneBtn,skipBtn)); return; }   // 🏡 HOUSEMIX: placed in a gap\n";
const minusMix = s => { [MIX, HOOK1, HOOK2].forEach(x => { if (s.split(x).length !== 2) throw new Error("HOUSEMIX piece not found once: " + x.slice(0, 60)); }); return s.replace(MIX, "").replace(HOOK1, ";\n").replace(HOOK2, ""); };
const HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
const MIXSET = cut(HJS, "// HOUSEMIXSET_START", "// HOUSEMIXSET_END");
const LBL = { m_fridge: "Wipe the fridge", m_oven: "Clean the oven", m_porch: "Sweep the porch", m_beds: "Strip the beds", m_lock: "Lock up", m_garage: "Clear out the garage" };
function hh7(mode, fit) { const W = require(path.join(__dirname, "test_fixtures", "house_world.js")), h = W.household(mode);
  const K = o => Object.assign({ status: "active", area: "cleaning", verdict: "", note: "", level: 1 }, o);
  h.jobs.m_oven = K({ label: LBL.m_oven, who: "mom", slot: "", cad: "daily", minutes: 45, src: { kind: "momChore", id: "oven" }, order: 2 });
  h.jobs.m_porch = K({ label: LBL.m_porch, who: "mom", slot: "afternoon", cad: "daily", minutes: 15, src: { kind: "momChore", id: "porch" }, order: 3 });
  h.jobs.m_beds = K({ label: LBL.m_beds, who: "mom", slot: "morning", cad: "daily", minutes: 20, src: { kind: "momChore", id: "beds" }, order: 4 });
  h.jobs.m_lock = K({ label: LBL.m_lock, who: "mom", slot: "night", cad: "daily", minutes: 5, src: { kind: "momChore", id: "lock" }, order: 5 });
  h.jobs.m_garage = K({ label: LBL.m_garage, who: "mom", slot: "", cad: "daily", minutes: 200, src: { kind: "momChore", id: "garage" }, order: 6 });   // fits no gap, ever
  if (fit) h.people.mom.fit = fit; return h; }
const SHOW6 = "(function(){ const dn=mdTodayName(), iso=mwTodayIso(), nx=DAYS_ALL[(DAYS_ALL.indexOf(dn)+1)%7]; return JSON.stringify({sched:mpSchAgendaHTML('mom',dn), other:mpSchAgendaHTML('mom',nx),"
  + " momDay:momDayStripHTML(iso,dn), dadDay:momDayStripHTML(iso,dn,'dad'), dadSched:dadSchedHTML(dn), all:mpSchAgendaHTML('all',dn), kids:ROSTER.map(function(k){ return mpSchAgendaHTML(k,dn); }),"
  + " times:mpSchTasks('all',dn).map(function(t){ return t.id+'@'+t.time; }).sort()}); })()";
const SAME6 = ["other", "momDay", "dadDay", "dadSched", "all", "kids", "times"];
const SAME6_LBL = { other: "her schedule on another day", momDay: "Mom's Day ▸ 🏡 My day", dadDay: "Dad's Day ▸ 🏡 My day", dadSched: "Dad's Day ▸ 🗓 My schedule today", all: "the all-kids schedule", kids: "every kid's own schedule", times: "every card's laid time" };
// The agenda as drawn: each time row's minute and the house boxes in it (a box ends at its first </div>: no div inside one).
function agendaRows(html) { return String(html).split('<div class="mom-agenda-row"><div class="time-pill">').slice(1).map(seg => { const m = seg.match(/^(\d+):(\d+)<span class="ampm">(AM|PM)/);
  return { min: m ? toMinJs(m[1] + ":" + m[2] + " " + m[3]) : null, boxes: seg.split('<div class="ml-laundry"').slice(1).map(b => '<div class="ml-laundry"' + b.slice(0, b.indexOf("</div>") + 6)) }; }); }
function rowOf(html, label) { for (const r of agendaRows(html)) { const b = r.boxes.find(x => x.includes("🏡 <b>" + label + "</b>")); if (b) return { min: r.min, html: b }; } return null; }
const btn = (box, label) => { const m = String(box || "").match(new RegExp('<button onclick="([^"]*)"[^>]*>' + label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "</button>")); return m ? m[1] : null; };
const T12 = m => { let h = Math.floor(m / 60); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + String(m % 60).padStart(2, "0") + " " + ap; };
const DBV = (w, log) => log.map(e => [e.op, e.path, e.keys || null, JSON.stringify(e.op === "remove" ? null : w.get(e.path))]);
const tmpFile = (tag, text) => { const f = path.join(os.tmpdir(), "momloop_house6_" + tag + "_" + process.pid + ".html"); fs.writeFileSync(f, text); TMP6.push(f); return f; };
const TMP6 = [];
const MINE = path.join(__dirname, "index.html");
let BASE6 = null;
// One world: mode, fit; a script of steps [[y,m,d,h,mi, fn(A,w)]]; returns what each step shows (+ the placement inputs on this tree).
async function world6(o) {
  const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
  const w = await W.world({ household: hh7(o.mode || "off", o.fit), index: o.index }), out = [];
  let A = null;
  for (const st of o.steps) {
    await w.at(st[0], st[1], st[2], st[3], st[4]);
    if (!A || o.fresh) { A = w.boot("A" + out.length, "devA" + out.length, { mom: true }); await w.flush(); }
    const mk = w.mark(); let extra = null;
    if (st[5]) { extra = st[5](A, w); await w.flush(); }
    const row = { at: hm(st[3] * 60 + st[4]), shown: JSON.parse(A.run(SHOW6)), extra, writes: DBV(w, w.since(mk)) };
    if (o.call) { const c = JSON.parse(A.run(CALL)); row.call = c; }
    out.push(row);
  }
  return { out, w, A };
}
// The expected placement on the real lay, by the independent first fit.
const expect6 = c => oracle(Object.assign({}, c.inp, { done: t => c.done.includes(t.id), lead: t => c.lead.includes(t.id) }));

async function slice2(o) {
  o = o || {}; const R = [], ck = (n, c, x) => R.push([n, !!c, x]);
  const IDX = o.index || MINE, B6 = BASE6, HJ = o.hjs || HJS;
  const TIMES6 = [[9, 30], [10, 30], [11, 40], [13, 10], [15, 0]];
  const day = (fn5) => TIMES6.map((t, i) => [2026, 11, 16, t[0], t[1], fn5 ? (A, w) => fn5(i, A, w) : null]);
  const only = o.only || "ABCDEFGHIJ";

  // A · switch not tapped (and "School first"): every screen byte-identical to the base, plan off / preview / ON, at five times.
  if (only.includes("A")) for (const [mode, fit] of [["off", null], ["preview", null], ["on", null], ["off", "school"]]) {
    const b = await world6({ mode, fit, index: B6, steps: day() }), m = await world6({ mode, fit, index: IDX, steps: day() });
    const keys = ["sched"].concat(SAME6), bad = [];
    m.out.forEach((r, i) => keys.forEach(k => { if (JSON.stringify(r.shown[k]) !== JSON.stringify(b.out[i].shown[k])) bad.push(r.at + " " + k); }));
    ck("A switch " + (fit ? "\"" + fit + "\" (School first)" : "not tapped") + ", plan " + mode + ": her schedule, another day's, Mom's Day, Dad's Day, every kid's screen and every card's time = the base at " + TIMES6.map(t => hm(t[0] * 60 + t[1])).join(", "), bad.length === 0 && m.out[1].shown.sched.includes("block out time?"), bad.slice(0, 4));
    ck("A …and the same database writes, in the same order (plan " + mode + ")", JSON.stringify(b.w.db.log.map(e => [e.op, e.path])) === JSON.stringify(m.w.db.log.map(e => [e.op, e.path])));
  }

  // B · switch on: each unanswered chore drawn at the time hgapLay gives (= the independent first fit), in time order, with the four
  // answers; no gap → today's row at school end; her Now tap (11:40) and a done chore (13:10) drawn exactly as today.
  if (only.includes("B")) for (const mode of ["off", "preview", "on"]) {
    const act = (i, A) => { if (i === 2) A.run("hhHouseBlockSet('m_fridge','now')"); if (i === 3) return A.run("(function(){ const x=hhHouseToday().filter(function(y){ return y.r.id!=='m_fridge'&&!y.r.done&&!y.rec; })[0]; new Function(x.r.on)(); return x.r.id; })()"); return null; };   // 11:40 her Now tap · 1:10 she ticks one done
    const b = await world6({ mode, fit: "mixed", index: B6, steps: day(act) }), m = await world6({ mode, fit: "mixed", index: IDX, steps: day(act), call: true });
    const same = [], at = [], four = [], order = [], after = [], today = []; let nGap = 0, nAfter = 0;
    m.out.forEach((r, i) => { const br = b.out[i];
      SAME6.forEach(k => { if (JSON.stringify(r.shown[k]) !== JSON.stringify(br.shown[k])) same.push(r.at + " " + k); });
      const mins = agendaRows(r.shown.sched).map(x => x.min); if (mins.some((x, j) => j && x < mins[j - 1])) order.push(r.at);
      const ans = r.call.r.placed, exp = expect6(r.call); if (JSON.stringify(ans) !== JSON.stringify(exp)) at.push([r.at, "≠ first fit"]);
      exp.forEach(p => { const lb = LBL[p.id] || p.id, row = rowOf(r.shown.sched, lb), base = rowOf(br.shown.sched, lb);
        if (p.how === "gap") { nGap++;
          if (!row || row.min !== p.at || !row.html.includes(T12(p.at) + "–" + T12(p.end) + " · in a gap")) at.push([r.at, lb, row && row.min, p.at]);
          if (!row || !/>✓ Done<\/button>/.test(row.html) || btn(row.html, "Now") !== "hhHouseBlockSet('" + p.id + "','now')" || btn(row.html, "⏰ Later") !== "hhHouseBlockSet('" + p.id + "','later')" || btn(row.html, "Not now") !== "hhHouseBlockSet('" + p.id + "','skip')" || /block out time/.test(row.html)) four.push([r.at, lb]); }
        else { nAfter++; if (!row || !base || row.html !== base.html || row.min !== base.min || row.min !== r.call.inp.end) after.push([r.at, lb]); } });
      ["m_fridge", m.out[3].extra].forEach(id => { const answered = r.call.r.placed.every(p => p.id !== id); if (answered && JSON.stringify(rowOf(r.shown.sched, LBL[id])) !== JSON.stringify(rowOf(br.shown.sched, LBL[id]))) today.push([r.at, id]); });
    });
    ck("B plan " + mode + ", switch on: Mom's Day, Dad's Day, every kid's screen, another day's schedule and every card's time = the base, at every time", same.length === 0, same.slice(0, 4));
    ck("B …each unanswered chore at the time hgapLay gives, = the independent first fit, \"<from>–<to> · in a gap\" (" + nGap + " placed)", at.length === 0 && nGap > 0, at.slice(0, 3));
    ck("B …each with ✓ Done · Now · ⏰ Later · Not now (today's handlers), no \"block out time?\"", four.length === 0, four.slice(0, 3));
    ck("B …her schedule in time order", order.length === 0, order);
    ck("B …no gap → today's row, byte for byte, at school end (" + nAfter + " rows)", after.length === 0 && nAfter > 0, after.slice(0, 3));
    ck("B …a chore she tapped Now (11:40) and a done chore (1:10) drawn exactly as today", today.length === 0 && m.out[2].call.r.placed.every(p => p.id !== "m_fridge") && !!m.out[3].extra && m.out[3].call.r.placed.every(p => p.id !== m.out[3].extra) && /✓ 🏡/.test(rowOf(m.out[3].shown.sched, LBL[m.out[3].extra]).html), today);
    ck("B …the same database writes in both copies (drawing writes nothing)", JSON.stringify(b.w.db.log.map(e => [e.op, e.path])) === JSON.stringify(m.w.db.log.map(e => [e.op, e.path])));
    if (mode === "off" && !o.index) SHOT.on = m.out, SHOT.off = b.out;
  }

  // C · each answer on a placed chore writes exactly what today's row writes (same handler, same paths, same values), and nothing else.
  if (only.includes("C")) for (const [lab, base] of [["✓ Done", null], ["Now", "Now"], ["⏰ Later", "Later"], ["Not now", "Not now"]]) {
    let hb = null, hm6 = null;
    const tapB = (A) => { const html = JSON.parse(A.run(SHOW6)).sched; hb = base ? btn(rowOf(html, LBL.m_oven).html, base) : A.run("hhHouseToday().find(function(y){ return y.r.id==='m_oven'; }).r.on"); A.run(hb); return hb; };
    const tapM = (A) => { const html = JSON.parse(A.run(SHOW6)).sched, row = rowOf(html, LBL.m_oven); hm6 = row && row.html.includes("in a gap") ? (lab === "✓ Done" ? (row.html.match(/<button onclick="([^"]*)"[^>]*>✓ Done<\/button>/) || [])[1] : btn(row.html, lab)) : null; if (hm6) A.run(hm6); return hm6; };
    const st = f => [[2026, 11, 16, 10, 0, null], [2026, 11, 16, 10, 30, f], [2026, 11, 16, 11, 0, null]];
    const b = await world6({ mode: "off", fit: "mixed", index: B6, steps: st(tapB) }), m = await world6({ mode: "off", fit: "mixed", index: IDX, steps: st(tapM), call: true });
    const wb = b.out[1].writes, wm = m.out[1].writes;
    ck("C " + lab + " on a placed chore: the same handler as today's row (" + (hm6 || "none") + ")", !!hm6 && hm6 === hb, [hm6, hb]);
    ck("C …writes exactly what it writes today (" + wm.map(x => x[0] + " " + x[1]).join(", ") + ") and nothing else", wm.length > 0 && JSON.stringify(wm) === JSON.stringify(wb), [wm, wb]);
    if (lab === "Now") {
      const before = m.out[0].shown.times, aB = b.out[1].shown.times, aM = m.out[1].shown.times, c = m.out[1].call, blk = c.inp.blocks;
      ck("C after Now: the lay changes as today (every card's time = the base's, and some card moved)", JSON.stringify(aM) === JSON.stringify(aB) && JSON.stringify(aM) !== JSON.stringify(before), [aM.length]);
      const rest = c.r.placed.filter(p => p.how === "gap");
      ck("C …the chore is now hers as a real block, and the other chores re-place around it (= the first fit with that block)", blk.length === 1 && c.r.placed.every(p => p.id !== "m_oven") && JSON.stringify(c.r.placed) === JSON.stringify(expect6(c)) && rest.every(p => p.end <= blk[0][0] || p.at >= blk[0][1]) && rest.length > 0, [blk, rest]);
    }
  }

  // D · the day moves (kids finish early; time passes): the placed chores move, never a card — every card's time identical with the
  // switch on and off at every step.
  if (only.includes("D")) {
    const st = []; for (let t = H(10); t <= H(14, 30); t += 10) st.push([2026, 11, 16, Math.floor(t / 60), t % 60, (A) => A.run("(function(){ const dn=mdTodayName(), now=_mlNowMin(); const c=mpSchTasks('all',dn).filter(function(t){ return t.who==='kid_b'&&!checked[t.id]&&toMin(t.time)<=now; })[0]; if(c) finalizeDone(c.id,nowTs()); return c?c.id:null; })()")]);
    const on = await world6({ mode: "off", fit: "mixed", index: IDX, steps: st, call: true }), off = await world6({ mode: "off", fit: null, index: IDX, steps: st });
    const diff = [], kids = []; let moved = 0, cardMoved = 0, early = 0;
    on.out.forEach((r, i) => { if (JSON.stringify(r.shown.times) !== JSON.stringify(off.out[i].shown.times)) diff.push(r.at);
      SAME6.filter(k => k !== "times").forEach(k => { if (JSON.stringify(r.shown[k]) !== JSON.stringify(off.out[i].shown[k])) kids.push(r.at + " " + k); });
      if (r.extra) early++;
      if (i) { if (JSON.stringify(r.call.r.placed) !== JSON.stringify(on.out[i - 1].call.r.placed)) moved++; if (JSON.stringify(r.shown.times) !== JSON.stringify(on.out[i - 1].shown.times)) cardMoved++; } });
    ck("D the day moving (" + early + " early check-offs, " + on.out.length + " draws 10:00 → 2:30): every card's laid time identical with the switch on and off", diff.length === 0, diff.slice(0, 4));
    ck("D …Dad's Day, every kid's screen identical too", kids.length === 0, kids.slice(0, 4));
    ck("D …and the day really moved (cards re-laid at " + cardMoved + " draws) and the placed chores moved with it (" + moved + " draws)", cardMoved > 0 && moved > 0);
    ck("D …every draw's placement = the first fit on that draw's lay", on.out.every(r => JSON.stringify(r.call.r.placed) === JSON.stringify(expect6(r.call))));
  }

  // E · her Mom-off day; F · no school (Saturday; a holiday): by time of day — Morning 7:00, Afternoon 12:00, Night 5:00 PM; any time
  // → today's row. Kids' screens and Dad's Day unchanged.
  const slotCase = async (tag, steps) => {
    const b = await world6({ mode: "off", fit: "mixed", index: B6, steps }), m = await world6({ mode: "off", fit: "mixed", index: IDX, steps });
    const r = m.out[m.out.length - 1], br = b.out[b.out.length - 1], bad = [];
    [["m_beds", 7 * 60, "☀️ Morning"], ["m_porch", 12 * 60, "🌤 Afternoon"], ["m_lock", 17 * 60, "🌙 Night"]].forEach(([id, at, nm]) => { const row = rowOf(r.shown.sched, LBL[id]);
      if (!row || row.min !== at || !row.html.includes(" · " + nm + "</span>") || btn(row.html, "Now") !== "hhHouseBlockSet('" + id + "','now')" || /in a gap|block out time/.test(row.html)) bad.push(id); });
    ["m_fridge", "m_oven", "m_garage"].forEach(id => { const a = rowOf(r.shown.sched, LBL[id]), c = rowOf(br.shown.sched, LBL[id]); if (!a || JSON.stringify(a) !== JSON.stringify(c)) bad.push(id + " (any time)"); });
    const same = SAME6.filter(k => JSON.stringify(r.shown[k]) !== JSON.stringify(br.shown[k]));
    ck(tag + ": Morning at 7:00, Afternoon at 12:00, Night at 5:00 PM with the four answers; any time → today's row, byte for byte", bad.length === 0, bad);
    ck(tag + ": Mom's Day, Dad's Day, every kid's screen and every card's time = the base", same.length === 0, same);
  };
  if (only.includes("E")) await slotCase("E her Mom-off day (10:30)", [[2026, 11, 16, 10, 30, A => A.run("momLoop.momOff=_mlDayStamp()")]]);
  if (only.includes("F")) { await slotCase("F no school: Saturday (10:00)", [[2026, 11, 21, 10, 0, null]]);
    await slotCase("F no school: a holiday (Tue 10:30)", [[2026, 11, 17, 10, 30, A => A.run("calendarData.holidays=Object.assign({},calendarData.holidays,{h7:{date:'2026-11-17',name:'Day off'}})")]]); }

  // G · not today: her schedule on another day is the base's (in A, B: "another day's"); the 🧽 cleaning-day plan is HH_CLEANPLAN's
  // own branch, which returns before HOUSEMIX (source check).

  // I · a chore ticked ✓ without ever being answered (the hub's review 2026-11-24): it holds no gap — the others are placed exactly as the
  // first fit gives WITHOUT it. Wipe the fridge is first in room order; ticked at 10:30, the oven must take its 1:05 gap.
  if (only.includes("I")) {
    const tick = A => A.run("(function(){ const x=hhHouseToday().find(function(y){ return y.r.id==='m_fridge'; }); new Function(x.r.on)(); return x.r.done; })()");
    const m = await world6({ mode: "off", fit: "mixed", index: IDX, steps: [[2026, 11, 16, 10, 30, tick]], call: true }), r = m.out[0], c = r.call;
    const exp = expect6(c), withDone = oracle(Object.assign({}, c.inp, { done: t => c.done.includes(t.id), lead: t => c.lead.includes(t.id), chores: [{ id: "m_fridge", mins: 10, slot: "", score: 1 }].concat(c.inp.chores) })).filter(p => p.id !== "m_fridge");
    const bad = []; exp.forEach(p => { const row = rowOf(r.shown.sched, LBL[p.id]); if (p.how === "gap" ? (!row || row.min !== p.at || !row.html.includes(T12(p.at) + "–" + T12(p.end) + " · in a gap")) : (!row || /in a gap/.test(row.html))) bad.push([p.id, row && row.min, p.at]); });
    const fr = rowOf(r.shown.sched, LBL.m_fridge);
    ck("I a chore ticked ✓ but never answered: drawn ✓ as today, and it takes no gap", c.inp.chores.every(x => x.id !== "m_fridge") && !!fr && /✓ 🏡/.test(fr.html) && !/in a gap/.test(fr.html), fr && fr.html.slice(0, 120));
    ck("I …the other chores sit exactly where the first fit WITHOUT it puts them (" + exp.filter(p => p.how === "gap").map(p => p.id + " " + hm(p.at)).join(", ") + ")", bad.length === 0 && exp.some(p => p.how === "gap"), bad);
    ck("I …and that differs from a fit that still counted it (the case really tells them apart)", JSON.stringify(exp.filter(p => p.how === "gap")) !== JSON.stringify(withDone.filter(p => p.how === "gap")), withDone);
  }

  // J · anything inside HOUSEMIX throws → today's rows: switch on, hgapLay made to throw on that device → her schedule byte-identical to
  // the switch-off schedule, Mom's Day still draws, nothing written.
  if (only.includes("J")) {
    const W = require(path.join(__dirname, "test_fixtures", "house_world.js")), go = async fit => { const w = await W.world({ household: hh7("off", fit), index: IDX }); await w.at(2026, 11, 16, 10, 30);
      const A = w.boot("J", "devJ", { mom: true }); await w.flush(); if (fit) A.run("hgapLay=function(){ throw new Error('planted'); };"); const mk = w.mark(); let shown = null, err = null;
      try { shown = JSON.parse(A.run(SHOW6)); } catch (e) { err = String(e && e.message || e); } await w.flush(); return { shown, err, writes: w.since(mk).length }; };
    const off = await go(null), on = await go("mixed");
    ck("J switch on but the placement throws: her schedule still draws, byte-identical to the switch-off schedule", !on.err && !!on.shown && on.shown.sched === off.shown.sched && /block out time\?/.test(on.shown.sched), on.err);
    ck("J …Mom's Day, Dad's Day and every kid's screen still draw, = switch off; nothing written", !on.err && !!on.shown && SAME6.every(k => JSON.stringify(on.shown[k]) === JSON.stringify(off.shown[k])) && on.shown.momDay.length > 0 && on.writes === 0, [on.err, on.writes]);
  }

  // H · the switch on 👤 By person: "not on yet" until her tap; her tap = one write; School first = one write and today's schedule back.
  if (only.includes("H")) {
    const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
    const w = await W.world({ household: hh7("off", null), index: IDX }); await w.at(2026, 11, 16, 10, 30);
    const A = w.boot("H", "devH", { mom: true }); await w.flush(); A.run(HJ);
    const person = () => A.run("(function(){ hpSel='mom'; return hpPersonHTML(); })()");
    const s0 = JSON.parse(A.run(SHOW6)).sched, p0 = person();
    ck("H before her tap: 👤 By person (Mom) reads \"Mixed in: not on yet\", neither button picked", p0.includes("Mixed in: not on yet") && p0.includes("hpFitSet('mom','mixed')") && p0.includes("hpFitSet('mom','school')") && !/background:#2B7A78;color:#fff[^>]*>Mixed in</.test(p0) && !/background:#2B7A78;color:#fff[^>]*>School first</.test(p0));
    let m = w.mark(); A.run("hpFitSet('mom','mixed')"); await w.flush(); const w1 = DBV(w, w.since(m));
    ck("H her tap on Mixed in → exactly one write: household/people/mom/fit = \"mixed\"", JSON.stringify(w1) === JSON.stringify([["set", "household/people/mom/fit", null, "\"mixed\""]]), w1);
    const s1 = JSON.parse(A.run(SHOW6)).sched, p1 = person();
    ck("H …By person now says it is on; her schedule now shows her chores in their gaps", !p1.includes("not on yet") && /On: /.test(p1) && /in a gap/.test(s1) && !/in a gap/.test(s0));
    const B = w.boot("H2", "devH2", { mom: true }); await w.flush();
    ck("H …another of her devices draws the same schedule (the setting is the stored one)", JSON.parse(B.run(SHOW6)).sched === s1);
    m = w.mark(); A.run("hpFitSet('mom','school')"); await w.flush(); const w2 = DBV(w, w.since(m));
    ck("H School first (off again) → exactly one write, fit = \"school\"; her schedule is today's again, byte for byte", JSON.stringify(w2) === JSON.stringify([["set", "household/people/mom/fit", null, "\"school\""]]) && JSON.parse(A.run(SHOW6)).sched === s0, w2);
    const K = w.boot("HK", "devHK"); await w.flush(); K.run(HJ); m = w.mark(); K.run("hpFitSet('mom','mixed')"); await w.flush();
    const pk = K.run("(function(){ hpSel='mom'; return hpPersonHTML(); })()");
    ck("H not Mom: no write, and the line shows no buttons", w.since(m).length === 0 && !pk.includes("hpFitSet("));
    const D = w.boot("HD", "devHD", { mom: true }); await w.flush(); D.run(HJ); D.run("HA_LS.setItem('ha_dryrun','1')"); m = w.mark();
    D.run("hpFitSet('mom','mixed')"); await w.flush(); const sd = JSON.parse(D.run(SHOW6)).sched, rd = rowOf(sd, LBL.m_oven);
    if (rd && btn(rd.html, "Now")) D.run(btn(rd.html, "Now")); await w.flush();
    ck("H ?dryrun=1: her tap and a Now on a placed chore write nothing (the screen still draws them)", w.since(m).length === 0 && /in a gap/.test(sd), w.since(m).map(e => e.path));
    if (!o.index && !o.hjs) SHOT.person = { off: p0, on: p1 };
  }
  return R;
}
const SHOT = {};

// ── run ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
(async () => {
  sourceChecks();
  console.log("\n── 2 · the rules on a made-up day (the plan's worked example) ──");
  rules(BLOCK).forEach(r => ok(r[0], r[1], r[2]));

  console.log("\n── 3 · the replay: the real Mom loop, every 5 minutes 8:00 → 4:15, check-offs played in ──");
  const R = replay();
  ok("every card's laid time (every kid, not only Mom cards) is identical with none of her chores and with 0 / 1 / 5 / 12 (" + R.cmp + " lays)", R.diff.length === 0, R.diff.slice(0, 3));
  ok("every placement at every step = the independent minute-by-minute first fit (busy + cushion, window, time of day, no overlap, never split)", R.oracleBad.length === 0, R.oracleBad.slice(0, 5));
  ok("the day really moved (her Mom cards re-laid at " + R.momMoved + " steps) and the placement moved with it (" + R.moved + " steps)", R.momMoved > 0 && R.moved > 0);
  ok("chores were placed in gaps (" + R.placedGap + ") and some fell to after school (" + R.after + ")", R.placedGap > 0 && R.after > 0);
  ok("her own Now tap still holds her time, as today (her answer 2): the lay changed at " + R.tapDiff + " steps", R.tapDiff > 0);

  await wholeApp();

  console.log("\n── 5 · mutation checks: each planted fault → a check above fails ──");
  { const a = "const _blkIv=[], _blkAfter={};", n = MOMLOOP.split(a).length - 1;
    ok("(M1's text occurs once in MOMLOOP)", n === 1, n);
    const M = replay({ planted: MOMLOOP.replace(a, "const _blkIv=(typeof _hgapPlanted!==\"undefined\"?_hgapPlanted.slice():[]), _blkAfter={};") });
    ok("M1 the plan's mutation — the placed chores fed into _blkIv → the laid times differ (" + M.plantDiff + " steps): the replay's identical-lay check fails", M.plantDiff > 0); }
  const MUT = [
    ["M2 no cushion before a lesson", "const HGAP_CUSHION=5;", "const HGAP_CUSHION=0;"],
    ["M3 a \"May need Mom\" card holds her time", "if(t.mom===\"required\"&&!t.momPartDone", "if((t.mom===\"required\"||t.mom===\"maybe\")&&!t.momPartDone"],
    ["M4 room order instead of most needed first", "return (y.s-x.s)||(x.i-y.i);", "return (x.i-y.i);"],
    ["M5 a Morning chore may run past lunch", "hi=(c.slot===\"morning\")?L[0]:1e9", "hi=1e9"],
    ["M6 a Night chore placed in school time", "if(m>0&&c.slot!==\"night\") for", "if(m>0) for"],
    ["M7 a done Mom card still holds her", "if(!t||!t.time||f(\"done\",t)) return;", "if(!t||!t.time) return;"],
    ["M8 the cushion before lunch too", "out.push({a:o.lunch[0],b:o.lunch[1],c:0})", "out.push({a:o.lunch[0],b:o.lunch[1],c:1})"],
    ["M9 the Mom part ignored (the whole card holds her)", "try{ if(o.span) w=o.span(t,s,d)||w; }catch(e){}", ""],
    ["M10 a chore split across gaps (any leftover start)", "if(s+m<=Math.min(G[k][1],hi))", "if(s<Math.min(G[k][1],hi))"],
    ["M11 the window ignores now", "start:Math.max(+o.now||0,+o.start||0)", "start:+o.start||0"],
  ];
  MUT.forEach(([name, a, b]) => { const n = BLOCK.split(a).length - 1; if (n !== 1) { ok("(" + name + ": its text occurs once in the block)", false, n); return; }
    const f = rules(BLOCK.replace(a, b)).filter(r => !r[1]); ok(name + " → " + f.length + " rule check(s) fail", f.length > 0, f.map(r => r[0]).slice(0, 2)); });
  { const R2 = replay({ block: BLOCK.replace("const HGAP_CUSHION=5;", "const HGAP_CUSHION=0;") }); ok("M2 also → the replay's first-fit check fails (" + R2.oracleBad.length + " steps)", R2.oracleBad.length > 0); }

  console.log("\n── 6 · slice 2: her schedule draws them, once she taps Mixed in (this tree vs. this tree minus HOUSEMIX) ──");
  { ok("HOUSEMIX_START / _END each appear once, after HOUSEGAP_END, outside MOMLOOP", SRC.split("// HOUSEMIX_START").length === 2 && SRC.split("// HOUSEMIX_END").length === 2 && SRC.indexOf("// HOUSEMIX_START") > SRC.indexOf("// HOUSEGAP_END") && SRC.indexOf("// HOUSEMIX_START") > SRC.indexOf("// MOMLOOP_END") === SRC.indexOf("// HOUSEMIX_START") > SRC.indexOf("// MOMLOOP_START"));
    const sched = fnText(SRC, "momSchedHouse"), noMix = SRC.replace(MIX, "");
    ok("hmix… is named only in HOUSEMIX and momSchedHouse (its two hook lines), in no other app file", !/hmix/.test(noMix.replace(sched, "")) && sched.split("hmix").length === 4 && fs.readdirSync(__dirname).filter(f => /\.(js|html)$/.test(f) && f !== "index.html" && !/^test_/.test(f)).every(f => !/\bhmix/.test(fs.readFileSync(path.join(__dirname, f), "utf8"))));
    ok("MOMLOOP, hhHouseBlocksOpen, hhHouseBlockSet, mpSchTasks and momAgendaHtml never name it", [MOMLOOP, fnText(SRC, "hhHouseBlocksOpen"), fnText(SRC, "hhHouseBlockSet"), fnText(SRC, "mpSchTasks"), fnText(SRC, "momAgendaHtml")].every(x => !/hmix|HOUSEMIX/.test(x)));
    ok("a 🧽 cleaning day's laid plan returns before HOUSEMIX is asked (her laid cleaning day stays as it is)", sched.indexOf("hhPlanLay(") > 0 && sched.indexOf("hhPlanLay(") < sched.indexOf("hmixPlaced"));
    const code = MIX.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
    const bad = ["db", "localStorage", "sessionStorage", "HA_LS", "setTimeout", "setInterval", "_blkIv", "mlQueueLay", "_mlQueueLayCore", "renderAll", "document"].filter(x => new RegExp("\\b" + x + "\\b").test(code));
    ok("HOUSEMIX writes nothing and keeps nothing: no database, storage, timer or Mom-loop lay; momBlocks / _mlBlkLaid only read; no top-level state", bad.length === 0 && !/\.(set|update|remove|transaction)\(|ref\(/.test(code) && !/momBlocks\s*(\[[^\]]*\])?\s*=[^=]/.test(code) && !/_mlBlkLaid\s*(\[[^\]]*\])?\s*=[^=]/.test(code) && !/^(let|var)\s/m.test(code) && !/[^"]hhHouseBlockSet\(/.test(code), bad);
    ok("house.js HOUSEMIXSET draws only: its tap is hpFitSet (the existing one-path setter), no write of its own", !/\bdb\b|\.(set|update|remove)\(/.test(MIXSET) && MIXSET.includes("hpFitSet('mom','") && /function hpFitSet\(who,fit\)\{[\s\S]{0,400}db\.ref\("household\/people\/"\+who\+"\/fit"\)\.set\(fit\)/.test(HJS));
    ok("the base (this tree minus HOUSEMIX) has no trace of it", !/hmix|HOUSEMIX/.test(minusMix(SRC).replace(/\/\/ HOUSEGAP_START[\s\S]*?\/\/ HOUSEGAP_END/, ""))); }
  BASE6 = tmpFile("base", minusMix(SRC));
  try {
    (await slice2()).forEach(r => ok(r[0], r[1], r[2]));
    if (SHOT.on) { const T6 = ["9:30", "10:30", "11:40", "1:10", "3:00"]; [1, 3].forEach(i => console.log("    (" + T6[i] + " switch on: " + agendaRows(SHOT.on[i].shown.sched).map(r => hm(r.min) + " " + r.boxes.map(b => (b.match(/🏡 <b>([^<]*)<\/b>/) || [])[1]).filter(Boolean).join("+")).filter(x => !/ $/.test(x)).join(" · ") + ")")); }
    try { fs.writeFileSync(path.join(os.tmpdir(), "momloop_house6_shot.json"), JSON.stringify(SHOT)); } catch (e) { }

    console.log("\n── 7 · slice 2 mutation checks: each planted fault → a check in 6 fails ──");
    const MM = [
      ["X1 the plan's mutation — each placed chore handed to the Mom loop (a block in momBlocks)", "D", 'if(p.how==="gap") P[p.id]=p; });', 'if(p.how==="gap"){ P[p.id]=p; momBlocks[hhHouseKey(p.id)]={iso:mwTodayIso(),kind:"house",job:p.id,label:"",mins:p.end-p.at,at:"now",startMin:p.at,ts:0}; } });', /identical with the switch on and off/],
      ["X2 the switch reads the unset default as on (no tap needed)", "A", 'return hhPeopleOf("mom").fit==="mixed";', 'return (hhPeopleOf("mom").fit||"mixed")==="mixed";', /not tapped/],
      ["X3 her Mom-off day ignored", "E", "if(mlMomOff()||hmixNoSchool(", "if(hmixNoSchool(", /Mom-off/],
      ["X4 no school ignored", "F", "if(d===0||d===6||scheduleBreakToday()) return true;", "if(false) return true;", /no school/],
      ["X5 a chore with no gap drawn in the new style, not today's row", "B", 'if(p.how==="gap") P[p.id]=p; });', "P[p.id]=p; });", /no gap/],
      ["X6 Now on a placed chore writes Later", "C", "_kpBtn('Now',\"hhHouseBlockSet('\"+_lbQ(r.id)+\"','now')\",false)", "_kpBtn('Now',\"hhHouseBlockSet('\"+_lbQ(r.id)+\"','later')\",false)", /Now/],
      ["X7 a placed chore drawn at school end instead of its time", "B", "return {m:p.at,o:1,", "return {m:hhHouseDefaultMin(),o:1,", /hgapLay gives|time order/],
    ];
    MM.push(["X9 a done (never answered) chore still handed to hgapLay", "I", "list.filter(function(x){ return !x.r.done&&!x.rec; })", "list.filter(function(x){ return !x.rec; })", /first fit WITHOUT/],
      ["X10 a throw inside is not caught", "J", "}catch(e){ return null; } }", "}catch(e){ throw e; } }", /placement throws/]);   // the hub's review 2026-11-24
    for (const [name, only, a, b, rx] of MM) {
      const n = MIX.split(a).length - 1; if (n !== 1) { ok("(" + name + ": its text occurs once in HOUSEMIX)", false, n); continue; }
      const f = await slice2({ index: tmpFile("mut" + name.slice(0, 2), SRC.replace(MIX, MIX.replace(a, b))), only }).then(R => R.filter(r => !r[1]));
      ok(name + " → " + f.length + " check(s) in " + only + " fail", f.length > 0 && f.some(r => rx.test(r[0])), f.map(r => r[0]).slice(0, 2));
    }
    { const a = 'const f=hhPeopleOf("mom").fit;', n = MIXSET.split(a).length - 1;
      const f = n === 1 ? (await slice2({ hjs: HJS.replace(MIXSET, MIXSET.replace(a, 'const f=hhPeopleOf("mom").fit||"mixed";')), only: "H" })).filter(r => !r[1]) : [];
      ok("X8 👤 By person reads the unset default as Mixed in → the \"not on yet\" check fails", n === 1 && f.some(r => /not on yet/.test(r[0])), f.map(r => r[0])); }
  } finally { TMP6.forEach(f => { try { fs.unlinkSync(f); } catch (e) { } }); }

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
