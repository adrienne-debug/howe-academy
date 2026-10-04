// 🖨 Print = PDF (Adrienne 2026-10-03, every family): the notebook's main buttons make the
// letter-size PDF for the notebook AND the parent guide (Safari ignores @page, so printing the
// page view from an iPad/Mac shrinks or spills pages — the PDF prints right everywhere). The
// page view stays as a small 👁 Look. Run: node test_nb_print_buttons.js
const fs = require("fs");
const src = fs.readFileSync(__dirname + "/index.html", "utf8");
let pass = 0, fail = 0;
function ok(c, name) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name); } }

const pk = src.indexOf("function haNbPickerRows"), pkEnd = src.indexOf("async function haOpenNotebookPicker");
const picker = src.slice(pk, pkEnd);
ok(pk > 0 && pkEnd > pk, "picker rows found");
ok(/haNbPdf\('\$\{k\}','student'\)[^>]*>🖨 Print</.test(picker), "picker: 🖨 Print makes the notebook PDF");
ok(/haNbPdf\('\$\{k\}','parent'\)[^>]*>🖨 Parent</.test(picker), "picker: 🖨 Parent makes the parent-guide PDF");
ok(/haNbOpen\('\$\{k\}','student'\)[^>]*>👁</.test(picker), "picker: 👁 still opens the page view");
ok(picker.indexOf("📓 Notebook") < 0 && picker.indexOf("📄 PDF") < 0, "picker: old Notebook / PDF buttons gone");
ok(picker.indexOf("background:#ea580c") < picker.indexOf("haNbOpen("), "picker: the filled (main) button is the PDF, before the look button");

const rn = src.indexOf("function renderNotebook("), rnEnd = src.indexOf("formHtml+", rn);
const tab = src.slice(rn, rnEnd);
ok(rn > 0 && rnEnd > rn, "Notebook tab block found");
ok(/haNbPdf\(\\''\+sel\+'\\',\\'student\\'\)[^>]*>🖨 Print notebook</.test(tab), "tab: 🖨 Print notebook = notebook PDF");
ok(/haNbPdf\(\\''\+sel\+'\\',\\'parent\\'\)[^>]*>🖨 Print parent guide</.test(tab), "tab: 🖨 Print parent guide = parent PDF");
ok(/haNbOpen\(\\''\+sel\+'\\',\\'student\\'\)[^>]*>notebook</.test(tab) && /haNbOpen\(\\''\+sel\+'\\',\\'parent\\'\)[^>]*>parent guide</.test(tab), "tab: 👁 Look first links still open both page views");
ok(tab.indexOf("📓 Notebook") < 0 && tab.indexOf("📄 PDF") < 0, "tab: old Notebook / PDF buttons gone");

ok(/Printing from Look first only works in Chrome\. On Safari \(iPad, iPhone, Mac\), use 🖨 Print\./.test(tab), "tab: Look-first note says it only prints from Chrome (her ask 10/4)");
ok(/printing from here only works in Chrome; on Safari use 🖨 Print/.test(picker), "picker: 👁 tooltip says the same");

// haNbPdf already handles the parent guide (which==="parent" → out.parent, *_parent.pdf)
const pdf = src.slice(src.indexOf("async function haNbPdf("), src.indexOf("async function haNbCombinedParent"));
ok(/which==="parent"\)\?\(out\.parent\|\|out\.student\)/.test(pdf) && /"parent":"notebook"\)\+"\.pdf"/.test(pdf), "haNbPdf builds the parent guide PDF");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
