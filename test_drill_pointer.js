/*
 * 🃏 DRILLPOINT — Mastery ▸ Settings ▸ 🔁 Retrieval Plan becomes a pointer, not a second editor (her pick 2026-11-22: "Yes,
 * replace them"; slice 6 of DESIGN_drill_rows_curriculum_2026-11-19.md, §4). The two rows of day buttons are replaced by
 * read-only lines (the Curriculum line's own readers and words) and "Days are set in Curriculum →"; the panel's save writes the
 * numbers only; Reset clears the numbers only. Against code sliced out of index.html (RETRWEEK + RETRFAM + DRILLTHREE,
 * retrSlotMinutes, GWRETR, DRILLROWS, the whole panel P3 → P4 with RETRSAVE + DRILLSAVE + DRILLPOINT, _mhqRenderRetr), and the
 * same tree with the slice taken out again (stripPoint — every edit undone byte for byte):
 *   0. stripPoint undoes the slice exactly; stripped, the panel equals origin/main's (still true after this branch is merged)
 *   1. made-up plans (two rows, three rows, nothing on, a no-ladder child with a saved Sprint): the panel's lines equal the
 *      Curriculum strip's lines word for word; one plain line when nothing is on; the button; no day buttons
 *   2. the save payload holds only numbers (settings) — even from a stale editor copy that still carries old days
 *   3. Reset: asks; one targeted update {settings:null}; no remove of the plan; days untouched
 *   4. week / week2 / week3 byte-identical before and after every action in the panel
 *   5. the button opens Curriculum on that child; navigation only
 *   6. the code: the tap is gone, the block writes nothing, Mom only, no names
 *   run:  node test_drill_pointer.js
 */
