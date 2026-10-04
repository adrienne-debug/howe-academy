// 🎨 KID_LOOK (her ask 2026-10-04): each kid's emoji + color come from Admin ▸ Settings ▸ Family, and
// Mastery follows them. Bug it fixes: Mastery's emoji/color maps only knew Howe's four kids, so DeWalt's
// kid buttons read "undefined Caleb". Run: node test_kid_look.js
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.KIDLOOK_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, c) { if (c) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name); } }

// the two maps + the roster overlay, run against different rosters
const a = src.indexOf("const MAST_KID_COL="), b = src.indexOf("\n", src.indexOf("MAST_KID_EMOJI[k.id]=(k.emoji&&String(k.emoji).trim())"));
ok("KID_LOOK overlay sits right after the maps", a > 0 && b > a && b - a < 3000);
const maps = src.slice(a, b);
const HIST_SRC = /const HIST_KCOL_LIGHT=\{[^}]*\};/.exec(src)[0];
const run = roster => new Function("ROSTER_DEF", HIST_SRC + "\n" + maps + "\nreturn {MAST_KID_COL, MAST_KID_EMOJI, HIST_KCOL_LIGHT};")(roster);

const howe = [{ id: "lincoln", name: "Lincoln", color: "#1e3a5f" }, { id: "ellis", name: "Ellis", color: "#2d5a3d" }, { id: "lucy", name: "Lucy", color: "#5b3a8c" }, { id: "julian", name: "Julian", color: "#c45e1a" }];
let m = run(howe);
ok("Howe unchanged: 🐍 🤖 🦄 🦕 and the same colors", m.MAST_KID_EMOJI.lincoln === "🐍" && m.MAST_KID_EMOJI.ellis === "🤖" && m.MAST_KID_EMOJI.lucy === "🦄" && m.MAST_KID_EMOJI.julian === "🦕" && m.MAST_KID_COL.lincoln === "#1e3a5f" && m.MAST_KID_COL.julian === "#c45e1a");
const dewalt = [{ id: "taylor", name: "Taylor", color: "#1e3a5f" }, { id: "caleb", name: "Caleb", color: "#c45e1a", emoji: "🚜" }];
m = run(dewalt);
ok("DeWalt: Caleb = 🚜 from his Family settings (was undefined)", m.MAST_KID_EMOJI.caleb === "🚜");
ok("DeWalt: a kid with no emoji set gets 🌟, never undefined", m.MAST_KID_EMOJI.taylor === "🌟");
ok("DeWalt: colors come from the roster", m.MAST_KID_COL.caleb === "#c45e1a" && m.MAST_KID_COL.taylor === "#1e3a5f");
m = run([{ id: "lincoln", name: "Lincoln", color: "#ff0000", emoji: "🦈" }]);
ok("change it in Family → Mastery follows (color + emoji)", m.MAST_KID_COL.lincoln === "#ff0000" && m.MAST_KID_EMOJI.lincoln === "🦈");
m = run(howe);
ok("history charts: Howe's light colors unchanged", m.HIST_KCOL_LIGHT.lincoln === "#93c5fd" && m.HIST_KCOL_LIGHT.julian === "#fdba74");
m = run(dewalt);
ok("history charts: Caleb gets a light mix of his orange (was undefined)", m.HIST_KCOL_LIGHT.caleb === "#e2af8d");
m = run([{ id: "lincoln", name: "Lincoln", color: "#ff0000" }]);
ok("history charts: change a color in Family → the chart's light color follows", m.HIST_KCOL_LIGHT.lincoln === "#ff8080");
m = run([{ id: "ellis", name: "Ellis", color: "#2d5a3d", emoji: "  " }]);
ok("a blank emoji box keeps the default", m.MAST_KID_EMOJI.ellis === "🤖");

// the Family editor
const fa = src.indexOf("let familyEdit=null;"), fb = src.indexOf("function celebSongUpload");
const fam = src.slice(fa, fb);
function editor(roster) {
  const G = { saved: null, ls: null, reloaded: false };
  const api = new Function("G", "ROSTER_DEF", `
    const MAST_KID_EMOJI={lincoln:"🐍",caleb:"🚜"};
    function esc(v){ return String(v==null?"":v).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;"); }
    let rulesOpen={}; function renderAll(){} function alert(){} function confirm(){ return true; }
    const document={ getElementById:()=>null }; const location={ reload(){ G.reloaded=true; } };
    const HA_LS={ setItem(k,v){ G.ls=v; } };
    const db={ ref(p){ return { set(v){ G.saved=[p,v]; return { then(f){ f(); return { catch(){} }; } }; } }; } };
    ${fam}
    return { renderFamilyCard, famSet, famAdd, famSave };`)(G, roster);
  api.G = G; return api;
}
let e = editor([{ id: "caleb", name: "Caleb", color: "#c45e1a", badge: "#ffedd5", schoolAge: true, notebook: { template: "caleb", gradeLabel: "K" } }]);
const h = e.renderFamilyCard();
ok("Family card has an emoji box per kid (placeholder = his current emoji)", /aria-label="Emoji"/.test(h) && /placeholder="🚜"/.test(h) && /famSet\(0,'emoji',this\.value\)/.test(h));
ok("Family card says the emoji + color are used across the app", /emoji, name and color — Mastery, Kids' Corner/.test(h));
e.famSet(0, "emoji", "🏗️"); e.famSet(0, "color", "#f59e0b"); e.famSave();
const saved = e.G.saved && e.G.saved[1] && e.G.saved[1][0];
ok("Save writes settings/family with the emoji + new color", e.G.saved && e.G.saved[0] === "settings/family" && saved.emoji === "🏗️" && saved.color === "#f59e0b");
ok("Save keeps his other settings (notebook grade K)", saved && saved.notebook && saved.notebook.gradeLabel === "K");
ok("Save reloads every device (existing behavior)", e.G.reloaded && JSON.parse(e.G.ls)[0].emoji === "🏗️");
e = editor([{ id: "ellis", name: "Ellis", color: "#2d5a3d", badge: "#dcfce7", schoolAge: true, emoji: "🦊" }]);
e.famSet(0, "emoji", ""); e.famSave();
ok("clearing the box removes the emoji (back to default)", e.G.saved && !("emoji" in e.G.saved[1][0]));
e = editor([]); e.famAdd(); e.famSet(0, "name", "Rosie"); e.famSave();
ok("a new kid saves fine with no emoji", e.G.saved && e.G.saved[1][0].id === "rosie" && !("emoji" in e.G.saved[1][0]));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
