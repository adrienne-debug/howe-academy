/*
 * Node tests for s5_block.js (Mastery HQ ▸ Study Sessions + read-only Control Panel).
 *
 * Extracts the block between the // ── S5_START ── / // ── S5_END ── markers out of
 * s5_block.js (or $S5_SRC) and runs it, unmodified, inside a `new Function(...)` whose
 * source is STUBS + BLOCK + a trailing `return {...}` — one shared top-level scope, so
 * the block's own `masteryData`/`masteryKid` reassignment tricks (the
 * `const _mk=masteryKid; masteryKid=kid; ...; masteryKid=_mk;` pattern) behave exactly
 * as they do in index.html, where everything lives in one <script> tag.
 *
 *   run:  node test_s5_panel.js
 */
const fs = require("fs");
const path = require("path");

const srcPath = process.env.S5_SRC || path.join(__dirname, "index.html");
const raw = fs.readFileSync(srcPath, "utf8");
const START = "// ── S5_START ──", END = "// ── S5_END ──";
const si = raw.indexOf(START), ei = raw.indexOf(END);
if (si < 0 || ei < 0) throw new Error("S5 markers not found in " + srcPath);
const BLOCK = raw.slice(si + START.length, ei);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra ? "  (" + extra + ")" : "")); }
}
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// ── shared engine reimplementations (mirrors MST_ENGINE_START semantics) ────────────
const MAST_TIER_ORDER = ["daily", "every_other_day", "every_third_day", "weekly", "bi_weekly", "monthly", "learned", "graduated"];
const LADDER = ["every_other_day", "weekly", "bi_weekly", "monthly", "graduated"];