// [new text, old text] — exactly what the slice changed outside its block (each new text occurs exactly once).
const POINT_EDITS = [
 [
  "  retrAdminLocal={kid:masteryKid,settings:Object.assign({},rp.settings||{})};   // DRILLPOINT: the numbers only — the days are read from the plan (drRows), never copied here\n",
  "  retrAdminLocal={kid:masteryKid,settings:Object.assign({},rp.settings||{}),week:Object.assign({},retrWeek(masteryKid)),week2:Object.assign({},retrWeek2(masteryKid))};\n"
 ],
 [
  "// DRILLPOINT: retrAdminCycleDay (the old day buttons' tap) is gone — the days are set in Curriculum (DRILLDAYS, ＋ Add subject ▸ Card practice).\n",
  "function retrAdminCycleDay(day,row){\n  if(!retrAdminLocal||retrAdminLocal.kid!==masteryKid) retrAdminInit();\n  if(!retrAdminLocal.week2) retrAdminLocal.week2={};\n  const map=(row===2)?retrAdminLocal.week2:retrAdminLocal.week;\n  const cur=map[day]||\"off\";\n  map[day]=RETR_DAY_KINDS[(RETR_DAY_KINDS.indexOf(cur)+1)%RETR_DAY_KINDS.length];\n  retrAdminSave({rhythm:true});   // 💾 RETRSAVE: saves this tap; the live week follows once the tapping settles (RETRLIVE)\n}\n"
 ],
 [
  "  const kid=masteryKid;\n  if(typeof momHere===\"function\"&&!momHere()) return false;   // DRILLPOINT: Mom only\n  // DRILLPOINT: the numbers only (settings) — never week / week2 / week3: the days are set in Curriculum, so this panel can\n  // never write old days back over them (the stale-copy trap, gone for good). No live-week pass: a number never queued one.\n  const payload={settings:JSON.parse(JSON.stringify(retrAdminLocal.settings||{}))};\n  if(!drPlanWrite(kid,payload)) return false;   // 🃏 DRILLSAVE: the one plan write, told the kid\n",
  "  const kid=masteryKid;\n  // the whole row as shown — a day with nothing on it is stored as \"off\", so one tap never leaves the other days to the defaults\n  const w1={}; RETR_DAYS.forEach(d=>{ w1[d]=retrAdminLocal.week[d]||\"off\"; });\n  // Row 2 keeps only real extras: off / same-as-Row-1 days are dropped (the generator\n  // would collapse them anyway); an emptied Row 2 saves as {} which clears the node.\n  const w2={}; RETR_DAYS.forEach(d=>{ const k=(retrAdminLocal.week2||{})[d]; if(k&&k!==\"off\"&&k!==w1[d]) w2[d]=k; });\n  const payload={settings:JSON.parse(JSON.stringify(retrAdminLocal.settings||{})),week:w1,week2:w2};\n  if(!drPlanWrite(kid,payload,{rhythm:o.rhythm})) return false;   // 🃏 DRILLSAVE: the one plan write, told the kid\n"
 ],
 [
  "function retrAdminReset(){   // DRILLPOINT: \"Reset the numbers\" — clears settings only; the days are never touched from this panel\n  const kid=masteryKid;\n  if(typeof momHere===\"function\"&&!momHere()) return false;\n  if(!confirm(\"Reset \"+SL_KLBL[kid]+\"'s numbers (pass mark, minutes, sprint…) to the defaults? The practice days stay as they are.\")) return false;\n  if(!drPlanWrite(kid,{settings:null})) return false;   // 🃏 DRILLSAVE: one targeted update — settings:null removes that key only\n  retrAdminLocal=null;\n  _mastRe();\n  return true;\n}\n",
  "function retrAdminReset(){\n  if(!confirm(\"Reset \"+SL_KLBL[masteryKid]+\"'s retrieval plan to the built-in defaults?\")) return;\n  const kid=masteryKid;\n  if(masteryData.retrievalPlan) delete masteryData.retrievalPlan[kid];\n  if(db) db.ref(\"mastery/retrievalPlan/\"+kid).remove();\n  try{HA_LS.setItem(\"ha_mastery\",JSON.stringify(masteryData));}catch(e){}\n  retrAdminLocal=null;\n  if(typeof retrLiveQueue===\"function\") retrLiveQueue(kid);   // 🃏 RETRLIVE: back to the built-in rhythm — this week's cards follow too\n  _mastRe();\n}\n"
 ],
 [
  "  h+=drPointHtml(kid);   // DRILLPOINT: the day buttons are gone — read-only lines + \"Days are set in Curriculum →\"\n",
  "  h+='<div style=\"display:flex;align-items:baseline;gap:8px;margin:12px 0 6px\"><span style=\"font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#78716c\">Weekly rhythm — tap a day to cycle</span>'\n    +'<span id=\"retrAdminSaved\" style=\"flex:1;text-align:right;font-size:10.5px;color:var(--muted)\">'+retrAdminSavedHtml(kid)+'</span></div>';   // 💾 RETRSAVE\n  h+='<div style=\"display:flex;gap:5px\">';\n  RETR_DAYS.forEach(d=>{\n    const k=retrAdminLocal.week[d]||\"off\";\n    h+='<button onclick=\"retrAdminCycleDay(\\''+d+'\\')\" style=\"flex:1;padding:8px 2px;border-radius:10px;border:1.5px solid var(--border);background:#fff;cursor:pointer;font-family:\\'DM Sans\\',sans-serif;text-align:center\">'\n      +'<div style=\"font-size:9px;font-weight:800;text-transform:uppercase;color:#78716c\">'+d+'</div>'\n      +'<div style=\"font-size:15px\">'+RETR_KIND_ICON[k]+'</div>'\n      +'<div style=\"font-size:8.5px;font-weight:700;color:#57534e\">'+k+'</div></button>';\n  });\n  h+='</div>';\n  h+='<div style=\"font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#78716c;margin:10px 0 6px\">Row 2 — optional second card that day</div>';\n  h+='<div style=\"display:flex;gap:5px\">';\n  RETR_DAYS.forEach(d=>{\n    const k=(retrAdminLocal.week2||{})[d]||\"off\";\n    h+='<button onclick=\"retrAdminCycleDay(\\''+d+'\\',2)\" style=\"flex:1;padding:8px 2px;border-radius:10px;border:1.5px solid var(--border);background:'+(k===\"off\"?\"#faf8f5\":\"#fff\")+';cursor:pointer;font-family:\\'DM Sans\\',sans-serif;text-align:center;opacity:'+(k===\"off\"?\"0.65\":\"1\")+'\">'\n      +'<div style=\"font-size:9px;font-weight:800;text-transform:uppercase;color:#78716c\">'+d+'</div>'\n      +'<div style=\"font-size:15px\">'+RETR_KIND_ICON[k]+'</div>'\n      +'<div style=\"font-size:8.5px;font-weight:700;color:#57534e\">'+k+'</div></button>';\n  });\n  h+='</div>';\n"
 ],
 [
  "  h+='<div style=\"display:flex;gap:8px;margin-top:12px;justify-content:flex-end\">';   // 💾 RETRSAVE: no Save button — every change saves itself\n  h+='<span id=\"retrAdminSaved\" style=\"flex:1;align-self:center;font-size:10.5px;color:var(--muted)\">'+retrAdminSavedHtml(kid)+'</span>';   // 💾 RETRSAVE · DRILLPOINT: the saved line sits by Reset now (the numbers save; the days above are read-only)\n  h+='<button onclick=\"retrAdminReset()\" style=\"padding:8px 14px;border-radius:10px;border:1.5px solid var(--border);background:#fff;font-size:11px;font-weight:700;cursor:pointer;color:#b5394a;font-family:\\'DM Sans\\',sans-serif\">Reset the numbers</button>';   // DRILLPOINT\n",
  "  h+='<div style=\"display:flex;gap:8px;margin-top:12px;justify-content:flex-end\">';   // 💾 RETRSAVE: no Save button — every change saves itself\n  h+='<button onclick=\"retrAdminReset()\" style=\"padding:8px 14px;border-radius:10px;border:1.5px solid var(--border);background:#fff;font-size:11px;font-weight:700;cursor:pointer;color:#b5394a;font-family:\\'DM Sans\\',sans-serif\">Reset</button>';\n"
 ],
 [
  "+'\\u2019s retrieval plan \\u2014 the re-check rhythm after a miss, the gate and the match suggestion. Changes save by themselves; Reset the numbers goes back to the defaults. The practice days are set on the Curriculum page.</div>';   // DRILLPOINT\n",
  "+'\\u2019s retrieval plan \\u2014 the re-check rhythm after a miss, the gate, the match suggestion and the weekly days. Save keeps it; Reset goes back to the defaults.</div>';\n"
 ]
];
function stripPoint(s) {
  if (s.indexOf("DRILLPOINT") < 0) return s;   // a tree without the slice (origin/main before it is merged)
  const a = s.indexOf("// DRILLPOINT_START"), b = s.indexOf("// DRILLPOINT_END\n");
  if (a < 0 || b < a) throw new Error("DRILLPOINT block markers not found");
  s = s.slice(0, a) + s.slice(b + "// DRILLPOINT_END\n".length);
  POINT_EDITS.forEach(function (p) {
    const n = s.split(p[0]).length - 1;
    if (n !== 1) throw new Error("stripPoint: an edit is not there exactly once (" + n + "): " + p[0].slice(0, 80));
    s = s.replace(p[0], () => p[1]);
  });
  return s;
}
module.exports = { stripPoint };
if (require.main !== module) return;

