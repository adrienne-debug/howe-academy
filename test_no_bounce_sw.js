// NOBOUNCE — no ?_h= bounce when a service worker is in control (2026-11-19, her "go" on step 2 of
// REPORT_phone_battery_2026-11-09.md). The head script used to re-load the page once per tab session to add ?_h=; a
// home-screen app starts a new session every time, so every start downloaded and parsed the page twice. Runs the real
// head script against a fake window.
const fs = require("fs"), path = require("path");
const dir = process.argv[2] || __dirname;
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ " + n + (x !== undefined ? "  → " + JSON.stringify(x) : "")); } };

const m = /<script>\n\/\/ Auto cache bust[\s\S]*?\n(\(function\(\)\{if\(location\.hostname==='localhost'[^\n]*)\n<\/script>/.exec(html);
ok("the head script is still where the Envirothon demo build looks for it (make_demo.js pattern)", !!m);
const src = m ? m[1] : "";
ok("NOBOUNCE note sits right above it", /\/\/ NOBOUNCE \(2026-11-19[\s\S]{0,900}\n\(function\(\)\{if\(location\.hostname==='localhost'/.test(html));
ok("it is the first script in the page (runs before anything else)", html.indexOf("<script") === html.indexOf("<script>\n// Auto cache bust"));

function run(o) {
  o = o || {};
  const ss = Object.assign({}, o.sess || {}); let replaced = null;
  const loc = { hostname: o.host || "adrienne-debug.github.io", href: o.href || "https://adrienne-debug.github.io/howe-academy/", replace(u) { replaced = u; } };
  const nav = o.noSW ? {} : { serviceWorker: o.controller ? { controller: {} } : { controller: null } };
  const sessionStorage = { getItem: k => (k in ss ? ss[k] : null), setItem: (k, v) => { ss[k] = String(v); } };
  const document = { documentElement: { outerHTML: o.outer || "<html><head><title>x</title>" } };
  new Function("location", "navigator", "sessionStorage", "document", "URL", src)(loc, nav, sessionStorage, document, URL);
  return { replaced, ss };
}

console.log("\nwith a service worker in control");
{ const r = run({ controller: true });
  ok("no bounce (the page is already fresh from sw.js)", r.replaced === null, r.replaced);
  ok("ha_h_tried is not set, so the diary reads \"launch\", not \"launch+bounce\"", !("ha_h_tried" in r.ss), r.ss); }
{ const r = run({ controller: true, href: "https://adrienne-debug.github.io/howe-academy/?_h=old" });
  ok("an old ?_h= in a saved link: still no bounce", r.replaced === null, r.replaced); }

console.log("\nwithout one (as before)");
{ const r = run({ controller: false });
  ok("first-ever visit (service worker not in control yet): bounces once, adding ?_h=", !!r.replaced && /[?&]_h=[0-9a-z]+/.test(r.replaced), r.replaced);
  ok("…and marks the tab session", r.ss.ha_h_tried === "1");
  const again = run({ controller: false, sess: r.ss });
  ok("one-shot guard unchanged: a second try in the same session does not bounce", again.replaced === null, again.replaced); }
{ const r = run({ noSW: true });
  ok("a browser with no service worker support bounces as before", !!r.replaced, r.replaced); }
{ const outer = "<html><head><title>x</title>";
  let h = 0; for (let i = 0; i < outer.length; i++) { h = ((h << 5) - h) + outer.charCodeAt(i); h |= 0; } h = Math.abs(h).toString(36);
  const r = run({ controller: false, outer, href: "https://adrienne-debug.github.io/howe-academy/?_h=" + h });
  ok("already on the right ?_h=: no bounce (unchanged)", r.replaced === null, r.replaced); }
{ const r = run({ controller: false, host: "localhost" });
  ok("localhost never bounces (unchanged)", r.replaced === null); }
{ const loc = { hostname: "x.github.io", href: "https://x.github.io/a/", replace(u) { loc.r = u; } };
  const navThrows = {}; Object.defineProperty(navThrows, "serviceWorker", { get() { throw new Error("blocked"); } });
  const ss = {}; new Function("location", "navigator", "sessionStorage", "document", "URL", src)(loc, navThrows, { getItem: k => ss[k] || null, setItem: (k, v) => { ss[k] = v; } }, { documentElement: { outerHTML: "<html>" } }, URL);
  ok("a browser that throws on navigator.serviceWorker: falls back to the old bounce, never a blank page", !!loc.r, loc.r); }

console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
