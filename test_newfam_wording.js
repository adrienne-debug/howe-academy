/*
 * Node tests — NEWFAM slice 2 (her "Yes, start them" 2026-11-24): fixed wording that every family sees must not name
 * a Howe child. Five places (design 1.2 #5–#8):
 *   1. Settings ▸ Family rules ▸ ✅ Audit Checklist — "What it checks" list (rulesFamilyCardsHTML)
 *   2. Mom HQ ▸ 🪄 Generate Week — the notebooks line (renderAdminGenerate)
 *   3. Mastery ▸ 🖨 Print — the card sheet's header names the kid being printed, with that kid's emoji (mastPrintCards)
 *   4. Household ▸ 📋 Review rows — the note box hint (hhRowHTML)
 *   5. Mom's Day ⭐ give box — the "what's it for?" hint (mpBankAsk)
 * Each is drawn (or, for the big Settings card, its list sliced) for a MADE-UP family; the Howe names come from the
 * app's own roster defaults (family-config.js and index.html's FAMILY_DEFAULT), not from a typed list.
 *   run:  node test_newfam_wording.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const house = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function slice(name, from) { from = from || src; const i = from.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = from.indexOf("{", i); k < from.length; k++) { if (from[k] === "{") d++; else if (from[k] === "}" && --d === 0) return from.slice(i, k + 1); } }
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };

// ── Howe's children, from the app's own roster defaults ──
const cfg = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, "family-config.js"), "utf8"), cfg);
const fdSrc = cut("const FAMILY_DEFAULT", "const ROSTER_DEF").replace("const FAMILY_DEFAULT", "FD");
const fd = { window: {} }; vm.runInNewContext("var FD;" + fdSrc, fd);   // window.HA_FAMILY absent → the code's own Howe fallback list
const HOWE = [...new Set([].concat(cfg.window.HA_FAMILY.roster, fd.FD).map(k => k.name))];
ok("Howe's children read from the roster defaults (" + HOWE.join(", ") + ")", HOWE.length >= 4 && cfg.window.HA_FAMILY.familyId === "howe");
const HOWE_RE = new RegExp("\\b(" + HOWE.join("|") + ")\\b", "i");
const named = s => { const m = String(s).match(HOWE_RE); return m ? m[0] : null; };

// ── a made-up family ──
const FAM = [{ id: "wren", name: "Wren", color: "#0f766e", emoji: "🦉", schoolAge: true },
             { id: "milo", name: "Milo", color: "#b45309", emoji: "🐢", schoolAge: false }];

console.log("1. Settings ▸ Family rules ▸ Audit Checklist");
{ const f = slice("rulesFamilyCardsHTML");
  const i = f.indexOf('["No kid double-booked'), j = f.indexOf("].forEach", i);
  const list = vm.runInNewContext(f.slice(i, j + 1));
  ok("the 'What it checks' list is found (6 lines)", Array.isArray(list) && list.length === 6, list);
  ok("no line names a Howe child", list.every(l => !named(l)), list.filter(named));
  ok("the screen line says what the check does for any family", list.includes("No more iPad/phone tasks at once than there are shared screens"), list);
  // the only other Howe name in this card is the Saturday "(Lucy) max" row, drawn only from saved rule data (sat.lucy_max)
  const rest = f.replace(/if\(sat\.lucy_max\)\{[\s\S]*?\n  \}\n/, "");
  ok("nothing else in the card's code names a Howe child (bar the data-only Saturday row)", !named(rest), named(rest)); }

console.log("2. Mom HQ ▸ Generate Week");
{ const ls = { m: {}, getItem(k) { return k in this.m ? this.m[k] : null; }, setItem(k, v) { this.m[k] = String(v); }, removeItem(k) { delete this.m[k]; } };
  const el = { innerHTML: "" };
  const ctx = { HA_LS: ls, document: { getElementById: () => null }, console, currData: { subjects: { a: 1 } }, WK: "week3",
    gwStatus: "", gwResult: null, esc: s => s, cap: s => s, ROSTER_DEF: FAM };
  vm.createContext(ctx); vm.runInContext(cut("// GWGONE_START", "// GWGONE_END") + "\n" + slice("renderAdminGenerate"), ctx);
  ctx.renderAdminGenerate(el, "");
  const h = el.innerHTML;
  ok("the page draws the notebooks button", /haOpenNotebookPicker\(\)/.test(h));
  ok("no Howe child named on the page", !named(h), named(h));
  ok("the notebooks line reads 'Builds print-ready notebooks right here, no terminal.'", h.includes(">Builds print-ready notebooks right here, no terminal.</div>")); }

console.log("3. Mastery ▸ Print (flash cards)");
function printFor(kid, roster) {
  // the REAL roster → name / emoji path: KID_NAME, the KID_LOOK emoji map, cap(), kcEmoji(), esc()
  const kidName = src.match(/const KID_NAME\s*=[^\n]*/)[0];
  const look = cut("const MAST_KID_COL=", "const MAST_JULIAN_BANK");
  const helpers = ["_mastVisNorm", "mastLiveVisual"].filter(n => src.includes("function " + n + "(")).map(n => slice(n)).join("\n");
  const code = "const ROSTER_DEF=__R;\n" + kidName + "\n" + look + "\n" + ["cap", "esc", "kcEmoji", "mastPrintCards"].map(n => slice(n)).join("\n") + "\n" + helpers;
  const out = {};
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, parseInt, isNaN, __R: roster,
    masteryKid: kid, masteryData: { [kid]: [{ id: "x", prompt: "A", subject: "Letters", status: "introduction", tally_dots: 1 },
      { id: "y", prompt: "Red", subject: "Colors", tier: "daily" }] },
    MAST_CAT_EMOJI_MAP: {}, MAST_ANIMAL_EMOJI: {}, SL_KLBL: {}, MAST_TIER_LBL: { daily: "Daily" }, weekData: { week: "week3" }, WK: "week3",
    mastDrillSettings: () => ({}), mastColorBorder: () => "#000", mastCountEmoji: () => "*", mastCountN: () => 3, mastCountVisFrames: () => "",
    haPrintCss: () => "", haPrintDoc: (t, page) => { out.page = page; } };
  vm.createContext(ctx); vm.runInContext(code, ctx);
  ctx.mastPrintCards();
  const m = String(out.page || "").match(/font-size:1\.1rem;font-weight:700;color:[^"]*">([^<]*)<\/div>/);
  return { page: out.page || "", header: m ? m[1] : null };
}
{ const w = printFor("wren", FAM);
  ok("Wren's sheet is headed with the kid's own emoji and name: '🦉 Wren'", w.header === "🦉 Wren", w.header);
  ok("no Howe child named on Wren's sheet", !named(w.page), named(w.page));
  const m = printFor("milo", FAM);
  ok("Milo's sheet says '🐢 Milo' (the kid printed, not the first kid)", m.header === "🐢 Milo", m.header);
  const nf = printFor("ivy", [{ id: "ivy", name: "Ivy", color: "#334155", schoolAge: true }]);
  ok("a kid with no emoji set gets the app's 🌟: '🌟 Ivy'", nf.header === "🌟 Ivy", nf.header);
  // Howe's own print: Julian's sheet reads as today (🦕 Julian); a different kid's sheet now names that kid
  const howe = cfg.window.HA_FAMILY.roster;
  const j = printFor("julian", howe), l = printFor("lucy", howe);
  ok("Howe: Julian's sheet still reads '🦕 Julian'", j.header === "🦕 Julian", j.header);
  ok("Howe: Lucy's sheet reads '🦄 Lucy' (was '🦕 Julian')", l.header === "🦄 Lucy", l.header); }