const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
const { stripPause } = require("./test_drill_pause.js");   // DRILLPAUSE (slice 5): this test pins its own slice on the tree with the pause taken out (both sides); test_drill_pause.js pins the pause
const src = stripPause(fs.readFileSync(path.join(__dirname, "index.html"), "utf8"));   // DRILLPAUSE
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } }
function fnIn(S, name) { const i = S.indexOf("function " + name + "("); if (i < 0) throw new Error("not found " + name); let d = 0; for (let k = S.indexOf("{", i); k < S.length; k++) { if (S[k] === "{") d++; else if (S[k] === "}") { d--; if (!d) return S.slice(i, k + 1); } } throw new Error("unbalanced " + name); }
function sliceIn(S, a, b) { const i = S.indexOf(a), j = S.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error("marker " + a); return S.slice(i, j + b.length); }
const clone = x => JSON.parse(JSON.stringify(x));
const J = JSON.stringify;
const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unesc = s => String(s).replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const wk = (mon, tue, wed, thu, fri) => ({ mon, tue, wed, thu, fri });
const PANEL0 = "// ── P3: Retrieval Plan Admin editor", PANEL1 = "// ── P4: schedule day-card strip";
const BLOCK = sliceIn(src, "// DRILLPOINT_START", "// DRILLPOINT_END");

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("0. stripPoint undoes the slice exactly");
{
  const S0 = stripPoint(src);
  ok("the block is there once, outside RETRSAVE, just before retrAdminHtml", src.split("// DRILLPOINT_START").length === 2 && src.split("// DRILLPOINT_END").length === 2
    && src.indexOf("// RETRSAVE_END") < src.indexOf("// DRILLPOINT_START") && src.indexOf("// DRILLPOINT_END\nfunction retrAdminHtml(){") > 0);
  ok("stripped: no trace of the slice", !/DRILLPOINT|drPoint|dr-point/.test(S0));
  ok("stripped: the old day buttons, their tap and the whole-plan Reset are back", /function retrAdminCycleDay\(day,row\)\{/.test(S0) && /Weekly rhythm — tap a day to cycle/.test(S0)
    && /if\(db\) db\.ref\("mastery\/retrievalPlan\/"\+kid\)\.remove\(\);/.test(S0));
  let main = ""; try { main = cp.execSync("git show origin/main:index.html", { cwd: __dirname, encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }); } catch (e) { main = ""; } main = stripPause(main);   // DRILLPAUSE: the same on origin/main's side
  if (main) {
    const M0 = stripPoint(main);
    ok("stripped, the Retrieval Plan panel (P3 → P4) equals origin/main's (stripped the same way — still true after the merge)", sliceIn(S0, PANEL0, PANEL1) === sliceIn(M0, PANEL0, PANEL1));
    ok("stripped, _mhqRenderRetr equals origin/main's", fnIn(S0, "_mhqRenderRetr") === fnIn(M0, "_mhqRenderRetr"));
  } else console.log("  (origin/main not readable here — compare skipped)");
  const out = src.slice(0, src.indexOf(PANEL0)) + src.slice(src.indexOf(PANEL1));
  const out0 = S0.slice(0, S0.indexOf(PANEL0)) + S0.slice(S0.indexOf(PANEL1));
  ok("outside the panel only the page's intro line changed", out.replace(fnIn(src, "_mhqRenderRetr"), "") === out0.replace(fnIn(S0, "_mhqRenderRetr"), ""));
  ok("the week builder, the live pass, the Curriculum rows and the one plan write are untouched (byte-identical blocks)",
    ["RETRWEEK", "GWRETR", "RETRLIVE", "DRILLROWS", "DRILLDAYS", "DRILLADD", "DRILLSAVE"].every(m => sliceIn(src, "// " + m + "_START", "// " + m + "_END") === sliceIn(S0, "// " + m + "_START", "// " + m + "_END")));
}

// ── the world: RETRWEEK (+ RETRFAM + DRILLTHREE), retrSlotMinutes, GWRETR (card titles, retrSlotMom), DRILLROWS (the Curriculum
// lines), the whole Retrieval Plan panel (P3 → P4: editor, RETRSAVE + DRILLSAVE, Reset, DRILLPOINT, retrAdminHtml), the page.
// kida has a sprint ladder, kidb has none (the RETRFAM rule). Made-up ids only — the code's built-in starting days stay out.
const DEF_RE = /const RETR_WEEK_DEFAULT=\{[\s\S]*?\n\s*lincoln:\{[^}]*\}\};/;
function world(o) {
  o = o || {};
  const writes = [], removes = [], sets = [], nav = [], queued = [];
  const env = {
    console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, parseFloat, isNaN, RegExp, Error, Date,
    masteryKid: o.kid || "kida", masteryData: { retrievalPlan: clone(o.plan || {}) },
    currData: { subjects: clone(o.subjects || {}) },
    ROSTER: ["kida", "kidb"], SL_KLBL: { kida: "Kid A", kidb: "Kid B" }, KID_NAME: { kida: "Kid A", kidb: "Kid B" },
    cap: k => ({ kida: "Kid A", kidb: "Kid B" })[k] || k, esc, mhqEsc: esc,
    retrTracks: k => (k === "kida" ? [{ key: "t" }] : []),
    retrSettings: () => ({ gate_pct: 80, gate_streak: 2, review_count: 3, stuck_after: 8, sprint_seconds: 60, sprint_rounds: 2, slot_min_drill: 5, slot_min_match: 10, heatmap_window: 14, recheck_ladder: [1, 3, 7], gate_metric: "accuracy", recheck_fail: "focus", match_rotation: "heatmap" }),
    mastMeasuredDrillMin: () => null,
    momHere: () => (o.mom !== false), _dryRun: () => !!o.dry,
    HA_LS: { setItem() {}, getItem() { return null; } },
    _mastRe: () => { env.repaints++; }, repaints: 0,
    confirm: m => { env.confirms.push(m); return env.confirmAnswer; }, confirms: [], confirmAnswer: true,
    document: { getElementById: id => (id === "retrAdminSaved" ? env.savedEl : null) }, savedEl: { innerHTML: "" },
    retrLiveQueue: k => { queued.push(k); return true; }, retrLivePending: () => false,
    mpSchoolOpen: t => nav.push(t),
    gvKid: "kidz", gvEdit: { x: 1 }, gvSelMode: true, gvSel: new Set(["x"]), gvSelAnchor: 3, gvSelUndo: { u: 1 }, gvScrollTop: 50, gvScrollLeft: 20,
    db: o.db === false ? null : { ref: p => ({ update: v => writes.push({ p, v: clone(v) }), remove: () => removes.push(p), set: v => sets.push({ p, v: clone(v) }) }) },
    writes, removes, sets, nav, queued,
  };
  vm.createContext(env);
  vm.runInContext(fnIn(src, "retrSlotMinutes") + "\n" + sliceIn(src, "// RETRWEEK_START", "// RETRWEEK_END").replace(DEF_RE, "const RETR_WEEK_DEFAULT={};")
    + "\n" + sliceIn(src, "// GWRETR_START", "// GWRETR_END") + "\n" + sliceIn(src, "// DRILLROWS_START", "// DRILLROWS_END")
    + "\n" + src.slice(src.indexOf(PANEL0), src.indexOf(PANEL1)) + "\n" + fnIn(src, "_mhqRenderRetr")
    + "\n;this.__admin=()=>retrAdminLocal;this.__setAdmin=v=>{retrAdminLocal=v;};", env);
  return env;
}
const pointLines = h => [...h.matchAll(/<div class="dr-point-line"[^>]*>([^<]*)<\/div>/g)].map(m => unesc(m[1]));
const currLines = h => [...h.matchAll(/<button class="dr-row"[^>]*>([^<]*)<\/button>/g)].map(m => unesc(m[1]).replace(/ →$/, ""));
const days3 = p => J({ week: (p || {}).week, week2: (p || {}).week2, week3: (p || {}).week3 });

