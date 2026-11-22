// 🔗 UACTLINK — a Web link activity (slice 3 of PLAN_unit_activity_types_2026-11-19; a beta mom 2026-11-20: "The kids can open the
//   ones I mark OK" = §5 Q2; Adrienne 2026-11-22 "go with her answers and build").
//   Runs the REAL UNITTRACK + UTADDACT + UACTKIND + UACTLINK + DAYCARD blocks against a fake db that records paths.
//   · the box: an address (https only) + "Kids may open it alone" (off); + Add → url (+ kidOpen only when ticked) in the one update
//   · ✎ writes only …/url and …/kidOpen, only when changed; a bad address writes nothing (a toast says why)
//   · Today's card: Mom and the board always get "🔗 Open: <title>" (▶ purple for a video); a kid's device only with the tick,
//     otherwise "👩 Mom opens it"; opening never marks done
//   · no link → the card byte-identical to the tree minus UACTLINK; not Mom / dry run → nothing written
//   run: node test_unit_act_link.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const UT = cut("// UNITTRACK_START", "// UNITTRACK_END"), AA = cut("// UTADDACT_START", "// UTADDACT_END"), DC = cut("// DAYCARD_START", "// DAYCARD_END");
const KIND = cut("// UACTKIND_START", "// UACTKIND_END"), BLK = cut("// UACTLINK_START", "// UACTLINK_END") + "// UACTLINK_END\n";
const PRINT = src.indexOf("// UACTPRINT_START") >= 0 ? cut("// UACTPRINT_START", "// UACTPRINT_END") : "";   // 🖨 (slice 4) draws its box beside 🔗's — loaded so the id checks see the whole box
const SIGN = ["_unitActs", "_nbActKeys", "_nbActWrite", "_nbActRemove", "unitActPoints", "unitActivityClaim", "unitActivityDone"].map(fn).join("\n");
const LR = "const LR_PARTS=[\"links\",\"supplies\",\"books\",\"orders\",\"notes\"];\n" + ["lrSafeUrl", "lrList", "lrStr", "lrDate", "lrClean", "lrHost"].map(fn).join("\n");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 500) : "")); } };
const J = x => JSON.stringify(x);
const visible = h => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const UNIT = () => ({ id: "harv", title: "Harvest", emoji: "🌾", enrolled: { k1: true, k2: true }, decks: [],
  activities: [
    { key: "corn_maze", title: "Draw a corn maze", emoji: "🎨", kind: "sheet", points: 5, day: 2 },
    { key: "farm_tour", title: "Farm tour", emoji: "🎨", kind: "sheet", points: 3, day: 2, type: "link", url: "https://example.org/farm-tour" },
    { key: "pumpkin_song", title: "Pumpkin song", emoji: "🎨", kind: "sheet", points: 2, day: 3, type: "link", url: "https://www.youtube.com/watch?v=abc", kidOpen: true }],
  track: { mode: "seq", perWeek: 4, days: [{ id: "d1", n: 1, t: "Fields" }, { id: "d2", n: 2, t: "Mazes", nb: { activity: "corn_maze" } }, { id: "d3", n: 3, t: "Songs", nb: { activity: "pumpkin_song" } }] } });
function world(o) {
  o = o || {}; const writes = [], toasts = []; const dom = o.dom || {};
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, Promise, Error, parseInt, isNaN, isFinite, WeakMap, URL,
    unitStudies: { harv: o.unit || UNIT() }, ROSTER: ["k1", "k2"], KID_NAME: { k1: "Ada", k2: "Ben" }, kcKid: o.kcKid || "",
    momHere: () => ctx.MOM, MOM: o.mom !== false, _dryRun: () => !!o.dry, gwShowToast: m => toasts.push(m), bankDirect: () => {}, confirm: () => true,
    db: { ref: p => ({ set: v => writes.push(["set", p === undefined ? "" : p, JSON.parse(J(v === undefined ? null : v))]), update: v => writes.push(["update", p === undefined ? "" : p, JSON.parse(J(v))]), remove: () => writes.push(["remove", p]), transaction: () => {}, child: () => null }) },
    renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0, document: { getElementById: id => (id in dom) ? dom[id] : null } };
  vm.createContext(ctx);
  vm.runInContext(LR + "\n" + UT + "\n" + AA + "\n" + KIND + "\n" + (o.before ? "" : BLK) + "\n" + PRINT + "\n" + DC + "\n" + SIGN + "\n" + fn("ubSlug"), ctx);
  return { ctx, writes, toasts, dom };
}
const G = (c, id) => ({ day: c.utRef("harv", c.utDay(c.unitStudies.harv, id)), u: c.unitStudies.harv, first: null, present: [] });
const A1 = "unitStudies/harv/activities/3";
const box = (line, url, kid) => ({ "utaa-harv-d1-line": { value: line }, "utaa-harv-d1-url": { value: url || "" }, "utaa-harv-d1-kidopen": { checked: !!kid }, "uak-harv-d1-box-link": { style: {} } });