const STUB_SRC = `
function mhqEsc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
const MST_PATTERN_MODES = ["rec", "say", "type"];
function mstPatternClean(p) { if (!Array.isArray(p)) return null; const out = p.filter(m => MST_PATTERN_MODES.indexOf(m) !== -1); return out.length ? out : null; }
function mstSessions(kid) {
  const raw = masteryData[kid + "_sessions"];
  if (!raw) return [];
  const entries = Array.isArray(raw) ? raw.map((v, i) => [String(i), v]) : Object.keys(raw).map(k => [k, raw[k]]);
  const out = [];
  entries.forEach(function (pair) {
    const sid = pair[0], rec = pair[1];
    if (!rec) return;
    out.push({
      sid: sid, name: rec.name, emoji: rec.emoji, decks: rec.decks || [],
      who: rec.who || "solo", newPerDay: rec.newPerDay != null ? rec.newPerDay : 5,
      passes: rec.passes != null ? rec.passes : 2,
      mixInAt: rec.mixInAt || "weekly", handOffAt: rec.handOffAt || "bi_weekly",
      kind: rec.kind || "deck", audio: rec.audio || "front", order: rec.order || "bank",
      skipDecks: rec.skipDecks || [],
      pattern: mstPatternClean(rec.pattern),
      bothWays: !!rec.bothWays
    });
  });
  // Mirrors the real engine's second pass: a kind:"all" catch-all resolves its decks to
  // every deck in the fixture universe that no kind:"deck" session claims, minus skipDecks.
  const _all = out.filter(function (s) { return s.kind === "all"; });
  if (_all.length) {
    const claimed = {};
    out.forEach(function (s) { if (s.kind === "deck") (s.decks || []).forEach(function (d) { claimed[d] = true; }); });
    const every = FIXTURE_DECKS.map(function (r) { return r.deck; });
    _all.forEach(function (s) {
      const skip = {};
      (s.skipDecks || []).forEach(function (d) { skip[d] = true; });
      s.decks = every.filter(function (d) { return !claimed[d] && !skip[d]; }).sort();
    });
  }
  return out;
}
function mstTierIdx(tier, ladder) {
  ladder = ladder || [];
  const direct = ladder.indexOf(tier);
  if (direct >= 0) return direct;
  const tPos = MAST_TIER_ORDER.indexOf(tier);
  let bestIdx = -1, bestPos = -1;
  ladder.forEach(function (rung, i) {
    const rPos = MAST_TIER_ORDER.indexOf(rung);
    if (rPos <= tPos && rPos > bestPos) { bestPos = rPos; bestIdx = i; }
  });
  return bestIdx >= 0 ? bestIdx : 0;
}
function mstMixSession(kid) {
  const sessions = mstSessions(kid);
  for (let i = 0; i < sessions.length; i++) if (sessions[i].kind === "mix") return sessions[i];
  return null;
}
function mastDrillSettings() {
  const kid = masteryKid;
  const s = masteryData[kid + "_settings"] || {};
  return {
    intro_dots: s.intro_dots != null ? s.intro_dots : 5,
    max_per_cat: s.max_per_cat != null ? s.max_per_cat : 5,
    max_intro_per_cat: s.max_intro_per_cat != null ? s.max_intro_per_cat : 3,
    cat_caps: s.cat_caps || {}, cat_intro_dots: s.cat_intro_dots || {},
    cat_intro_max: s.cat_intro_max || {}, cat_sprint: s.cat_sprint || {},
    sprint_default: s.sprint_default === true,
    ladder: s.ladder || ${JSON.stringify(LADDER)}
  };
}
function mastGetPrintNum() { return 100; }
const FIXTURE_DECKS = ${JSON.stringify([
  { deck: "Math Facts", mode: "flash", learning: 2, active: 5, graduated: 0, parked: 0, dueToday: 1, dueWeek: 3, bank: 10, nextUp: [], forecast: new Array(14).fill(0), byTier: {} },
  { deck: "Vocabulary", mode: "flash", learning: 1, active: 3, graduated: 0, parked: 0, dueToday: 0, dueWeek: 1, bank: 4, nextUp: [], forecast: new Array(14).fill(0), byTier: {} },
  { deck: "Grammar", mode: "flash", learning: 0, active: 2, graduated: 0, parked: 0, dueToday: 0, dueWeek: 0, bank: 2, nextUp: [], forecast: new Array(14).fill(0), byTier: {} }
])};
function mhqDeckStats() { return FIXTURE_DECKS; }
function mhqItems(kid) {
  let items = masteryData[kid + "_items"];
  if (!items) return [];
  if (!Array.isArray(items)) items = Object.values(items);
  return items.filter(Boolean);
}
function mhqBank() { return {}; }
function gwGetSubjects(kid) { return (SUBJECTS && SUBJECTS[kid]) || {}; }
function renderAll() {}
const db = null;
const HA_LS = { setItem: function () {}, getItem: function () { return null; } };
function confirm() { return true; }
function mastIsParked(i) { return !!(i && i.status === "parked"); }
function mastIsNeverDrill(i) { return !!(i && i.neverDrill === true); }
// 3. Does \`session\` own \`item\`? (mirrors the real engine's mstOwns)
function mstOwns(session, item, ladder) {
  if (!session || !item) return false;
  if (session.kind === "mix") return false;
  if (!session.decks || session.decks.indexOf(item.subject) === -1) return false;
  if (mastIsParked(item)) return false;
  if (mastIsNeverDrill(item)) return false;
  if (item.status === "introduction") return true;
  const tier = item.tier || "daily";
  return mstTierIdx(tier, ladder) < mstTierIdx(session.mixInAt, ladder);
}
// 3b. Does the Daily Mix own \`item\`? (mirrors the real engine's mstMixOwns)
function mstMixOwns(sessions, item, ladder) {
  if (!item) return false;
  if (item.status !== "active") return false;
  if (mastIsParked(item)) return false;
  if (mastIsNeverDrill(item)) return false;
  const tier = item.tier || "daily";
  const itemIdx = mstTierIdx(tier, ladder);
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    if (s.kind !== "deck") continue;
    if (!s.decks || s.decks.indexOf(item.subject) === -1) continue;
    const mixInIdx = mstTierIdx(s.mixInAt, ladder);
    const handOffIdx = mstTierIdx(s.handOffAt, ladder);
    if (itemIdx >= mixInIdx && itemIdx < handOffIdx) return true;
  }
  return false;
}
// 4. Set of item ids owned by ANY of the kid's sessions (mirrors the real engine's
// mstOwnedIds). \`__mstOwnedIdsCallN\`/\`__mstOwnedIdsThrowAt\` let a test force a throw on
// a specific call, to verify mhqMigrationPreview restores masteryData on failure.
let __mstOwnedIdsCallN = 0;
let __mstOwnedIdsThrowAt = -1;
function mstOwnedIds(kid) {
  __mstOwnedIdsCallN++;
  if (__mstOwnedIdsCallN === __mstOwnedIdsThrowAt) throw new Error("forced test throw");
  const ids = new Set();
  const sessions = mstSessions(kid);
  if (sessions.length === 0) return ids;
  const items = mhqItems(kid);
  const _mk = masteryKid; masteryKid = kid; const settings = mastDrillSettings(); masteryKid = _mk;
  const ladder = settings.ladder;
  const hasMix = sessions.some(function (s) { return s.kind === "mix"; });
  items.forEach(function (item) {
    let owned = false;
    for (let i = 0; i < sessions.length; i++) {
      if (mstOwns(sessions[i], item, ladder)) { owned = true; break; }
    }
    if (!owned && hasMix && mstMixOwns(sessions, item, ladder)) owned = true;
    if (owned) ids.add(item.id);
  });
  return ids;
}
`;

