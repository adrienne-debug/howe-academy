/*
 * Node test for the "one letter per click" bug class (her report 2026-09-21: the Study
 * session Name box lost focus after every keystroke; "we supposedly fixed this once before").
 *
 * The mechanism: an input whose oninput handler ends in a repaint (renderAll & co.) is
 * REBUILT on every keystroke. renderAll's _preserveUI restores focus + caret — but only for
 * inputs that carry an id. So the rule this file enforces, across the WHOLE app:
 *
 *     every <input>/<textarea> whose oninput/onkeyup calls a repainting function has an id,
 *     and no two of them share one.
 *
 *   run:  node test_input_focus.js [path/to/index.html]
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(process.argv[2] || path.join(__dirname, "index.html"), "utf8");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// Body of a top-level `function name(` up to the next top-level function.
function bodyOf(name) {
  const m = new RegExp("\\nfunction\\s+" + name.replace(/\$/g, "\\$") + "\\s*\\(").exec(src);
  if (!m) return null;
  const j = src.indexOf("\nfunction ", m.index + 10);
  return src.slice(m.index, j > 0 ? j : m.index + 4000);
}
const REPAINT = /\b(renderAll|renderMastery|_mastRerender|renderSchedule|renderMomsDay|renderMomsPlan|renderNotebook|renderHistory)\s*\(/;
// PIN boxes repaint only once the PIN is complete and correct — the box is gone by then.
const PIN_OK = /^(checkAdminPin|checkMomPin|checkPtsPin|mastAdminCheckPin|pnwCheckPin)$/;

const found = [];
const tagRe = /<(input|textarea)\b[^>]*?\bon(?:input|keyup)=\\?"([^"]*?)\\?"[^>]*/g;
let m;
while ((m = tagRe.exec(src))) {
  const tag = m[0], handler = m[2].replace(/\\'/g, "'");
  const fn = /^\s*([A-Za-z_$][\w$]*)\s*\(/.exec(handler);
  const name = fn ? fn[1] : null;
  const body = name ? bodyOf(name) : null;
  const inlineRepaint = REPAINT.test(handler);
  const repaints = inlineRepaint || !!(body && REPAINT.test(body));
  const idm = /\bid=\\?["']([^"'\\]+)/.exec(tag);
  found.push({ line: src.slice(0, m.index).split("\n").length, name: name || handler.slice(0, 40), repaints, id: idm ? idm[1] : null });
}

console.log("typing handlers found on <input>/<textarea>: " + found.length);
ok("the scan actually sees the app's typing fields (sanity)", found.length >= 20, found.length);

const risky = found.filter(f => f.repaints && !PIN_OK.test(f.name));
console.log("…of which repaint on every keystroke: " + risky.length + "  [" + risky.map(f => f.name + "@" + f.line).join(", ") + "]");
risky.forEach(f => ok("line " + f.line + " " + f.name + " — repainting input has an id (focus survives)", !!f.id, f));

const ids = risky.map(f => f.id).filter(Boolean);
ok("no two repainting inputs share an id", new Set(ids).size === ids.length, ids);
ids.forEach(id => {
  const n = src.split('id="' + id + '"').length - 1;
  ok('id "' + id + '" appears exactly once in the app', n === 1, n);
});

// The mechanism the ids rely on must still be there, and still keyed on the id.
const pres = bodyOf("_preserveUI") || "";
ok("_preserveUI still restores focus by id", /focusId/.test(pres) && /getElementById\(focusId\)/.test(pres) && /\.focus\(/.test(pres));
ok("_preserveUI still restores the caret", /setSelectionRange/.test(pres));
ok("renderAll still runs through _preserveUI", /_preserveUI\(_renderAllInner\)/.test(bodyOf("renderAll") || ""));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