console.log("4. Household ▸ Review row note box");
{ const f = slice("hhRowHTML");
  const ph = (f.match(/placeholder="[^"]*"/g) || []);
  ok("the row has its note box", ph.some(p => /^placeholder="Note \(/.test(p)), ph);
  ok("no placeholder in the row names a Howe child", ph.every(p => !named(p)), ph.filter(named));
  ok("the note hint reads 'Note (move to Tue, give to someone else, …)'", ph.includes('placeholder="Note (move to Tue, give to someone else, …)"'), ph); }

console.log("5. Mom's Day ⭐ give / take box");
function bankBox(give) {
  let body = "";
  const env = { document: { getElementById: id => (id === "mpbank-wren" ? { value: "5" } : null), body: { insertAdjacentHTML: (w, h) => { body += h; } } },
    momHere: () => true, dadAwardOk: () => false, gwShowToast: () => {}, bankGiveDock: () => {}, cap: s => s.charAt(0).toUpperCase() + s.slice(1),
    SL_KCOL: { wren: "#0f766e" }, setTimeout: f => f(), String, parseInt, Math };
  const keys = Object.keys(env);
  const api = new Function(...keys, ["mpBankAskClose", "mpBankAsk", "esc"].map(n => slice(n)).join("\n") + "\nreturn {mpBankAsk};")(...keys.map(k => env[k]));
  api.mpBankAsk("wren", give ? 1 : -1);
  return body;
}
{ const g = bankBox(true), t = bankBox(false);
  ok("the give box draws for Wren", /id="mpbank-why"/.test(g) && /Wren/.test(g));
  ok("give hint reads 'e.g. helped without being asked'", g.includes('placeholder="e.g. helped without being asked"'));
  ok("no Howe child named in the give or take box", !named(g) && !named(t), [named(g), named(t)]); }

console.log("6. the five old literals are gone (index.html + house.js)");
const OLD = ["Lucy’s iPad runs independently of the boys’", "Lucy's iPad runs independently", "Julian first; more kids coming",
  "\\u{1F995} Julian", "🦕 Julian", "give to Lucy, …", "helped Lucy without being asked"];
for (const s of OLD) ok("gone: " + s, !src.includes(s) && !house.includes(s));

console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