// Builds a fresh, isolated copy of the S5 module with the given masteryData / kid /
// linked-subjects fixtures baked in as source (so the block's internal `masteryData`
// and `masteryKid` reassignments are real, shared-scope reassignments — not stubbed
// function args).
function buildModule(masteryDataObj, kid, subjectsObj) {
  const header =
    "let masteryData = " + JSON.stringify(masteryDataObj || {}) + ";\n" +
    "let masteryKid = " + JSON.stringify(kid) + ";\n" +
    "let mhqKid = " + JSON.stringify(kid) + ";\n" +
    "const MAST_TIER_ORDER = " + JSON.stringify(MAST_TIER_ORDER) + ";\n" +
    "const SUBJECTS = " + JSON.stringify(subjectsObj || {}) + ";\n" +
    STUB_SRC;
  const footer = "\nreturn { mhqDeckOwner, mhqSessionRows, mhqEffective, mhqSessValidate, mhqSessOpen, mhqSessClose, " +
    "mhqSessSet, mhqPatToggle, mhqPatCycle, mhqPatLen, mhqSessToggleDeck, mhqSessToggleSkip, mhqSessSave, mhqSessDelete, mhqMigrationPreview, mstSessions, " +
    "getMasteryData: function(){ return masteryData; }, " +
    "getForm: function(){ return mhqSessForm; }, getEdit: function(){ return mhqSessEdit; }, getErr: function(){ return mhqSessErr; }, " +
    "setThrowAt: function(n){ __mstOwnedIdsCallN = 0; __mstOwnedIdsThrowAt = n; } };";
  const fn = new Function(header + BLOCK + footer);
  return fn();
}

// ── fixtures shared by the read-only tests (a)-(d) ──────────────────────────────────
const BASE_DATA = {
  lincoln_sessions: {
    mathsess: { name: "Math Session", kind: "deck", decks: ["Math Facts"], newPerDay: 7, passes: 3, mixInAt: "weekly", handOffAt: "bi_weekly", who: "solo", audio: "front", order: "bank" },
    dailymix: { name: "Daily Mix", kind: "mix", who: "solo", audio: "off" }
  },
  lincoln_settings: {
    cat_caps: { "Math Facts": 8 }, max_per_cat: 5, intro_dots: 5, max_intro_per_cat: 3,
    cat_modes: { "Math Facts": "quiz" }, sprint_default: false
  }
};
const BASE_SUBJECTS = { lincoln: { mathSubj: { display: "Math", study: "mathsess" } } };

// (a) mhqDeckOwner
(function () {
  const m = buildModule(BASE_DATA, "lincoln", BASE_SUBJECTS);
  ok("mhqDeckOwner finds the owning deck session", m.mhqDeckOwner("lincoln", "Math Facts") === "mathsess");
  ok("mhqDeckOwner returns null for an unowned deck", m.mhqDeckOwner("lincoln", "Grammar") === null);
})();

// (b) mhqSessionRows
(function () {
  const m = buildModule(BASE_DATA, "lincoln", BASE_SUBJECTS);
  const rows = m.mhqSessionRows("lincoln", 100);
  const mathRow = rows.find(function (r) { return r.sid === "mathsess"; });
  const mixRow = rows.find(function (r) { return r.sid === "dailymix"; });
  ok("mhqSessionRows carries the linked subject key", mathRow && eq(mathRow.linked, ["mathSubj"]), JSON.stringify(mathRow && mathRow.linked));
  ok("mhqSessionRows sums card counts across owned decks", mathRow && eq(mathRow.cards, { learning: 2, active: 5, bank: 10 }), JSON.stringify(mathRow && mathRow.cards));
  ok("mhqSessionRows zeroes card counts for a mix session", mixRow && eq(mixRow.cards, { learning: 0, active: 0, bank: 0 }));
  ok("mhqSessionRows leaves an unlinked session's linked[] empty", mixRow && eq(mixRow.linked, []));
})();