const PLANS = [
  { name: "two rows (Daily Drill Mon–Fri, Match & Play Mon Wed in the second)", kid: "kida",
    plan: { kida: { week: wk("drill", "drill", "drill", "drill", "drill"), week2: { mon: "match", wed: "match" }, settings: { gate_pct: 90 } } },
    want: ["\u{1F0CF} Daily Drill · Mon Tue Wed Thu Fri · 5 min · with Mom", "\u{1F3AF} Match & Play · Mon Wed · 10 min · on their own"] },
  { name: "three rows (+ Sprint Re-checks on Fri in the third)", kid: "kida",
    plan: { kida: { week: wk("sprint", "match", "sprint", "match", "drill"), week2: wk("drill", "drill", "drill", "drill", "match"), week3: { fri: "recheck" } } },
    want: null },
  { name: "nothing on", kid: "kidb", plan: {}, want: [] },
  { name: "nothing on (every day stored off)", kid: "kida", plan: { kida: { week: wk("off", "off", "off", "off", "off") } }, want: [] },
  { name: "no-ladder child with a saved Sprint (and a Drill that runs)", kid: "kidb",
    plan: { kidb: { week: wk("sprint", "drill", "sprint", "off", "off") } },
    want: ["\u{1F0CF} Daily Drill · Tue · 5 min · with Mom", "\u{1F3C3} Sprint · Mon Wed — can’t run for Kid B yet"] },
];

