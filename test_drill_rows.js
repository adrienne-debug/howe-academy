/*
 * 🃏 DRILLROWS (her words 2026-11-19: "it should be with the daily subjects in curriculum and it should list like calebs… it
 * needs to be uniform"; slice 1 of DESIGN_drill_rows_curriculum_2026-11-19.md). Look-only card-practice lines in the purple
 * "Runs every day" strip on the child's Curriculum Grid. Against code sliced out of index.html (DRILLROWS, RETRWEEK +
 * RETRFAM, GWRETR, retrSlotMinutes, the strip lines of renderCurrGrid):
 *   1. rows come from the builder's own filter (retrOn → retrDayKinds) over week + week2; fixed order; short day names
 *   2. a no-ladder child with Sprint saved → Sprint greyed ("can't run"), never an ok line
 *   3. minutes / with Mom words are the builder's (retrSlotMinutes, retrSlotMom), titles are the card's (RETR_SLOT_TITLE)
 *   4. empty plan → the dashed "set it up" chip; an old-style drills* subject → no chip
 *   5. the strip draws with zero every-day subjects; both call sites still draw it; the block writes nothing
 *   6. a tap only navigates: Mastery ▸ Settings ▸ 🔁 Retrieval Plan on that child
 *   run:  node test_drill_rows.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function fn(name) { const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("not found " + name); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } throw new Error("unbalanced " + name); }
function slice(a, b) { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error("marker " + a); return src.slice(i, j + b.length); }
const DRILLROWS = slice("// DRILLROWS_START", "// DRILLROWS_END");
const RETRWEEK = slice("// RETRWEEK_START", "// RETRWEEK_END");
const GWRETR = slice("// GWRETR_START", "// GWRETR_END");
const clone = x => JSON.parse(JSON.stringify(x));
const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// kida has a sprint ladder, kidb has none (the RETRFAM rule). No real family ids — the code's built-in defaults stay out.
function world(o) {
  o = o || {};
  const nav = [];
  const env = {
    console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, parseFloat, isNaN, RegExp, Error,
    masteryData: { retrievalPlan: clone(o.plan || {}) },
    currData: { subjects: clone(o.subjects || {}) },
    ROSTER: ["kida", "kidb"], KID_NAME: { kida: "Kid A", kidb: "Kid B" },
    cap: k => ({ kida: "Kid A", kidb: "Kid B" })[k] || k, esc,
    retrTracks: k => (k === "kida" ? [{ key: "t" }] : []),
    retrSettings: () => ({ sprint_seconds: 60, sprint_rounds: 2, review_count: 3, slot_min_drill: 5, slot_min_match: 10 }),
    mastMeasuredDrillMin: k => (o.measured || {})[k] || null,
    mhqKid: "kidb", mhqView: "week", mhqDeck: "Old deck", mhqSessEdit: "x", mhqSessForm: "y", mhqSessErr: "z", mastAdminLocal: { k: 1 },
    mpSchoolOpen: t => nav.push(t), nav,
  };
  vm.createContext(env);
  vm.runInContext(fn("retrSlotMinutes") + "\n" + RETRWEEK + "\n" + GWRETR + "\n" + DRILLROWS
    + "\n;this.__get=()=>({mhqKid,mhqView,mhqDeck,mhqSessEdit,mastAdminLocal});this.RETR_DAYS=RETR_DAYS;this.DR_KINDS=DR_KINDS;this.RETR_SLOT_TITLE=RETR_SLOT_TITLE;", env);
  return env;
}
const lines = rows => rows.map(r => r.title + "|" + r.dayText + "|" + r.ok);

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("1. rows through the builder's filter, both rows of the plan");
{
  const w = world({ plan: { kida: { week: { mon: "drill", tue: "drill", wed: "drill", thu: "drill", fri: "drill" } } } });
  const r = w.drRows("kida");
  ok("drill Mon–Fri → one line", r.length === 1 && r[0].kind === "drill" && r[0].ok, lines(r));
  ok("days written short, in order", r[0].dayText === "Mon Tue Wed Thu Fri", r[0].dayText);
  ok("line reads: icon + name · days · minutes · with Mom →", w.drLineText(r[0], "Kid A") === "\u{1F0CF} Daily Drill · Mon Tue Wed Thu Fri · 5 min · with Mom →", w.drLineText(r[0], "Kid A"));
}
{
  // week: match Mon/Wed, drill Tue · week2: drill Mon/Wed/Fri, match Fri — kinds split across both rows
  const plan = { kidb: { week: { mon: "match", tue: "drill", wed: "match", thu: "off", fri: "off" }, week2: { mon: "drill", wed: "drill", fri: "match" } } };
  const w = world({ plan });
  const r = w.drRows("kidb");
  ok("drill + match on mixed days across week/week2", JSON.stringify(lines(r)) === JSON.stringify([
    "\u{1F0CF} Daily Drill|Mon Tue Wed|true", "\u{1F3AF} Match & Play|Mon Wed Fri|true"]), lines(r));
  // the same answer the builder's own call gives, day by day
  const agree = w.RETR_DAYS.every(d => {
    const b = w.retrOn("kidb") ? w.retrDayKinds("kidb", d) : [];
    return w.DR_KINDS.every(k => (b.indexOf(k) >= 0) === r.some(x => x.ok && x.kind === k && x.days.indexOf(d) >= 0));
  });
  ok("every day: a line is on exactly when retrDayKinds returns that kind", agree);
  ok("match says on their own (retrSlotMom none)", w.drLineText(r[1], "Kid B").indexOf("· 10 min · on their own →") > 0, w.drLineText(r[1], "Kid B"));
}
{
  const plan = { kida: { week: { mon: "recheck", tue: "sprint", wed: "match", thu: "sprint", fri: "recheck" }, week2: { mon: "drill", tue: "drill", wed: "drill", thu: "drill", fri: "drill" } } };
  const w = world({ plan });
  const r = w.drRows("kida");
  ok("order is fixed: Daily Drill, Match & Play, Sprint, Sprint Re-checks", JSON.stringify(r.map(x => x.kind)) === '["drill","match","sprint","recheck"]', r.map(x => x.kind));
  ok("…whatever order the plan stores them in", JSON.stringify(r.map(x => x.dayText)) === JSON.stringify(["Mon Tue Wed Thu Fri", "Wed", "Tue Thu", "Mon Fri"]), r.map(x => x.dayText));
  ok("all four are ok for a laddered child", r.every(x => x.ok));
}

console.log("2. a no-ladder child with Sprint saved");
{
  const plan = { kidb: { week: { mon: "sprint", tue: "drill", wed: "sprint", thu: "off", fri: "off" } } };
  const w = world({ plan });
  ok("(the builder makes no Sprint card for kidb)", w.retrDayKinds("kidb", "mon").length === 0 && w.retrDayKinds("kidb", "tue")[0] === "drill");
  const r = w.drRows("kidb");
  ok("Sprint is listed greyed, never as a running line", r.length === 2 && r[0].kind === "drill" && r[0].ok && r[1].kind === "sprint" && !r[1].ok, lines(r));
  const chips = w.drStripChips("kidb");
  ok("greyed words: can't run for <child> yet", chips.indexOf("\u{1F3C3} Sprint · Mon Wed — can’t run for Kid B yet") >= 0, chips);
  ok("greyed colour", /color:#9ca3af">\u{1F3C3} Sprint/u.test(chips), chips);
  ok("no remove action in this slice", !/remove/i.test(chips), chips);
}
{
  const w = world({ plan: { kidb: { week: { mon: "sprint", tue: "recheck" } } } });
  const r = w.drRows("kidb");
  ok("only un-runnable kinds saved → greyed lines and the set-it-up chip", r.every(x => !x.ok) && r.length === 2 && /dr-empty/.test(w.drStripChips("kidb")), lines(r));
}

{
  // the code's built-in starting days (RETR_WEEK_DEFAULT) are not "saved": a no-ladder child with nothing saved shows no greyed line
  const w = world({});
  vm.runInContext("RETR_WEEK_DEFAULT.kidb={mon:'sprint',tue:'match'};", w);
  ok("(retrWeek sees the built-in days)", w.retrWeek("kidb").mon === "sprint");
  ok("built-in days, nothing saved, no ladder → no greyed lines, just the set-it-up chip", w.drRows("kidb").length === 0 && /dr-empty/.test(w.drStripChips("kidb")), lines(w.drRows("kidb")));
}

console.log("3. the builder's minutes and Mom words");
{
  const plan = { kida: { week: { mon: "drill", tue: "match", wed: "sprint", thu: "recheck", fri: "off" } } };
  const w = world({ plan, measured: { kida: 8 } });
  const r = w.drRows("kida");
  ok("minutes = retrSlotMinutes for every kind", r.every(x => x.min === w.retrSlotMinutes("kida", x.kind)), r.map(x => [x.kind, x.min]));
  ok("measured drill minutes come through (8)", r[0].min === 8, r[0].min);
  ok("sprint 2 min, re-checks 3 min, match 10", r[1].min === 10 && r[2].min === 2 && r[3].min === 3, r.map(x => x.min));
  ok("with Mom / on their own = retrSlotMom", r.every(x => x.mom === (w.retrSlotMom(x.kind) === "none" ? "on their own" : "with Mom")), r.map(x => x.mom));
  ok("titles = RETR_SLOT_TITLE (the card's own words)", r.every(x => x.title === w.RETR_SLOT_TITLE[x.kind]));
}

console.log("4. empty state");
{
  const w = world({});
  const chips = w.drStripChips("kidb");
  ok("empty plan → the dashed chip", chips.indexOf("＋ \u{1F0CF} Flash-card practice isn’t on Kid B’s week yet — set it up") >= 0 && /dashed/.test(chips), chips);
  ok("…and nothing else", (chips.match(/<button/g) || []).length === 1);
  const off = world({ plan: { kidb: { week: { mon: "off", tue: "off", wed: "off", thu: "off", fri: "off" } } } });
  ok("a plan with every day off → the chip too", /dr-empty/.test(off.drStripChips("kidb")));
}
{
  const w = world({ subjects: { kidb: { drills: { display: "Drills", tracking: "daily" } } } });
  ok("old-style drills subject → no empty chip", w.drStripChips("kidb") === "", w.drStripChips("kidb"));
  const w2 = world({ subjects: { kidb: { drills_l: { display: "Drills" } } } });
  ok("drills_* key counts too", w2.drStripChips("kidb") === "");
  const w3 = world({ subjects: { kidb: { drillsheet: { display: "x" } } } });
  ok("drillsheet is not a drills subject (same test as taskDeepLinkView)", /dr-empty/.test(w3.drStripChips("kidb")));
}
{
  const w = world({ plan: { kida: { week: { mon: "drill" } } } });
  ok("a child with a running line → no empty chip", !/dr-empty/.test(w.drStripChips("kida")) && /dr-row/.test(w.drStripChips("kida")));
}

console.log("5. the strip and the block");
{
  const STRIP = slice("  const _drChips=", "  const _pausedHtml=").replace(/\n  const _pausedHtml=$/, "");
  const run = (other, chips) => { const e = { _other: other, subs: {}, gvKid: "kidb", esc, cw: () => "Runs every day (no lessons to lay out)", drStripChips: () => chips }; vm.createContext(e); vm.runInContext(STRIP + "\nthis.__h=_otherHtml;", e); return e.__h; };
  ok("strip draws with zero every-day subjects when there is a practice chip", run([], '<button class="dr-empty">x</button>').indexOf("dr-empty") > 0);
  ok("…and not at all with nothing to show (as before)", run([], "") === "");
  const both = run(["notebook"], '<button class="dr-row">y</button>');
  ok("practice chips come after the subject chips", both.indexOf("ceOpenEdit('kidb','notebook')") > 0 && both.indexOf("dr-row") > both.indexOf("ceOpenEdit('kidb','notebook')"));
  ok("subject chips unchanged (same button, same arrow)", both.indexOf(">notebook →</button>") > 0, both);
  const G = fn("renderCurrGrid");
  ok("both call sites (no lesson grid yet + the grid) still draw _otherHtml", (G.match(/h\+=_otherHtml;/g) || []).length === 2);
  ok("chips are built before the no-grid early return", G.indexOf("const _drChips=") < G.indexOf("if(!dayNums.length||!cols.length)"));
  ok("the block writes nothing", !/\.set\(|\.update\(|\.remove\(|\.push\(\s*\)|db\b/.test(DRILLROWS.replace(/^\s*\/\/.*$/gm, "")));
  ok("no 🔀 emoji", DRILLROWS.indexOf("\u{1F500}") < 0);
  ok("no kid names in the block", !/lincoln|ellis|lucy|julian|caleb|andrew|taylor|makenzie/i.test(DRILLROWS.replace(/^\s*\/\/.*$/gm, "")));
  const GW = fn("gwInjectRetrieval");
  ok("the builder still reads retrOn + retrDayKinds (what the lines read)", /retrOn\(kid\)/.test(GW) && /retrDayKinds\(kid,/.test(GW));
}

console.log("6. a tap only navigates");
{
  const w = world({ plan: { kida: { week: { mon: "drill" } } } });
  const chips = w.drStripChips("kida");
  // DRILLDAYS (slice 3, 2026-11-21): a line that runs now opens its day sheet; greyed lines and the empty chip keep drGo (test_drill_days.js)
  ok("a running line opens its day sheet for this child (DRILLDAYS)", /onclick="drDaysOpen\('kida','drill'\)"/.test(chips));
  w.drGo("kida");
  const g = w.__get();
  ok("child picked, 🔁 Retrieval Plan view open", g.mhqKid === "kida" && g.mhqView === "retr" && g.mhqDeck === null, g);
  ok("same clean-up as mhqSetKid", g.mhqSessEdit === null && g.mastAdminLocal === null);
  ok("lands on School ▸ Mastery ▸ Settings (mpSchoolOpen('mhq'))", JSON.stringify(w.nav) === '["mhq"]', w.nav);
  ok("nothing written to the plan", JSON.stringify(w.masteryData.retrievalPlan) === JSON.stringify({ kida: { week: { mon: "drill" } } }));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
