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

ok("render: checkbox square for multi (via wsIsMulti)", /border-radius:'\+\(wsIsMulti\(q\)\?'4px':'50%'\)\+'/.test(slice("wsRender")));
ok("render: a multi box is on when its name is in the answer (via wsIsMulti)", /const on=wsIsMulti\(q\)\?wsMultiList\(a\.pick\)\.indexOf\(o\)>=0:a\.pick===o;/.test(slice("wsRender")));
ok("render: says check all that apply", /\(check all that apply\)/.test(slice("wsRender")));
ok("pick: multi toggles, single still replaces (via wsIsMulti)", /wsIsMulti\(qq\)\?wsMultiToggle\(o,wsAns\(w,i\)\.pick,o\[k\]\):o\[k\]/.test(slice("wsPick")));

// (summary printed at the end)
// (exit moved to the end, 2026-10-24)

// WSMULTIWORDS (2026-10-24, Sara's units worksheet Q3–5): a question whose words ask for several picks is multi even without the flag.
eval(slice("wsIsMulti"));
const O = ["a","b","c"];
ok("multi:true → multi", wsIsMulti({q:"Which one?", options:O, multi:true}) === true);
ok("multi:false forces one pick even if the words say 'all that apply'", wsIsMulti({q:"Pick all that apply", options:O, multi:false}) === false);
ok("Sara's Q3: 'Pick all that apply and add anything missing.' → multi", wsIsMulti({q:"What would a finished unit need to contain for you to call it done? Pick all that apply and add anything missing.", options:O}) === true);
ok("Sara's Q4: 'Pick all that apply and say which matter most.' → multi", wsIsMulti({q:"Where does your material come from today? Pick all that apply and say which matter most.", options:O}) === true);
ok("Sara's Q5: 'Rank your top two.' → multi", wsIsMulti({q:"How would you want to feed it in? Rank your top two.", options:O}) === true);
ok("'check all that apply' / 'select all' / 'more than one' → multi", ["Check all that apply","Select all you use","You can pick more than one"].every(t=>wsIsMulti({q:t, options:O})));
ok("an ordinary question stays single", wsIsMulti({q:"How would you want to check them?", options:O}) === false);
ok("no options or one option → never multi", wsIsMulti({q:"Pick all that apply"}) === false && wsIsMulti({q:"Pick all that apply", options:["x"]}) === false);
ok("the renderer and the pick both ask wsIsMulti (no raw q.multi left)", (s.match(/wsIsMulti\(q\)/g)||[]).length >= 3 && /wsIsMulti\(qq\)\?wsMultiToggle/.test(s) && !/[^.]q\.multi\?/.test(s.slice(s.indexOf("function wsRender("), s.indexOf("function wsSave("))));
console.log(pass + " passed, " + fail + " failed"); if (fail) process.exit(1);