console.log("1. the read-only lines are the Curriculum lines' own words (all three rows)");
PLANS.forEach(c => {
  const w = world({ plan: c.plan, kid: c.kid });
  const h = w.retrAdminHtml();
  const got = pointLines(h), rows = w.drRows(c.kid);
  ok(c.name + ": one line per kind, = drLineText (without the tap arrow)", J(got) === J(rows.map(r => w.drLineText(r, w.cap(c.kid)).replace(/ →$/, ""))) && got.length === rows.length, [got, rows.map(r => r.kind)]);
  ok(c.name + ": = the Curriculum strip's own lines, word for word", J(got) === J(currLines(w.drStripChips(c.kid))), [got, currLines(w.drStripChips(c.kid))]);
  if (c.want) ok(c.name + ": reads as expected", J(got) === J(c.want), got);
  ok(c.name + ": the button opens Curriculum on this child", h.split('class="dr-point-go"').length === 2 && h.indexOf('onclick="drPointGo(\'' + c.kid + '\')"') > 0 && />Days are set in Curriculum →<\/button>/.test(h));
  ok(c.name + ": no day buttons, no cycle, no old rhythm words", !/retrAdminCycleDay|Weekly rhythm|Row 2|tap a day/.test(h));
  if (!rows.length) ok(c.name + ": one plain line", /<div class="dr-point-none"[^>]*>No flash-card practice on Kid [AB]’s week yet\.<\/div>/.test(h) && h.split("No flash-card practice").length === 2);
  else ok(c.name + ": no empty-state line", !/No flash-card practice/.test(h));
  ok(c.name + ": rendering writes nothing", w.writes.length + w.removes.length + w.sets.length === 0);
});
{
  const c = PLANS[1], w = world({ plan: c.plan, kid: "kida" });
  const got = pointLines(w.retrAdminHtml());
  ok("three rows: the third row's kind shows (Sprint Re-checks · Fri)", got.some(l => /^\u{1F4C5} Sprint Re-checks · Fri · /u.test(l)), got);
  ok("three rows: every kind once, in the fixed order", J(got.map(l => l.split(" · ")[0])) === J(["\u{1F0CF} Daily Drill", "\u{1F3AF} Match & Play", "\u{1F3C3} Sprint", "\u{1F4C5} Sprint Re-checks"]), got);
}
{
  const w = world({ plan: PLANS[4].plan, kid: "kidb" });
  const h = w.retrAdminHtml();
  ok("a line that can't run is greyed, a line that runs is purple", /color:#9ca3af[^>]*>\u{1F3C3} Sprint/u.test(h) && /color:#6d28d9[^>]*>\u{1F0CF} Daily Drill/u.test(h));
  const w2 = world({ plan: { kida: { week: wk("drill", "off", "off", "off", "off") } }, kid: "kida" });
  const h2 = w2.retrAdminHtml();
  ok("one id=\"retrAdminSaved\" in the panel (no duplicate ids), and it still updates in place", h2.split('id="retrAdminSaved"').length === 2);
  ok("the numbers are all still there, in their order", J([...h2.matchAll(/retrAdmin(?:Num|Toggle)\('([a-z_]+)'/g)].map(m => m[1])) === J(["gate_pct", "gate_streak", "review_count", "stuck_after", "sprint_seconds", "sprint_rounds", "slot_min_drill", "slot_min_match", "heatmap_window", "gate_metric", "recheck_fail", "match_rotation"]) && /onchange="retrAdminLadder\(this\.value\)"/.test(h2));
  ok("Reset reads \"Reset the numbers\"", />Reset the numbers<\/button>/.test(h2) && !/>Reset<\/button>/.test(h2));
  const pg = w2._mhqRenderRetr("kida");
  ok("the page's intro no longer says weekly days / Save keeps it; it points to Curriculum", !/weekly days|Save keeps it/.test(pg) && /The practice days are set on the Curriculum page\./.test(pg) && /retrieval plan/.test(pg));
}

console.log("2. the panel's save writes the numbers only");
{
  const plan = { kida: { week: wk("drill", "match", "sprint", "recheck", "drill"), week2: { mon: "match" }, week3: { mon: "sprint" }, settings: { gate_pct: 90 }, mathfacts_order: ["x"] } };
  const w = world({ plan, kid: "kida" });
  const before = days3(w.masteryData.retrievalPlan.kida);
  w.retrAdminInit();
  ok("the editor copy holds the kid and the numbers — no days", J(Object.keys(w.__admin()).sort()) === J(["kid", "settings"]));
  w.retrAdminNum("slot_min_drill", "7");
  w.retrAdminLadder("1, 4, 9");
  w.retrAdminToggle("gate_metric", "accuracy", "completion");
  w.retrAdminNum("gate_pct", "");
  ok("4 changes → 4 writes, each to mastery/retrievalPlan/kida", w.writes.length === 4 && w.writes.every(x => x.p === "mastery/retrievalPlan/kida"), w.writes.map(x => x.p));
  ok("every payload is {settings} and nothing else", w.writes.every(x => J(Object.keys(x.v)) === '["settings"]'), w.writes.map(x => Object.keys(x.v)));
  ok("the numbers are right", J(w.writes[3].v.settings) === J({ slot_min_drill: 7, recheck_ladder: [1, 4, 9], gate_metric: "accuracy" }), w.writes[3].v.settings);
  ok("week / week2 / week3 byte-identical after the saves", days3(w.masteryData.retrievalPlan.kida) === before);
  ok("the kid's other keys kept in the mirror", J(w.masteryData.retrievalPlan.kida.mathfacts_order) === '["x"]');
  ok("a number never queues the live week", w.queued.length === 0);
  ok("no remove(), no whole-node set()", w.removes.length === 0 && w.sets.length === 0);
}
{
  // the stale-copy trap, gone for good: an editor copy that still carries OLD days (as the old code made) writes no days
  const w = world({ plan: { kida: { week: wk("off", "drill", "off", "drill", "off") } }, kid: "kida" });
  w.__setAdmin({ kid: "kida", settings: {}, week: wk("sprint", "sprint", "sprint", "sprint", "sprint"), week2: { mon: "drill" }, week3: { tue: "match" } });
  w.retrAdminNum("gate_pct", "75");
  ok("a stale copy with old days: the save sends the numbers only", w.writes.length === 1 && J(w.writes[0].v) === J({ settings: { gate_pct: 75 } }), w.writes[0]);
  ok("…and the stored days are untouched", J(w.masteryData.retrievalPlan.kida.week) === J(wk("off", "drill", "off", "drill", "off")) && w.masteryData.retrievalPlan.kida.week2 === undefined);
}
{
  const w = world({ kid: "kida" });
  w.retrAdminInit(); w.masteryKid = "kidb";
  ok("wrong-kid guard still holds: a stale editor writes nothing", w.retrAdminSave() === false && w.writes.length === 0 && w.__admin().kid === "kidb");
}
{
  const w = world({ kid: "kida", mom: false });
  w.retrAdminNum("gate_pct", "70");
  ok("Mom only: not Mom → nothing written, nothing mirrored", w.writes.length === 0 && !w.masteryData.retrievalPlan.kida);
}
{
  const w = world({ kid: "kida", dry: true, plan: { kida: { week: wk("drill", "off", "off", "off", "off") } } });
  w.retrAdminNum("gate_pct", "70");
  ok("?dryrun=1: no database write, the screen still follows (mirror)", w.writes.length === 0 && w.masteryData.retrievalPlan.kida.settings.gate_pct === 70);
}

console.log("3. Reset the numbers clears settings and nothing else");
{
  const plan = { kida: { week: wk("drill", "match", "sprint", "recheck", "drill"), week2: { mon: "match" }, week3: { mon: "sprint" }, settings: { gate_pct: 90, slot_min_drill: 8 }, mathfacts_order: ["x"] } };
  const w = world({ plan, kid: "kida" });
  const before = days3(w.masteryData.retrievalPlan.kida);
  w.confirmAnswer = false;
  ok("it asks first — No changes nothing", w.retrAdminReset() === false && w.confirms.length === 1 && w.writes.length === 0 && w.masteryData.retrievalPlan.kida.settings.gate_pct === 90);
  ok("the question says the days stay", /numbers/.test(w.confirms[0]) && /practice days stay as they are/.test(w.confirms[0]) && /Kid A/.test(w.confirms[0]), w.confirms[0]);
  w.confirmAnswer = true;
  ok("Yes → one targeted update", w.retrAdminReset() === true && w.writes.length === 1 && w.writes[0].p === "mastery/retrievalPlan/kida", w.writes);
  ok("…whose payload is exactly {settings:null} (removes that key only)", J(w.writes[0].v) === J({ settings: null }), w.writes[0].v);
  ok("…no remove() of the plan, no set()", w.removes.length === 0 && w.sets.length === 0, w.removes);
  ok("week / week2 / week3 byte-identical after Reset", days3(w.masteryData.retrievalPlan.kida) === before);
  ok("the numbers are back to the defaults on screen (settings gone, other keys kept)", !w.masteryData.retrievalPlan.kida.settings && J(w.masteryData.retrievalPlan.kida.mathfacts_order) === '["x"]');
  ok("the lines after Reset are the same as before", J(pointLines(w.retrAdminHtml())) === J(pointLines(world({ plan, kid: "kida" }).retrAdminHtml())));
  ok("Reset never queues the live week (the days did not change)", w.queued.length === 0);
}
{
  const w = world({ kid: "kida", mom: false, plan: { kida: { settings: { gate_pct: 90 } } } });
  ok("Mom only: not Mom → no question, nothing written", w.retrAdminReset() === false && w.confirms.length === 0 && w.writes.length === 0);
  const d = world({ kid: "kida", dry: true, plan: { kida: { week: wk("drill", "off", "off", "off", "off"), settings: { gate_pct: 90 } } } });
  d.retrAdminReset();
  ok("?dryrun=1: Reset sends nothing; the mirror follows", d.writes.length === 0 && !d.masteryData.retrievalPlan.kida.settings && d.masteryData.retrievalPlan.kida.week.mon === "drill");
  const n = world({ kid: "kida", db: false, plan: { kida: { settings: { gate_pct: 90 } } } });
  ok("no db: no crash", n.retrAdminReset() === true);
}

console.log("4. every action in the panel leaves the days byte-identical");
PLANS.forEach(c => {
  const w = world({ plan: c.plan, kid: c.kid });
  const before = days3(w.masteryData.retrievalPlan[c.kid]);
  const acts = [
    () => w.retrAdminHtml(), () => w._mhqRenderRetr(c.kid), () => w.retrAdminInit(), () => w.retrAdminNum("gate_pct", "85"), () => w.retrAdminNum("sprint_seconds", ""),
    () => w.retrAdminLadder("2, 5"), () => w.retrAdminLadder(""), () => w.retrAdminToggle("recheck_fail", "focus", "review"), () => w.retrAdminToggle("match_rotation", "manual", "heatmap"),
    () => w.retrAdminSave(), () => w.retrAdminSave({ quiet: true }), () => w.retrAdminSave({ rhythm: true }), () => { w.confirmAnswer = false; w.retrAdminReset(); },
    () => { w.confirmAnswer = true; w.retrAdminReset(); }, () => w.drPointGo(c.kid), () => w.retrAdminHtml()];
  const bad = [];
  acts.forEach((f, i) => { f(); if (days3(w.masteryData.retrievalPlan[c.kid]) !== before) bad.push(i); });
  ok(c.name + ": " + acts.length + " actions, days unchanged after each", bad.length === 0, bad);
  ok(c.name + ": no write ever carried week / week2 / week3", w.writes.every(x => J(Object.keys(x.v)) === '["settings"]'), w.writes.map(x => Object.keys(x.v)));
  ok(c.name + ": no live-week pass queued", w.queued.length === 0);
});

console.log("5. Days are set in Curriculum → opens Curriculum on that child");
{
  const w = world({ kid: "kidb", plan: {} });
  w.drPointGo("kidb");
  ok("Mom's Day ▸ School ▸ Curriculum (the chip's own door)", J(w.nav) === '["curriculum"]', w.nav);
  ok("…on that child (gvKid), editor / selection / scroll reset like gvSetKid", w.gvKid === "kidb" && w.gvEdit === null && w.gvSelMode === false && w.gvSel.size === 0 && w.gvSelAnchor === null && w.gvSelUndo === null && w.gvScrollTop === 0 && w.gvScrollLeft === 0);
  ok("navigation only: nothing written", w.writes.length + w.removes.length + w.sets.length === 0 && w.queued.length === 0);
  ok("no child → nothing happens", w.drPointGo("") === false && w.nav.length === 1);
  ok("the Curriculum chip's door lands on the grid (mpSchoolOpen sets currInnerTab='grid' for 'curriculum')", /if\(t==='curriculum'\)\{ try\{ currInnerTab='grid'; \}catch\(e\)\{\} \}/.test(fnIn(src, "mpSchoolOpen")));
}

console.log("6. the code");
{
  ok("the day-button tap is gone from the app (no function, no caller)", !/retrAdminCycleDay\(/.test(src.replace(/^\s*\/\/.*$/mg, "")));
  ok("RETR_DAY_KINDS / RETR_KIND_ICON are left (the live pass and the brain-work strip still read them)", /RETR_DAY_KINDS\.forEach\(function\(kind\)/.test(sliceIn(src, "// RETRLIVE_START", "// RETRLIVE_END")) && /RETR_KIND_ICON\[k\]\+" "\+k/.test(src));
  ok("the DRILLPOINT block writes nothing (no db, no storage, no plan write)", !/db\.ref|HA_LS|drPlanWrite\(|retrLiveQueue\(/.test(BLOCK.replace(/^\/\/.*$/mg, "")));
  const save = fnIn(src, "retrAdminSave"), reset = fnIn(src, "retrAdminReset");
  ok("the panel's two writes both go through drPlanWrite (one each), Mom only", (save.match(/drPlanWrite\(/g) || []).length === 1 && (reset.match(/drPlanWrite\(/g) || []).length === 1
    && /if\(typeof momHere==="function"&&!momHere\(\)\) return false;/.test(save) && /if\(typeof momHere==="function"&&!momHere\(\)\) return false;/.test(reset));
  ok("neither names week / week2 / week3", !/week/.test(save.replace(/\/\/[^\n]*/g, "")) && !/week/.test(reset.replace(/\/\/[^\n]*/g, "")));
  ok("no kid or family names in the block", !/\b(lincoln|ellis|lucy|julian|taylor|makenzie|kenzie|andrew|caleb|sara|melanie|howe|dewalt|burris)\b/i.test(BLOCK));
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
