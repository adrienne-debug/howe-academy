// ☑ Worksheet "check all that apply" questions (her ask 2026-10-03): q.multi → checkboxes, answer stays ONE string.
const fs = require("fs"), path = require("path");
const s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(msg, cond){ if(cond){ pass++; } else { fail++; console.log("FAIL:", msg); } }
function slice(name){ const i = s.indexOf("function " + name + "("); let d = 0, j = s.indexOf("{", i); for(; j < s.length; j++){ if(s[j] === "{") d++; else if(s[j] === "}"){ d--; if(!d) break; } } return s.slice(i, j + 1); }
eval(slice("wsMultiList") + slice("wsMultiToggle"));

const kids = ["Taylor", "Makenzie", "Andrew", "Caleb"];
let p = "";
p = wsMultiToggle(kids, p, "Andrew"); ok("first check", p === "Andrew");
p = wsMultiToggle(kids, p, "Taylor"); ok("kept in option order, one string", p === "Taylor, Andrew");
p = wsMultiToggle(kids, p, "Caleb"); ok("third", p === "Taylor, Andrew, Caleb");
p = wsMultiToggle(kids, p, "Andrew"); ok("uncheck removes only that one", p === "Taylor, Caleb");
p = wsMultiToggle(kids, wsMultiToggle(kids, p, "Taylor"), "Caleb"); ok("unchecking the last clears the answer", p === "");
ok("list reads the string back", JSON.stringify(wsMultiList("Taylor, Caleb")) === '["Taylor","Caleb"]' && wsMultiList(undefined).length === 0);

ok("render: checkbox square for multi", /border-radius:'\+\(q\.multi\?'4px':'50%'\)\+'/.test(slice("wsRender")));
ok("render: a multi box is on when its name is in the answer", /const on=q\.multi\?wsMultiList\(a\.pick\)\.indexOf\(o\)>=0:a\.pick===o;/.test(slice("wsRender")));
ok("render: says check all that apply", /\(check all that apply\)/.test(slice("wsRender")));
ok("pick: multi toggles, single still replaces", /qq\.multi\?wsMultiToggle\(o,wsAns\(w,i\)\.pick,o\[k\]\):o\[k\]/.test(slice("wsPick")));

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