console.log("── the block ──");
ok("UACTLINK is a marked block right after UACTKIND", BLK.length > 1500 && src.indexOf("// UACTLINK_START") === src.indexOf("// UACTKIND_END") + "// UACTKIND_END\n".length);
ok("the card hook sits in each activity row, before the ✓ chips, typeof-guarded", DC.split('+((typeof uakCardHTML==="function")?uakCardHTML(g,act):"")+dcActChecksHTML(g,act)').length === 2);
ok("the block never touches db itself (UTADDACT's one update carries the fields)", !/db\.|\.ref\(|\.set\(|\.update\(|\.remove\(/.test(BLK.replace(/^\s*\/\/.*$/mg, "")));
ok("no family names, no 🔀", BLK.indexOf("\u{1F500}") < 0 && !/Lincoln|Ellis|Lucy|Julian|Sara\b|DeWalt|taylor|makenzie|andrew|caleb/i.test(BLK));
{
  const c = world().ctx;
  ok("https only: http, javascript:, data:, bare https://, spaces, quotes, no dot, > 500 letters → refused",
    ["http://example.org", "javascript:alert(1)", "data:text/html,x", "https://", "https://exa mple.org", "https://example.org/\"x", "https://localhost", "https://example.org/" + "a".repeat(500), "", null].every(u => c.uakUrl(u) === ""));
  ok("…a real https address (trimmed) is kept", c.uakUrl("  https://example.org/a?b=1#c ") === "https://example.org/a?b=1#c" && c.uakUrl("HTTPS://Example.org") === "HTTPS://Example.org");
}

console.log("\n── the box ──");
{
  const w = world({ dom: box("x") }); const c = w.ctx, u = c.unitStudies.harv;
  const h = c.utaaEditorHTML(u, c.utDay(u, "d1"));
  ok("+ Add box: the address row is there, hidden while 📓 is picked; tick off", /id="uak-harv-d1-box-link" data-uak-kind="link" style="display:none/.test(h) && /id="utaa-harv-d1-url" type="url"/.test(h) && /id="utaa-harv-d1-kidopen" type="checkbox">/.test(h) && /Kids may open it alone/.test(h));
  c.uakPick("harv-d1", "link"); ok("tapping 🔗 shows it in place (no full render)", w.dom["uak-harv-d1-box-link"].style.display === "block" && c.repaints === 0);
  c.uakPick("harv-d1", "screen"); ok("tapping another kind hides it again", w.dom["uak-harv-d1-box-link"].style.display === "none");
  ok("a render with 🔗 picked draws it open", (c.uakPick("harv-d1", "link"), /id="uak-harv-d1-box-link" data-uak-kind="link" style="display:block/.test(c.utaaEditorHTML(u, c.utDay(u, "d1")))));
  const e = c.utaaEditorHTML(u, c.utDay(u, "d3"));
  ok("✎ on a 🔗 activity: 🔗 pressed, its address and tick filled in", /id="uak-harv-d3-link" aria-pressed="true"/.test(e) && /value="https:\/\/www.youtube.com\/watch\?v=abc"/.test(e) && /id="utaa-harv-d3-kidopen" type="checkbox" checked>/.test(e) && /data-uak-kind="link" style="display:block/.test(e));
  ok("the address row fits a phone (full width, no fixed px width)", /id="utaa-harv-d1-url" type="url"[^>]*width:100%;box-sizing:border-box/.test(h));
}

console.log("\n── + Add ──");
{
  const w = world({ dom: box("Farm video | 4 | Watch it, then tell Mom one thing") }); w.ctx.uakPick("harv-d1", "link");
  ok("🔗 with no address: refused, nothing written, a toast says why, the pick stays", w.ctx.utaaAdd("harv", "d1") === false && w.writes.length === 0 && /https:\/\//.test(w.toasts[0] || "") && vm.runInContext("uakPicked", w.ctx)["harv-d1"] === "link" && w.ctx.unitStudies.harv.activities.length === 3);
  w.dom["utaa-harv-d1-url"].value = "http://example.org/farm";
  ok("🔗 with an http address: refused the same way", w.ctx.utaaAdd("harv", "d1") === false && w.writes.length === 0);
  w.dom["utaa-harv-d1-url"].value = " https://example.org/farm ";
  ok("🔗 with https, tick off: ONE update, the record + type link + url, no kidOpen", w.ctx.utaaAdd("harv", "d1") === true && w.writes.length === 1 &&
    J(w.writes[0][2][A1]) === J({ key: "farm_video", title: "Farm video", emoji: "🎨", kind: "sheet", points: 4, day: 1, desc: "Watch it, then tell Mom one thing", url: "https://example.org/farm", type: "link" }) && J(Object.keys(w.writes[0][2]).sort()) === J([A1, "unitStudies/harv/track/days/0/nb"].sort()), w.writes);
}
{
  const w = world({ dom: box("Farm video | 4", "https://example.org/farm", true) }); w.ctx.uakPick("harv-d1", "link"); w.ctx.utaaAdd("harv", "d1");
  ok("ticked: kidOpen:true rides along", w.writes.length === 1 && w.writes[0][2][A1].kidOpen === true && w.writes[0][2][A1].url === "https://example.org/farm");
}
{
  const w = world({ dom: box("Salt crystals | 5", "https://example.org/salt", true) }); w.ctx.uakPick("harv-d1", "hands"); w.ctx.utaaAdd("harv", "d1");
  ok("another kind ignores the address box (no url, no kidOpen written)", w.writes.length === 1 && !("url" in w.writes[0][2][A1]) && !("kidOpen" in w.writes[0][2][A1]) && w.writes[0][2][A1].type === "hands");
}
{
  const w = world({ dry: true, dom: box("Farm video | 4", "https://example.org/farm") }); w.ctx.uakPick("harv-d1", "link"); w.ctx.utaaAdd("harv", "d1");
  ok("dry run: nothing written; the screen copy has the link", w.writes.length === 0 && w.ctx.unitStudies.harv.activities[3].url === "https://example.org/farm");
  const k = world({ mom: false, dom: box("Farm video | 4", "https://example.org/farm") }); vm.runInContext("uakPicked", k.ctx)["harv-d1"] = "link"; k.ctx.utaaAdd("harv", "d1");
  ok("not Mom: nothing written", k.writes.length === 0 && k.ctx.unitStudies.harv.activities.length === 3);
}

console.log("\n── ✎ Save ──");
{
  const dom = { "utaa-harv-d3-title": { value: "Pumpkin song" }, "utaa-harv-d3-points": { value: "2" }, "utaa-harv-d3-desc": { value: "" }, "utaa-harv-d3-url": { value: "https://www.youtube.com/watch?v=abc" }, "utaa-harv-d3-kidopen": { checked: true } };
  const w = world({ dom }); const c = w.ctx, a = () => c.unitStudies.harv.activities[2], P = "unitStudies/harv/activities/2/";
  c.utaaEdit("harv", "d3"); ok("nothing changed → no write", w.writes.length === 0);
  dom["utaa-harv-d3-url"].value = "https://www.youtube.com/watch?v=xyz"; c.utaaEdit("harv", "d3");
  ok("a new address → ONE update of only …/url", J(w.writes) === J([["update", "", { [P + "url"]: "https://www.youtube.com/watch?v=xyz" }]]), w.writes);
  w.writes.length = 0; dom["utaa-harv-d3-kidopen"].checked = false; c.utaaEdit("harv", "d3");
  ok("untick → only …/kidOpen = null (the field goes)", J(w.writes) === J([["update", "", { [P + "kidOpen"]: null }]]) && !("kidOpen" in a()), w.writes);
  w.writes.length = 0; dom["utaa-harv-d3-kidopen"].checked = true; c.utaaEdit("harv", "d3");
  ok("tick → only …/kidOpen = true", J(w.writes) === J([["update", "", { [P + "kidOpen"]: true }]]) && a().kidOpen === true);
  w.writes.length = 0; dom["utaa-harv-d3-url"].value = "http://bad.example"; dom["utaa-harv-d3-title"].value = "Changed title"; w.toasts.length = 0;
  ok("a bad address: refused whole — nothing written, the title not changed on screen either", c.utaaEdit("harv", "d3") === false && w.writes.length === 0 && a().title === "Pumpkin song" && w.toasts.length === 1);
  dom["utaa-harv-d3-url"].value = "https://www.youtube.com/watch?v=xyz"; dom["utaa-harv-d3-title"].value = "Pumpkin song"; w.writes.length = 0;
  c.uakPick("harv-d3", "screen"); c.utaaEdit("harv", "d3");
  ok("switching a 🔗 to 📱: only …/type; the address stays on the record (switch back = no retyping)", J(w.writes) === J([["update", "", { [P + "type"]: "screen" }]]) && a().url === "https://www.youtube.com/watch?v=xyz");
}

console.log("\n── Today's card ──");
const row = (h, t) => { const i = h.indexOf(t); return i < 0 ? "" : h.slice(i, (h.indexOf("data-dc-actchk", i) + 1 || h.length + 1) - 1); };
{
  const M = world(); const h = M.ctx.dcDayHTML(G(M.ctx, "d2"));
  ok("Mom: Day 2 lists both activities; the 🔗 row has the button after its title, before its chips", h.indexOf("Today’s activities") > 0 && /data-uak-link="open"/.test(row(h, "Farm tour")) && h.indexOf('data-uak-link="open"') < h.lastIndexOf("data-dc-actchk"));
  ok("…it opens the address in a new tab, noopener, label \"🔗 Open: Farm tour\" (blue: not a video)", /<a href="https:\/\/example.org\/farm-tour" target="_blank" rel="noopener noreferrer" style="[^"]*background:#1d4ed8[^"]*">🔗 Open: Farm tour<\/a>/.test(h), row(h, "Farm tour"));
  ok("…the notebook activity's row has no button", !/data-uak-link/.test(row(h, "Draw a corn maze")));
  const h3 = M.ctx.dcDayHTML(G(M.ctx, "d3")); ok("a YouTube address → purple ▶", /background:#7c3aed[^"]*">▶ Open: Pumpkin song<\/a>/.test(h3));
}
{
  const K = world({ mom: false, kcKid: "k1" }); const h = K.ctx.dcDayHTML(G(K.ctx, "d2"));
  ok("a kid's device, not ticked: \"👩 Mom opens it\", no address anywhere on the card", /data-uak-link="mom"[^>]*>👩 Mom opens it</.test(h) && h.indexOf("example.org/farm-tour") < 0, row(h, "Farm tour"));
  const h3 = K.ctx.dcDayHTML(G(K.ctx, "d3")); ok("a kid's device, ticked: the button", /data-uak-link="open"/.test(h3) && h3.indexOf("youtube.com/watch?v=abc") > 0 && h3.indexOf("Mom opens it") < 0);
  K.ctx.MOM = true; ok("the same device in Mom mode: the button", /data-uak-link="open"/.test(K.ctx.dcDayHTML(G(K.ctx, "d2"))));
  const B = world({ mom: false }); ok("the big screen (no kid picked, not Mom): the button", /data-uak-link="open"/.test(B.ctx.dcDayHTML(G(B.ctx, "d2"))));
}
{
  const u = UNIT(); u.activities[1].url = "javascript:alert(1)"; const w = world({ unit: u }); const h = w.ctx.dcDayHTML(G(w.ctx, "d2"));
  ok("a stored address that is not https never draws", !/data-uak-link/.test(h) && h.indexOf("javascript:") < 0);
  const u2 = UNIT(); u2.activities[0].url = "https://example.org/x"; const w2 = world({ unit: u2 });
  ok("an address on a 📓 activity draws nothing (only 🔗 opens)", !/data-uak-link/.test(row(w2.ctx.dcDayHTML(G(w2.ctx, "d2")), "Draw a corn maze")));
  const w3 = world(); w3.ctx.dcDayHTML(G(w3.ctx, "d2")); ok("drawing the card writes nothing (opening never marks done)", w3.writes.length === 0);
}
{
  const u = UNIT(); u.activities = u.activities.filter(a => !a.type); const A = world({ unit: u }), B = world({ unit: JSON.parse(J(u)), before: true });
  ok("no link on the day: the card byte-identical to the tree minus UACTLINK (Mom)", A.ctx.dcDayHTML(G(A.ctx, "d2")) === B.ctx.dcDayHTML(G(B.ctx, "d2")));
  const C = world({ unit: JSON.parse(J(u)), mom: false, kcKid: "k1" }), D = world({ unit: JSON.parse(J(u)), mom: false, kcKid: "k1", before: true });
  ok("…and on a kid's device", C.ctx.dcDayHTML(G(C.ctx, "d2")) === D.ctx.dcDayHTML(G(D.ctx, "d2")));
}

console.log("\n── element ids: unique, as a browser needs them ──");
{
  const ids = h => [...h.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  const dup = L => L.filter((x, i) => L.indexOf(x) !== i);
  const c = world().ctx, u = c.unitStudies.harv;
  const hNew = c.utaaEditorHTML(u, c.utDay(u, "d1")), hLink = c.utaaEditorHTML(u, c.utDay(u, "d3"));
  const pNew = c.uakPickerHTML("harv-d1", null), pLink = c.uakPickerHTML("harv-d3", u.activities[2]);
  ok("the picker alone (a new box): every id unique", ids(pNew).length >= 8 && dup(ids(pNew)).length === 0, dup(ids(pNew)));
  ok("the picker alone (an existing 🔗 activity): every id unique", ids(pLink).length >= 8 && dup(ids(pLink)).length === 0, dup(ids(pLink)));
  ok("the whole day-editor box (+ Add and ✎ on 🔗): every id unique — chips, the kind's box and the utaa-… inputs", ids(hNew).length >= 9 && dup(ids(hNew)).length === 0 && ids(hLink).length >= 11 && dup(ids(hLink)).length === 0, [dup(ids(hNew)), dup(ids(hLink))]);
  ok("the 🖨 box (when the tree has it) is in the same box with its own ids", !PRINT || ["uak-harv-d1-box-print", "utaa-harv-d1-onecopy", "uap-st-harv-d1"].every(x => ids(hNew).indexOf(x) >= 0) && dup(ids(hNew)).length === 0);
  ok("no chip id is reused by any input or box", (() => { const chips = ids(hLink).filter(x => /^uak-harv-d3-(notebook|screen|print|link|hands)$/.test(x)); return chips.length === 5 && ids(hLink).filter(x => chips.indexOf(x) >= 0).length === 5; })());
  // a browser-like document: every element the HTML draws, getElementById = the FIRST with that id
  const browser = h => { const els = []; for (const m of h.matchAll(/<(\w+)\b([^>]*)>/g)) { const id = (m[2].match(/\bid="([^"]+)"/) || [])[1]; if (!id) continue; const st = (m[2].match(/\bstyle="([^"]*)"/) || [])[1] || ""; const disp = (st.match(/display:(\w+)/) || [])[1] || ""; els.push({ id, tag: m[1], style: { display: disp }, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, value: "", checked: false }); } return { els, getElementById: id => els.find(e => e.id === id) || null }; };
  const w = world(); const cc = w.ctx, uu = cc.unitStudies.harv; const doc = browser(cc.utaaEditorHTML(uu, cc.utDay(uu, "d1"))); cc.document = doc;
  const chip = doc.getElementById("uak-harv-d1-link"), boxEl = doc.els.find(e => e.tag === "div" && e.id === "uak-harv-d1-box-link");
  ok("browser-like document: the 🔗 chip and the address box are two different elements", !!chip && chip.tag === "button" && !!boxEl && chip !== boxEl);
  cc.uakPick("harv-d1", "link");
  ok("…tapping 🔗 reveals the address box and leaves the 🔗 chip showing", !!boxEl && !!chip && boxEl.style.display === "block" && chip.style.display === "" && chip.attrs["aria-pressed"] === "true");
  cc.uakPick("harv-d1", "screen");
  ok("…tapping 📱 hides the box, the 🔗 chip still showing (not pressed)", !!boxEl && !!chip && boxEl.style.display === "none" && chip.style.display === "" && chip.attrs["aria-pressed"] === "false");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
