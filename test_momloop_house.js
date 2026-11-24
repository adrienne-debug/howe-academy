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
  NAMES.forEach(n => ok(n + " is named nowhere in index.html outside the block (nothing calls it in slice 1)", !new RegExp("\\b" + n + "\\b").test(rest)));
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
  // Slice 2's call shape, on the real lay.
  const CALL = "(function(){ const dn=mdTodayName(); const cards=mpSchTasks('mom',dn);"
    + " const blocks=momBlockOpen().concat(hhHouseBlocksOpen(),kitPrepBlocksOpen()).filter(function(b){ return _mlBlkLaid[b.key]!=null; }).map(function(b){ return [_mlBlkLaid[b.key],_mlBlkLaid[b.key]+b.mins]; });"
    + " const chores=hhHouseToday().filter(function(x){ return !x.r.done&&!x.rec; }).map(function(x){ return {id:x.r.id,mins:x.r.mins,slot:mcSlotOf(x.r.job),score:1}; });"
    + " const inp={cards:cards,chores:chores,now:_mlNowMin(),start:gateStartMin(dn),end:coSchoolEnd(),lunch:_mlLunchWin(),blocks:blocks};"
    + " const r=hgapLay(Object.assign({done:function(t){ return !!_mlFinished(t.id,t); },lead:function(t){ return famIsMomCard(t); },helper:function(t){ return helperHolds(t); },span:mlMomSpan},inp));"
    + " return JSON.stringify({r:r,inp:inp,done:cards.filter(function(t){ return !!_mlFinished(t.id,t); }).map(function(t){ return t.id; }),lead:cards.filter(function(t){ return famIsMomCard(t); }).map(function(t){ return t.id; })}); })()";
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

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