// (c) mhqEffective source resolution
(function () {
  const m = buildModule(BASE_DATA, "lincoln", BASE_SUBJECTS);
  const owned = m.mhqEffective("lincoln", "Math Facts");
  ok("mhqEffective: deck override wins over kid default (cap)", owned.cap.v === 8 && owned.cap.src === "deck", JSON.stringify(owned.cap));
  ok("mhqEffective: deck override wins over kid default (mode)", owned.mode.v === "quiz" && owned.mode.src === "deck", JSON.stringify(owned.mode));
  ok("mhqEffective: session dial tagged session (newPerDay)", owned.newPerDay.v === 7 && owned.newPerDay.src === "session", JSON.stringify(owned.newPerDay));
  ok("mhqEffective: session field itself tagged session", owned.session.v === "mathsess" && owned.session.src === "session");

  const unowned = m.mhqEffective("lincoln", "Vocabulary");
  ok("mhqEffective: unowned deck's session dial tagged kid (null)", unowned.newPerDay.v === null && unowned.newPerDay.src === "kid", JSON.stringify(unowned.newPerDay));
  ok("mhqEffective: unowned deck falls back to kid-level cap", unowned.cap.v === 5 && unowned.cap.src === "kid", JSON.stringify(unowned.cap));
  ok("mhqEffective: unowned deck falls back to kid-level mode", unowned.mode.v === "flash" && unowned.mode.src === "kid");
})();

// (d) mhqSessValidate
(function () {
  const m = buildModule(BASE_DATA, "lincoln", BASE_SUBJECTS);
  const sessions = m.mstSessions("lincoln");

  let v = m.mhqSessValidate({ name: "  ", kind: "deck", decks: ["Vocabulary"], newPerDay: 5, passes: 2, mixInAt: "weekly", handOffAt: "bi_weekly" }, sessions, null, LADDER);
  ok("validate: empty name rejected", v.ok === false, v.error);

  v = m.mhqSessValidate({ name: "Another Mix", kind: "mix" }, sessions, null, LADDER);
  ok("validate: a second Daily Mix rejected", v.ok === false && /one daily mix/i.test(v.error), v.error);

  v = m.mhqSessValidate({ name: "New Deck Session", kind: "deck", decks: ["Math Facts"], newPerDay: 5, passes: 2, mixInAt: "weekly", handOffAt: "bi_weekly" }, sessions, null, LADDER);
  ok("validate: a deck already claimed by another session is rejected", v.ok === false && v.error.indexOf("Math Facts") !== -1 && v.error.indexOf("Math Session") !== -1, v.error);

  v = m.mhqSessValidate({ name: "Bad Order", kind: "deck", decks: ["Grammar"], newPerDay: 5, passes: 2, mixInAt: "bi_weekly", handOffAt: "weekly" }, sessions, null, LADDER);
  ok("validate: hand-off at or below mix-in is rejected", v.ok === false && /hand-off/i.test(v.error), v.error);

  v = m.mhqSessValidate({ name: "Range Test", kind: "deck", decks: ["Grammar"], newPerDay: 100, passes: 2, mixInAt: "weekly", handOffAt: "bi_weekly" }, sessions, null, LADDER);
  ok("validate: newPerDay out of 0-50 range is rejected", v.ok === false && /new\/day/i.test(v.error), v.error);

  v = m.mhqSessValidate({ name: "Range Test 2", kind: "deck", decks: ["Grammar"], newPerDay: 5, passes: 0, mixInAt: "weekly", handOffAt: "bi_weekly" }, sessions, null, LADDER);
  ok("validate: passes out of 1-5 range is rejected", v.ok === false && /passes/i.test(v.error), v.error);

  v = m.mhqSessValidate({ name: "Grammar Session", kind: "deck", decks: ["Grammar"], newPerDay: 5, passes: 2, mixInAt: "weekly", handOffAt: "bi_weekly" }, sessions, null, LADDER);
  ok("validate: a well-formed record passes", v.ok === true, v.error);
})();

