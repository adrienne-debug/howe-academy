/*
 * Node tests — 📚 CALSCHOOL (her ask 2026-10-08): the month at a glance gets a 📚 School chip (off until tapped) that lists
 * each kid's lessons per day in the family month, from the same Lesson Map rows the printable calendar reads.
 *   run:  node test_cal_school.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const i = src.indexOf("function " + name + "("); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); } }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const layers = src.slice(src.indexOf("const CAL_LAYERS="), src.indexOf("\n", src.indexOf("const CAL_OPTIN=")));   // + the opt-in list
ok("📚 School is a calendar chip", /\["school","\\u\{1F4DA\} School"\]/.test(layers));
const store = {};
const api = new Function("HA_LS", "renderAll", layers + "\nlet calLayers=null;\n" + slice("_calLayersLoad") + "\n" + slice("calLayerOn") + "\n" + slice("calLayerToggle") + "\nreturn {calLayerOn,calLayerToggle};")({ getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } }, () => {});
ok("School starts OFF; the other layers start on", api.calLayerOn("school") === false && api.calLayerOn("meals") === true);
api.calLayerToggle("school");
ok("one tap turns it on, remembered on this device", api.calLayerOn("school") === true && /"school":true/.test(store.ha_cal_layers));
api.calLayerToggle("school");
ok("tap again → off", api.calLayerOn("school") === false);
const mp = slice("calRenderMonthPreview");
ok("the month reads the School switch (not for a kid's own view)", /school:calLayerOn\("school"\)/.test(mp) && /kidMode\?\{breaks:true,coops:true,events:true,meals:true,dad:false(,habits:false)?\}/.test(mp));
ok("family month + School on → one line per kid with that day's lesson count, in the kid's colour", /if\(!who&&L\.school&&!isWeekend\)\{/.test(mp) && /_calLessonsFor\(k,iso\)\.length/.test(mp) && /col:\(KID_COLOR\[k\]\|\|""\)/.test(mp));
ok("cells make room for the lesson lines", /const MAXL=who\?5:\(L\.school\?6:4\)/.test(mp));
ok("no kid names hard-coded", !/lincoln|ellis|lucy|julian|taylor|caleb|zuri|david/i.test(mp.slice(mp.indexOf("CALSCHOOL"), mp.indexOf("if(who){"))));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
