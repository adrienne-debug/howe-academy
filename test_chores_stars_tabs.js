// 🧹 Chores & Stars tabs (her ask 2026-10-03): one page in set-up order, a Getting-started strip for new families,
// Mom HQ doors open the right tab. Step 1 = reorganise only, no behaviour change.
const fs = require("fs"), path = require("path");
const s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(msg, cond){ if(cond){ pass++; } else { fail++; console.log("FAIL:", msg); } }
function slice(name){ const i = s.indexOf("function " + name + "("); let d = 0, j = s.indexOf("{", i); for(; j < s.length; j++){ if(s[j] === "{") d++; else if(s[j] === "}"){ d--; if(!d) break; } } return s.slice(i, j + 1); }

const page = slice("renderChorePlan");
ok("page title", /Chores &amp; Stars/.test(page));
ok("every tab dispatches", ["store","points","rooms","log"].every(t => page.indexOf('cpTab==="' + t + '"') >= 0));
ok("rooms tab = zones + routine times", /cpTab==="rooms"\)\{ h\+=_cpZonesHTML\(\); try\{ h\+=chSettingsEveningHourHTML\(\);/.test(page));
ok("log tab = Click-off Log", /cpTab==="log"\)\{ try\{ h\+=chSettingsClickoffLogHTML\(\);/.test(page));
ok("list chips no longer carry Up for Grabs", !/\["grabs","🙌 Up for Grabs"\]\]\.forEach/.test(page));
ok("zones moved off the Lists tab", page.indexOf("zp-box") < 0 && slice("_cpZonesHTML").indexOf("zp-box") > 0 && slice("_cpZonesHTML").indexOf("zed-row") > 0);
ok("points tab keeps Mom-checks + Morning-by-10", /choreVerifySet/.test(slice("_cpPointsTabHTML")) && /chSettingsMorningRuleHTML/.test(slice("_cpPointsTabHTML")));
ok("tab bar has all six", ["lists","grabs","store","points","rooms","log"].every(t => slice("_cpTabsHTML").indexOf('["' + t + '"') >= 0));

// tab ↔ list sync
let cpTab = "lists", cpSlot = "morning"; const renderAll = () => {};
eval(slice("cpSetTab").replace("function cpSetTab", "var cpSetTab = function"));
cpSetTab("grabs"); ok("Up for Grabs tab edits the grab pool", cpSlot === "grabs");
cpSetTab("lists"); ok("leaving it goes back to a kid list", cpSlot === "chores" && cpTab === "lists");

// Mom HQ doors
const go = slice("momHQGo");
ok("Chores & Stars row → Lists", /case "chorePlan": cpSlot="chores"; cpTab="lists";/.test(go));
ok("Up for Grabs row → its tab", /case "grabs": cpSlot="grabs"; cpTab="grabs";/.test(go));
ok("Click-off Log row → its tab", /case "chores": cpTab="log";/.test(go));

// Getting-started strip: hidden for Howe and once everything is the family's own
global.window = { HA_FAMILY: { familyId: "dewalt" } };
let routineCfg2 = {}, grabs = [], rewardCatalog = []; const esc = x => x;
const strip = eval("(" + slice("_cpSetupStripHTML") + ")");
ok("new family sees ○ for all three", (strip().match(/">○ (Lists|Up for Grabs|Star Store)</g) || []).length === 3);
routineCfg2 = { chores: { caleb: [{ label: "x" }] } }; grabs = [{ label: "g" }];
ok("lists + grabs stocked → ✓ ✓ ○", (strip().match(/">✓ (Lists|Up for Grabs|Star Store)</g) || []).length === 2 && (strip().match(/">○ (Lists|Up for Grabs|Star Store)</g) || []).length === 1);
rewardCatalog = [{ label: "r" }];
ok("all stocked → strip gone", strip() === "");
global.window = {}; routineCfg2 = {}; grabs = []; rewardCatalog = [];
ok("Howe never sees it once lists exist", (routineCfg2 = { morning: { lincoln: [{ label: "x" }] } }, strip()) === "");

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