// (e2) 🔁 Learning pattern: edit on a copy, save writes it, Off removes it, form renders the slots
(function () {
  const m = buildModule({ lincoln_sessions: { german: { name: "German", kind: "deck", decks: ["German"], newPerDay: 5, passes: 3, mixInAt: "weekly", handOffAt: "bi_weekly", who: "solo", audio: "front", order: "bank" } } }, "lincoln", {});
  m.mhqSessOpen("german");
  m.mhqPatToggle();
  ok("pattern On seeds See, See, Say, Say, Type", JSON.stringify(m.getForm().pattern) === '["rec","rec","say","say","type"]');
  m.mhqPatCycle(1); m.mhqPatLen(1); m.mhqPatLen(-1); m.mhqPatLen(-1);
  ok("tap cycles a slot; −/+ changes length", JSON.stringify(m.getForm().pattern) === '["rec","say","say","say"]', JSON.stringify(m.getForm().pattern));
  ok("nothing stored until Save", !m.getMasteryData().lincoln_sessions.german.pattern);
  m.mhqSessSave();
  ok("Save writes the pattern into the session record", JSON.stringify(m.getMasteryData().lincoln_sessions.german.pattern) === '["rec","say","say","say"]');
  ok("mstSessions reads it back", JSON.stringify(m.mstSessions("lincoln")[0].pattern) === '["rec","say","say","say"]');
  m.mhqSessOpen("german"); m.getForm().pattern.push("type");
  ok("editing again works on a copy (stored record untouched)", m.getMasteryData().lincoln_sessions.german.pattern.length === 4);
  m.mhqPatToggle(); m.mhqSessSave();
  ok("Off + Save removes the pattern", !("pattern" in m.getMasteryData().lincoln_sessions.german));
})();

// (e3) ↔ Both directions: deck sessions save it, Off removes it, the Daily Study catch-all never carries it
(function () {
  const m = buildModule({ lincoln_sessions: { german: { name: "German", kind: "deck", decks: ["German"], newPerDay: 5, passes: 3, mixInAt: "weekly", handOffAt: "bi_weekly", who: "solo", audio: "front", order: "bank" } } }, "lincoln", {});
  m.mhqSessOpen("german");
  ok("bothWays starts off", m.getForm().bothWays === false);
  m.mhqSessSet("bothWays", true); m.mhqSessSave();
  ok("Save writes bothWays:true on a deck session", m.getMasteryData().lincoln_sessions.german.bothWays === true);
  m.mhqSessOpen("german"); ok("reopens as on", m.getForm().bothWays === true);
  m.mhqSessSet("bothWays", false); m.mhqSessSave();
  ok("Off + Save removes it", !("bothWays" in m.getMasteryData().lincoln_sessions.german));
  m.mhqSessOpen("__new_all"); m.mhqSessSet("bothWays", true); m.mhqSessSave();
  const ds = Object.values(m.getMasteryData().lincoln_sessions).find(r => r.kind === "all");
  ok("Daily Study catch-all never saves bothWays", ds && !("bothWays" in ds));
})();

// (e) mhqSessSave — db:null, writes into masteryData, mints distinct sids on name collision
(function () {
  const m = buildModule({}, "lincoln", {});

  m.mhqSessOpen("__new_deck");
  m.mhqSessSet("name", "Math Practice");
  m.mhqSessToggleDeck("Math Facts");
  m.mhqSessSet("newPerDay", 5);
  m.mhqSessSet("passes", 2);
  m.mhqSessSave();

  let data = m.getMasteryData();
  ok("mhqSessSave writes a slugged sid into masteryData[kid_sessions]", !!(data.lincoln_sessions && data.lincoln_sessions.math_practice), JSON.stringify(data.lincoln_sessions));
  ok("mhqSessSave closes the editor on success", m.getEdit() === null && m.getForm() === null);

  m.mhqSessOpen("__new_deck");
  m.mhqSessSet("name", "Math Practice");
  m.mhqSessToggleDeck("Vocabulary");
  m.mhqSessSet("newPerDay", 5);
  m.mhqSessSet("passes", 2);
  m.mhqSessSave();

  data = m.getMasteryData();
  const sids = Object.keys(data.lincoln_sessions || {});
  ok("a second save with the same name gets a distinct, slugged sid", sids.length === 2 && sids.indexOf("math_practice") !== -1 && sids.indexOf("math_practice_2") !== -1, JSON.stringify(sids));
})();

// (f) mhqSessDelete — removes locally (confirm stubbed true)
(function () {
  const seed = {
    lincoln_sessions: {
      s1: { name: "S1", kind: "deck", decks: ["Math Facts"], newPerDay: 5, passes: 2, mixInAt: "weekly", handOffAt: "bi_weekly", who: "solo", audio: "front", order: "bank" }
    }
  };
  const m = buildModule(seed, "lincoln", {});
  m.mhqSessDelete("s1");
  const data = m.getMasteryData();
  ok("mhqSessDelete removes the session from masteryData", !data.lincoln_sessions || !data.lincoln_sessions.s1, JSON.stringify(data.lincoln_sessions));
})();

// ── fixtures for the Daily Study catch-all tests (g)-(k) ────────────────────────────
// One deck session (Math Facts) claiming that deck; Vocabulary + Grammar unclaimed.
// Items: Math Facts has an introduction card + a low-tier active card (both owned by
// mathsess) and a bi_weekly card that's already past mathsess's mix-in (unowned — sits
// in Mom's drill). Vocabulary/Grammar cards are unowned since no session claims them.
const MIG_DATA = {
  lincoln_sessions: {
    mathsess: { name: "Math Session", kind: "deck", decks: ["Math Facts"], newPerDay: 5, passes: 2, mixInAt: "weekly", handOffAt: "bi_weekly", who: "solo", audio: "front", order: "bank" }
  },
  lincoln_items: [
    { id: "m1", subject: "Math Facts", status: "introduction" },
    { id: "m2", subject: "Math Facts", status: "active", tier: "daily" },
    { id: "m3", subject: "Math Facts", status: "active", tier: "bi_weekly" },
    { id: "v1", subject: "Vocabulary", status: "introduction" },
    { id: "v2", subject: "Vocabulary", status: "active", tier: "daily" },
    { id: "g1", subject: "Grammar", status: "active", tier: "weekly" }
  ]
};
// Same shape, but a Daily Study catch-all already exists.
const MIG_DATA_HAS_ALL = {
  lincoln_sessions: {
    mathsess: MIG_DATA.lincoln_sessions.mathsess,
    dailystudy: { name: "Daily Study", kind: "all", skipDecks: [], newPerDay: 5, passes: 2, mixInAt: "weekly", handOffAt: "bi_weekly", who: "solo", audio: "front", order: "bank" }
  },
  lincoln_items: MIG_DATA.lincoln_items
};

// (g) mhqMigrationPreview — no catch-all vs. one already present
(function () {
  const m = buildModule(MIG_DATA, "lincoln", {});
  const preview = m.mhqMigrationPreview("lincoln", 100);
  ok("mhqMigrationPreview: momNow counts cards outside any session", preview.momNow === 4, JSON.stringify(preview));
  ok("mhqMigrationPreview: moved counts cards the catch-all would pick up", preview.moved === 2, JSON.stringify(preview));
  ok("mhqMigrationPreview: momAfter = momNow - moved", preview.momAfter === preview.momNow - preview.moved, JSON.stringify(preview));
  ok("mhqMigrationPreview: learningMoved counts only the moved introduction cards", preview.learningMoved === 1, JSON.stringify(preview));
  ok("mhqMigrationPreview: decks lists the decks the catch-all would claim", eq(preview.decks, ["Grammar", "Vocabulary"]), JSON.stringify(preview.decks));
  ok("mhqMigrationPreview: hasAll is false when no catch-all exists", preview.hasAll === false);

  const m2 = buildModule(MIG_DATA_HAS_ALL, "lincoln", {});
  const preview2 = m2.mhqMigrationPreview("lincoln", 100);
  ok("mhqMigrationPreview: hasAll is true when a catch-all already exists", preview2.hasAll === true, JSON.stringify(preview2));
  ok("mhqMigrationPreview: moved is 0 when a catch-all already exists", preview2.moved === 0 && preview2.momAfter === preview2.momNow, JSON.stringify(preview2));
})();

// (h) mhqMigrationPreview restores masteryData[kid_sessions] exactly, even when
// mstOwnedIds throws mid-computation (forced to throw on its 2nd call — the one made
// against the temporarily-mutated, hypothetical session set).
(function () {
  const m = buildModule(MIG_DATA, "lincoln", {});
  const before = JSON.parse(JSON.stringify(m.getMasteryData().lincoln_sessions));
  m.setThrowAt(2);
  let threw = false;
  try { m.mhqMigrationPreview("lincoln", 100); } catch (e) { threw = true; }
  ok("mhqMigrationPreview propagates a forced mstOwnedIds throw", threw === true);
  const after = m.getMasteryData().lincoln_sessions;
  ok("masteryData[kid_sessions] is restored exactly after the throw", eq(after, before), JSON.stringify(after));
})();

// (i) mhqSessValidate for kind:"all"
(function () {
  const mNoAll = buildModule(MIG_DATA, "lincoln", {});
  const sessionsNoAll = mNoAll.mstSessions("lincoln");
  const allRec = { name: "Daily Study", kind: "all", skipDecks: [], newPerDay: 5, passes: 2, mixInAt: "weekly", handOffAt: "bi_weekly" };
  let v = mNoAll.mhqSessValidate(allRec, sessionsNoAll, null, LADDER);
  ok("validate: a well-formed kind:all record passes", v.ok === true, v.error);
  ok("validate: kind:all does not require decks", !("decks" in allRec) && v.error !== "Pick at least one deck", v.error);

  const mHasAll = buildModule(MIG_DATA_HAS_ALL, "lincoln", {});
  const sessionsHasAll = mHasAll.mstSessions("lincoln");
  v = mHasAll.mhqSessValidate({ name: "Another Daily Study", kind: "all", skipDecks: [], newPerDay: 5, passes: 2, mixInAt: "weekly", handOffAt: "bi_weekly" }, sessionsHasAll, null, LADDER);
  ok("validate: a second Daily Study is rejected", v.ok === false && /only one daily study/i.test(v.error), v.error);

  v = mNoAll.mhqSessValidate({ name: "Bad Order", kind: "all", skipDecks: [], newPerDay: 5, passes: 2, mixInAt: "bi_weekly", handOffAt: "weekly" }, sessionsNoAll, null, LADDER);
  ok("validate: kind:all hand-off at or below mix-in is rejected", v.ok === false && /hand-off/i.test(v.error), v.error);
})();

// (j) mhqSessSave for a catch-all persists skipDecks and omits decks
(function () {
  const m = buildModule({}, "lincoln", {});
  m.mhqSessOpen("__new_all");
  m.mhqSessSet("name", "Daily Study");
  m.mhqSessToggleSkip("Grammar");
  m.mhqSessSet("newPerDay", 5);
  m.mhqSessSet("passes", 2);
  m.mhqSessSave();

  const data = m.getMasteryData();
  const rec = data.lincoln_sessions && data.lincoln_sessions.daily_study;
  ok("mhqSessSave writes a slugged sid for the catch-all", !!rec, JSON.stringify(data.lincoln_sessions));
  ok("mhqSessSave persists skipDecks on a catch-all", rec && eq(rec.skipDecks, ["Grammar"]), JSON.stringify(rec));
  ok("mhqSessSave omits decks on a catch-all (they're derived)", rec && !("decks" in rec), JSON.stringify(rec));
  ok("mhqSessSave closes the editor on success", m.getEdit() === null && m.getForm() === null);
})();

// (k) mhqSessToggleSkip adds then removes a deck from the working form's skipDecks
(function () {
  const m = buildModule({}, "lincoln", {});
  m.mhqSessOpen("__new_all");
  ok("new __new_all form starts with empty skipDecks", eq(m.getForm().skipDecks, []));
  m.mhqSessToggleSkip("Vocabulary");
  ok("mhqSessToggleSkip adds a deck", eq(m.getForm().skipDecks, ["Vocabulary"]), JSON.stringify(m.getForm().skipDecks));
  m.mhqSessToggleSkip("Vocabulary");
  ok("mhqSessToggleSkip removes it again", eq(m.getForm().skipDecks, []), JSON.stringify(m.getForm().skipDecks));
})();

console.log("\n" + pass + " passed, " + fail + " failed");
if (fail > 0) process.exit(1);
