/*
 * test_house_card_anywhere.js — HCGO: a ✎ on a chore OUTSIDE the Household page opens that chore's card (DESIGN_household_rooms_2026-11-15
 * §14, her rule 2026-11-18: "whenever there is a [chore], it to be clickable and editable, and that edit reflects everywhere that it is";
 * her "all go" 2026-11-18, piece 2). The WHOLE app per device (test_fixtures/house_world.js, house_overflow_world.js: one in-memory
 * Firebase, one virtual clock, the made-up family kid_a … kid_d) against main (git show 9cd01552:index.html; house.js is unchanged).
 * The places: 🏡 My day on Mom's Day and on Dad's Day (_mcRow), a kid's list as Mom's / Dad's Day open it (boardStatPop), and a kid's
 * 🙌 Up for Grabs as Mom sees it (_grabsHTML with the switch on, hdGrabsHTML's ×2 offers with the plan ON).
 *   A  Mom: a ✎ on every row that is a row of household/jobs (its id = the chore the row shows) and on no other row; never in a
 *      kid's own Up for Grabs view (momView false), which Up for Grabs' switch compares before and after (A2)
 *   B  a tap: house.js not loaded before, ONE <script> after; the Household page opens with that exact card, on its room; ✕ leaves her
 *      in that room; nothing written; with house.js already there it opens at once; a pop-up it came from is closed
 *   C  every existing tap is main's: same handlers in the same order, ✎ never inside a tap; each one run in a branch and a main world
 *      writes the same and leaves the same database
 *   D  a name typed on the card shows on the place, on the chore's room page and on another of Mom's devices
 *   E  not Mom (a kid's device; Mom's device out of Mom mode; Mom mode on Kids' Corner): every place byte for byte main's
 *   F  Take over off, the old Up for Grabs pool, a family with no table: no ✎, byte for byte main's
 *   G  6 days with check-offs, grabs and Mom's ticks, the ✎ drawn but never tapped: every list, every write and the database = main's
 *   H  hcGo refuses (no move, no write) for not Mom, for an id not in the table, and with Take over off
 *   BASE_HTML=/path/to/main/index.html node test_house_card_anywhere.js    HOUSE_INDEX=<a copy> → the branch side (a mutation check)
 */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js")), OV = require(path.join(__dirname, "test_fixtures", "house_overflow_world.js"));
const HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8"), IDX = process.env.HOUSE_INDEX || path.join(__dirname, "index.html");
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
let BASE = process.env.BASE_HTML;
if (!BASE) { try { const b = cp.execSync("git show 9cd01552:index.html", { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }); BASE = path.join(os.tmpdir(), "hcgo_base_" + process.pid + ".html"); fs.writeFileSync(BASE, b); cp.execSync("git diff 2faffd06 ba14133b -- index.html | patch -s -p1 " + BASE, { cwd: __dirname, stdio: ["pipe", "ignore", "ignore"] }); } catch (e) { BASE = null; } }   // main then + CHOREWAIT (its lists drop missed chores now)
console.log("(main: " + (BASE || "none — git show failed; the checks against main are skipped") + ")");
const J = o => JSON.stringify(o), KIDS = ["kid_a", "kid_b", "kid_c", "kid_d"], SLOTS = ["morning", "afternoon", "chores", "evening"];
const ED = /<span onclick="event\.stopPropagation\(\);hcGo\('([^']*)'\)" title="Edit this chore" style="[^"]*">✎<\/span>/g;
const strip = h => h.replace(ED, ""), ids = h => [...h.matchAll(ED)].map(m => m[1]);
const dOf = n => new Date(2026, 10, 16 + n), go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const tick = () => new Promise(r => setImmediate(r));
// let the page settle: the Household page waits for the chore history once (rlHistReady — every door does, main's 🧹 Household tab
// too), then the browser's renderAll draws it again. This sandbox's renderAll does not repaint Mom's Day (checked: main's own door
// stays on "Loading chore history…" here too), so once the history is in, hhRender stands in for that repaint.
const settle = async (w, d) => { for (let i = 0; i < 4; i++) { await tick(); await w.flush(); } if (d.run("_rlWin.full") && d.run("mpSubView") === "house") d.run("hhRender();1"); };
// worlds: "plan" = Take over on, plan ON, three chores that fit nobody (×2 offers), the Up for Grabs switch on; "lists" = Take over on,
// plan off (rotations by the old wheel), switch on; "old" = the switch off; "off" = Take over off; "none" = no table at all
const sw = h => { h.meta.grabs = { on: 1 }; };
async function mk(kind, index) {
  let w;
  if (kind === "plan") w = await OV.world("saved", "on", { index, extra: sw });
  else if (kind === "old") w = await OV.world("saved", "on", { index });
  else if (kind === "lists") w = await OV.world("saved", "off", { index, extra: sw });
  else if (kind === "off") w = await OV.world("saved", "on", { index, extra: h => { sw(h); delete h.meta.takeover; } });
  else w = await W.world({ index, household: { meta: {} } });
  await go(w, 2, 9, 0); return w;   // Wed 11/18, 9 AM (Wednesday: the bathrooms zone)
}
// a device: Mom ("mom"), Mom's device out of Mom mode ("momoff"), Mom mode on Kids' Corner ("kc"), a kid's ("kid")
async function dev(w, who, name) {
  const d = w.boot(name || ("D" + w.devs.length), "dev" + (name || w.devs.length), { mom: who !== "kid" }); await w.flush();
  d.run("globalThis.__pop='';globalThis.__tags=[];document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };document.head.appendChild=function(c){ __tags.push(c); c.parentNode=document.head; return c; };1");
  d.run(who === "momoff" ? "haMomOff();tab='moms-plan';1" : who === "kc" ? "tab='kids';1" : "tab='moms-plan';1"); return d;
}
const R = (d, e) => JSON.parse(d.run("JSON.stringify((function(){ " + e + " })())"));
// every place, drawn now on this device
function places(d) {
  const o = {};
  o.momStrip = d.run("momDayStripHTML(_todayStr(),mdTodayName())"); o.dadStrip = d.run("momDayStripHTML(_todayStr(),mdTodayName(),'dad')");
  o.momRows = R(d, "const P=mdMine('mom'); return Object.keys(P.list).map(function(k){ return [k,_mcRow(k,P.list[k],_todayStr())]; });");
  o.dadRows = R(d, "const P=mdMine('dad'); return Object.keys(P.list).map(function(k){ return [k,_mcRow(k,P.list[k],_todayStr(),P)]; });");
  o.pops = {}; KIDS.forEach(k => SLOTS.forEach(s => { o.pops[k + "/" + s] = d.run("__pop='';boardStatPop('" + k + "','" + s + "',mdTodayName());__pop"); }));
  o.grabs = KIDS.map(k => d.run("_grabsHTML('" + k + "',true)")); o.grabsKid = KIDS.map(k => d.run("_grabsHTML('" + k + "',false)"));
  o.x2 = KIDS.map(k => d.run("hdGrabsHTML('" + k + "',true)"));
  return o;
}
const flat = p => [p.momStrip, p.dadStrip].concat(p.momRows.map(x => x[1]), p.dadRows.map(x => x[1]), Object.values(p.pops), p.grabs, p.grabsKid, p.x2).map(h => typeof h === "string" ? h.replace(/<span style="font-size:9\.5px;font-weight:700;color:#9ca3af;white-space:nowrap">[^<]*<\/span>/g, "") : h);   // 🚪 PLANDAYS: a plan row's days tag shows its own days now (not main's wk:<today>)
const allIds = p => flat(p).reduce((a, h) => a.concat(ids(h)), []);
// the onclick handlers of an HTML string, in order
const unq = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const handlers = h => [...h.matchAll(/onclick="([^"]*)"/g)].map(m => unq(m[1]));
// is any ✎ inside an element that has its own tap (other than the pop-up's shell)?
function edInsideTap(h) { const st = [], bad = [], VOID = /^(input|br|img|hr|meta|link)$/i;
  for (const m of h.matchAll(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g)) { const [, cl, tag, at] = m;
    if (cl) { for (let i = st.length - 1; i >= 0; i--) if (st[i].tag === tag) { st.length = i; break; } continue; }
    if (VOID.test(tag) || /\/$/.test(at)) continue;
    if (/hcGo\(/.test(at)) { const anc = st.filter(e => /onclick=/.test(e.at) && !/onclick="(event\.stopPropagation\(\)|boardStatPopClose\(\))"/.test(e.at)); if (anc.length) bad.push(anc.map(e => e.at.slice(0, 90))); }
    st.push({ tag, at }); }
  return bad; }
const run = (d, h) => d.run("(function(event){ " + h + " }).call({value:''},{stopPropagation:function(){},preventDefault:function(){},target:null})");

(async () => {
const J0 = w => w.get("household/jobs") || {};
const lab = j => (j.emoji ? j.emoji + " " : "") + j.label;

// ── A ──
console.log("\n── A · Mom: a ✎ on every row of the table, the chore it shows, and on no other row ──");
for (const kind of ["plan", "lists"]) {
  const w = await mk(kind, IDX), A = await dev(w, "mom", "A"), p = places(A), JB = J0(w), t = A.run("_todayStr()"), plan = ((w.get("houseDay/" + t) || {}).plan) || {};
  // Mom's and Dad's own rows: every key of their list is a table row (Take over), found the way the list was made (src.id, or a plan row's id)
  for (const [who, rows] of [["mom", p.momRows], ["dad", p.dadRows]]) {
    const L = R(A, "return mdMine('" + who + "').list;"), bad = [];
    rows.forEach(([k, h]) => { const exp = L[k].hd || Object.keys(JB).find(x => JB[x].who === who && ((JB[x].src && JB[x].src.id) || x) === k);
      const got = ids(h); if (!(exp && got.length === 1 && got[0] === exp && JB[exp].label === L[k].label)) bad.push([k, exp, got]); });
    ok(kind + " · " + who + "'s 🏡 My day: every row (" + rows.length + ") has one ✎, for the table row it shows (same name)", rows.length > 0 && bad.length === 0, bad);
  }
  for (const [nm, h, tog] of [["Mom's Day", p.momStrip, "mcToggle"], ["Dad's Day", p.dadStrip, "dcToggle"]]) {
    const rows = h.split('<div style="display:flex;align-items:center;gap:9px;padding:7px 9px;').slice(1), chore = rows.filter(r => r.indexOf("onclick=\"" + tog + "('") >= 0), other = rows.filter(r => r.indexOf("onclick=\"" + tog + "('") < 0);
    ok(kind + " · the " + nm + " strip: a ✎ on each chore row drawn (" + chore.length + "), none on the to-do rows (" + other.length + ")", chore.length > 0 && chore.every(r => ids(r).length === 1) && other.every(r => ids(r).length === 0));
  }
  // a kid's list as Mom's Day opens it: the row shows a table chore → its ✎; a rotated copy (plan off) or a laundry / sent row → none
  { const bad = []; let n = 0, rot = 0;
    Object.keys(p.pops).forEach(ks => { const [kid] = ks.split("/"); p.pops[ks].split('<div style="display:flex;align-items:center;gap:8px;padding:6px 2px;').slice(1).forEach(r => {
      const m = /<span style="flex:1;min-width:0;[^"]*">([^<]*)/.exec(r), l = m ? unq(m[1]) : "", got = ids(r);
      const hit = Object.keys(JB).filter(x => JB[x].status !== "retired" && (l === lab(JB[x]) || l.indexOf(lab(JB[x]) + " +") === 0 || l.indexOf(lab(JB[x]) + " (") === 0));
      const planRow = hit.find(x => plan[x] && plan[x].who === kid), mine = hit.find(x => JB[x].who === kid);
      const exp = planRow || (mine && !(JB[mine].rot && kind === "lists") ? mine : (kind === "lists" ? null : mine));
      if (hit.length && JB[hit[0]].rot && !planRow) rot++;
      if (exp ? !(got.length === 1 && got[0] === exp) : got.length) bad.push([ks, l, exp, got]); n += got.length; }); });
    ok(kind + " · a kid's list on Mom's Day (4 kids × 4 lists): " + n + " ✎, each for the chore its row shows; none elsewhere", n > 5 && bad.length === 0, bad);
    if (kind === "lists") ok("lists · …a rotated row (another kid's chore today, by the old wheel) has no ✎ (" + rot + " seen)", rot > 0);
  }
  // Up for Grabs (switch on: the table's rows) and the ×2 offers (plan ON)
  { const bad = []; let n = 0;
    p.grabs.concat(p.x2).forEach(h => h.split('<div class="grab-card').slice(1).forEach(c => { const m = /<div class="gc-name">([^<]*)/.exec(c), l = m ? unq(m[1]) : "", got = ids(c);
      const exp = Object.keys(JB).filter(x => JB[x].label === l && JB[x].status !== "retired"); if (!(exp.length === 1 && got.length === 1 && got[0] === exp[0])) bad.push([l, exp, got]); n++; }));
    ok(kind + " · every Up for Grabs card Mom sees (" + n + (kind === "plan" ? ", with the ×2 offers" : "") + ") has one ✎, for its table row", n > 4 && bad.length === 0 && (kind !== "plan" || p.x2.some(h => ids(h).length)), bad);
  }
  ok(kind + " · a kid's own Up for Grabs (momView false), even on Mom's device in Mom mode: no ✎ (Up for Grabs' switch compares that screen)", p.grabsKid.every(h => ids(h).length === 0) && p.grabs.some(h => ids(h).length));
}

// ── B ──
console.log("\n── B · a tap opens the Household page with that exact card ──");
{ const w = await mk("plan", IDX), JB = J0(w);
  const cases = [["Mom's 🏡 My day", d => d.run("momDayStripHTML(_todayStr(),mdTodayName())"), "m_tea"],
    ["Dad's Day 🏡 My day", d => d.run("momDayStripHTML(_todayStr(),mdTodayName(),'dad')"), "d_trash"],
    ["kid_a's chores on Mom's Day", d => d.run("__pop='';boardStatPop('kid_a','chores',mdTodayName());__pop"), "c_a_dishes"],
    ["kid_b's evening on Mom's Day", d => d.run("__pop='';boardStatPop('kid_b','evening',mdTodayName());__pop"), "h_b_vit"],
    ["kid_a's Up for Grabs (Mom's pop-up)", d => { d.run("popOpen('kid_a','grabs');1"); return d.run("_grabsHTML('kid_a',true)"); }, "gb_wipe_the_island"],
    ["a ×2 offer", d => d.run("hdGrabsHTML('kid_b',true)"), "c_b_tub"]];
  for (const [nm, draw, id] of cases) {
    const d = await dev(w, "mom"), h = draw(d), oc = handlers(h).find(x => x.indexOf("hcGo('" + id + "')") >= 0);
    if (!oc) { ok(nm + " · the row of " + id + " has a ✎", false); continue; }
    const before = R(d, "return {ready:haLazyReady('house'),card:typeof hcOpen,tags:__tags.length};"); const m = w.mark();
    run(d, oc); const mid = R(d, "return {sub:mpSubView,view:hhView,tags:__tags.map(function(s){ return s.src; }),loading:document.getElementById('content').innerHTML.indexOf('Loading the Household page')>=0,pop:popView};");
    d.run(HJS); d.run("__tags[0].onload();1"); await settle(w, d);
    const j = JB[id], room = R(d, "return hhRoomOn(hhJobs()['" + id + "'])||'__none';"), html = d.run("document.getElementById('content').innerHTML");
    const after = R(d, "return {id:hcId,rm:hhRmSel,view:hhView,sub:mpSubView};");
    ok(nm + " · before the tap house.js is not loaded and nothing asked for it", !before.ready && before.card === "undefined" && before.tags === 0, before);
    ok(nm + " · the tap goes to 🧹 Household ▸ 🗺 Rooms, shows the loading line and asks for house.js once (one <script>)", mid.sub === "house" && mid.view === "rooms" && mid.loading && J(mid.tags) === J(["house.js"]), mid);
    ok(nm + " · when it lands: that chore's card (" + id + ", its name field), on its room's page (" + room + ")", after.id === id && after.rm === room && html.indexOf("hhEditField('" + id + "','label',this)") >= 0 && html.indexOf(d.run("hcCardHTML()")) >= 0, after);
    if (nm.indexOf("Up for Grabs") >= 0) ok(nm + " · the Up for Grabs pop-up it came from is closed", mid.pop === null);
    ok(nm + " · nothing written (the tap, the load, the card)", w.since(m).length === 0, w.since(m).map(l => l.op + " " + l.path));
    d.run("hcClose();1"); const shut = d.run("document.getElementById('content').innerHTML");
    ok(nm + " · ✕ on the card: the card is gone and she is on " + room + "'s page, where the chore is listed", R(d, "return hcId;") === "" && shut.indexOf("hhEditField(") < 0 && shut.indexOf(d.run("esc(" + J(j.label) + ")")) >= 0);
  }
  // house.js already here: the next ✎ opens its card at once, no second <script>
  { const d = await dev(w, "mom"); d.run(HJS); d.run("mpGoto('plan');1"); const m = w.mark(); const oc = handlers(d.run("momDayStripHTML(_todayStr(),mdTodayName())")).find(x => /hcGo\('m_tea'\)/.test(x));
    run(d, oc); const r = R(d, "return {id:hcId,tags:__tags.filter(function(s){ return !/(gifts|seasons)\\.js/.test(s.src); }).length,sub:mpSubView};");   // 🎁 GIFTS_NOW (2026-11-20): Home Base now asks for gifts.js for Mom (her 🔴 Now gift reminders) — this counts house.js loads only · 🎉 SEASONS_NOW (2026-11-20): and for seasons.js, the same way
    ok("house.js already loaded: the ✎ opens the card in the same tap, no <script>, nothing written", r.id === "m_tea" && r.tags === 0 && r.sub === "house" && w.since(m).length === 0, r);
    d.run("hcClose();mpGoto('plan');1"); const oc2 = handlers(d.run("__pop='';boardStatPop('kid_c','chores',mdTodayName());__pop")).find(x => /hcGo\(/.test(x)) || ""; if (oc2) run(d, oc2);
    ok("…and again from a kid's list (the list pop-up closed first)", !!oc2 && R(d, "return hcId;") === /hcGo\('([^']*)'/.exec(oc2)[1]); }
}

// ── C ──
if (BASE) {
  console.log("\n── C · every existing tap on these places is main's ──");
  for (const kind of ["plan", "lists"]) {
    const N = await mk(kind, IDX), O = await mk(kind, BASE), a = await dev(N, "mom", "A"), b = await dev(O, "mom", "A");
    const pn = places(a), po = places(b), fn = flat(pn), fo = flat(po);
    ok(kind + " · Mom's view with the ✎ taken out = main's, every place byte for byte (" + fn.length + " drawings)", J(fn.map(strip)) === J(fo), fn.map(strip).findIndex((h, i) => h !== fo[i]));
    ok(kind + " · …the same handlers in the same order, apart from hcGo", J(fn.map(h => handlers(h).filter(x => !/hcGo\(/.test(x)))) === J(fo.map(handlers)));
    const inside = fn.reduce((a2, h) => a2.concat(edInsideTap(h)), []);
    ok(kind + " · no ✎ sits inside a row's own tap (check-off, label, grab buttons)", inside.length === 0 && allIds(pn).length > 10, inside.slice(0, 3));
    // run every existing tap of every place, in order, in both worlds
    const H = [...new Set(fn.reduce((a2, h) => a2.concat(handlers(h).filter(x => !/hcGo\(|^event\.stopPropagation\(\)$|^boardStatPopClose\(\)$/.test(x))), []))];
    let same = true, firstBad = null, wrote = 0;
    for (const h of H) { const m1 = N.mark(), m2 = O.mark(); run(a, h); run(b, h); await N.flush(); await O.flush();
      const x = N.since(m1).map(l => l.op + " " + l.path + " " + (l.keys || []).join(",")), y = O.since(m2).map(l => l.op + " " + l.path + " " + (l.keys || []).join(","));
      wrote += x.length; if (J(x) !== J(y) || J(N.db.tree.root) !== J(O.db.tree.root)) { same = false; firstBad = firstBad || [h, x, y]; } }
    const kinds = [...new Set(H.map(h => h.replace(/^event\.stopPropagation\(\);/, "").split("(")[0]))];
    ok(kind + " · each of the " + H.length + " taps (" + kinds.join(", ").slice(0, 160) + ") writes what main writes and leaves the same database (" + wrote + " writes)", same && wrote > 10, firstBad);
    ok(kind + " · …those taps include the check-offs, Mom's and Dad's ticks and the grabs", ["mcToggle", "dcToggle", "mdKidTick", "gbInstant", "gbClaim"].every(k => kinds.indexOf(k) >= 0) && (kind !== "plan" || kinds.indexOf("hdGrabDone") >= 0), kinds);
    a.run("ldsrOn=function(){ return false; };laundryNeedsYou=function(){ return false; };1");   // LAUNDRY_MYDAY3 (her words 2026-11-21: "So those buttons, I would love them to be on mom and dad's day"): a tap above starts a load, and My day's 🫧 Machines now now draws Household's stage row, 🔴 light and hold key on purpose — set aside here, the rest must still be main's
    ok(kind + " · after all of them, Mom's view with the ✎ taken out is still main's (My day's laundry stage buttons aside — LAUNDRY_MYDAY3)", J(flat(places(a)).map(strip).map(h => typeof h === "string" ? h.replace(/data-lho="jbnc"/g, 'data-lho="bnc"') : h)) === J(flat(places(b))));
  }
}

// ── D ──
console.log("\n── D · a name typed on the card shows on the place, on its room page, on her other device ──");
{ const w = await mk("plan", IDX), A2 = await dev(w, "mom", "A2");
  const cases = [["m_tea", "Tea on the porch", d => d.run("momDayStripHTML(_todayStr(),mdTodayName())")],
    ["d_trash", "Bins to the curb", d => d.run("momDayStripHTML(_todayStr(),mdTodayName(),'dad')")],
    ["c_a_dishes", "Empty the dishwasher", d => d.run("__pop='';boardStatPop('kid_a','chores',mdTodayName());__pop")],
    ["gb_wipe_the_island", "Wipe the big island", d => d.run("_grabsHTML('kid_a',true)")],
    ["c_b_tub", "Scrub the big tub", d => d.run("hdGrabsHTML('kid_a',true)")]];
  for (const [id, nu, draw] of cases) {
    const d = await dev(w, "mom"), old = J0(w)[id].label, oc = handlers(draw(d)).find(x => x.indexOf("hcGo('" + id + "')") >= 0);
    if (!oc) { ok(id + " · its row has a ✎", false); continue; } d.run(HJS); run(d, oc); await settle(w, d);
    const m = w.mark(); d.run("hhEditField('" + id + "','label',{value:" + J(nu) + "});1"); await w.flush();
    const wr = w.since(m).map(l => l.op + " " + l.path + " " + (l.keys || []).join(","));
    const here = draw(d), there = draw(A2); d.run("hcClose();1"); const room = d.run("document.getElementById('content').innerHTML");
    ok(id + " · the card's name field writes the name only (" + wr.join(" · ") + ")", wr.length === 1 && / household\/jobs\/[^ ]+\/label$/.test(wr[0]) && wr[0].indexOf("household/jobs/" + id + "/label") >= 0, wr);
    ok(id + " · the new name shows on the place (this device and Mom's other one) and on its room page; the old one is gone there", here.indexOf(nu) >= 0 && there.indexOf(nu) >= 0 && room.indexOf(nu) >= 0 && here.indexOf(">" + old) < 0 && there.indexOf(old + "<") < 0);
  }
}

// ── E ──
if (BASE) {
  console.log("\n── E · not Mom: every place byte for byte main's ──");
  for (const kind of ["plan", "lists"]) for (const who of ["kid", "momoff", "kc"]) {
    const N = await mk(kind, IDX), O = await mk(kind, BASE), a = await dev(N, who), b = await dev(O, who), fn = flat(places(a)), fo = flat(places(b));
    ok(kind + " · " + ({ kid: "a kid's device", momoff: "Mom's device out of Mom mode", kc: "Mom mode on Kids' Corner" })[who] + ": no ✎, every place (" + fn.length + ") = main's", J(fn) === J(fo) && fn.join("").indexOf("hcGo(") < 0, fn.findIndex((h, i) => h !== fo[i]));
  }
  console.log("\n── F · Take over off, the old pool, no table: no ✎, main's ──");
  for (const kind of ["off", "old", "none"]) {
    const N = await mk(kind, IDX), O = await mk(kind, BASE), a = await dev(N, "mom"), b = await dev(O, "mom"), pn = places(a), fn = flat(pn), fo = flat(places(b));
    const exp = kind === "old" ? "only on rows of the table (Mom's, Dad's, the kids' lists, ×2), none on the old pool's cards" : "no ✎ at all";
    if (kind === "old") ok("old · the old Up for Grabs pool (switch off): no ✎ on its cards; the rest as with the switch on", pn.grabs.every(h => h.split('<div class="grab-card').slice(1).filter(c => c.indexOf('style="border:2px solid #f59e0b"') < 0).every(c => ids(c).length === 0)) && J(fn.map(strip)) === J(fo), exp);
    else ok(kind + " · " + (kind === "off" ? "Take over off" : "a family with no table") + ": " + exp + ", every place = main's", J(fn) === J(fo) && fn.join("").indexOf("hcGo(") < 0, fn.findIndex((h, i) => h !== fo[i]));
  }
}

// ── G ──
if (BASE) {
  console.log("\n── G · 6 days, the ✎ drawn and never tapped: lists, writes and the database = main's ──");
  const N = await mk("plan", IDX), O = await mk("plan", BASE), S = [[N, await dev(N, "mom", "A"), await dev(N, "kid", "B")], [O, await dev(O, "mom", "A"), await dev(O, "kid", "B")]];
  let same = true, bad = null, drawn = 0;
  for (let n = 2; n < 8; n++) {
    for (const [w, A, B] of S) {
      await go(w, n, 8, 0); KIDS.slice(0, 3).forEach((k, x) => { try { B.run("(function(){ const st=rtStepsFor('chores','" + k + "',false,_todayDay); for(let i=0;i<st.length;i++){ if(" + (n + x) + "%2||i%2){ try{ toggleRtStep('chores','" + k + "',i); }catch(e){} } } })()"); } catch (e) {} });
      await w.flush(); await go(w, n, 12, 0); A.run("(function(){ Object.keys(mdMine('mom').list).forEach(function(k,i){ if(i%2===" + (n % 2) + ") mcToggle(k); }); Object.keys(mdMine('dad').list).forEach(function(k){ dcToggle(k); }); })()");
      await w.flush(); await go(w, n, 16, 0); B.run("(function(){ const x=gbPool('kid_a',false)[" + n + "%3]; if(x) gbInstant('kid_a',x.i); const y=hdGrabRows('kid_b',false)[0]; if(y) hdGrabDone('kid_b',_todayStr(),y.id); })()");
      await w.flush(); await go(w, n, 19, 0); const p = places(A); drawn += allIds(p).length; A.run("try{ renderAll(); }catch(e){} 1"); await w.flush(); }
    const ln = W.lists(S[0][1]), lo = W.lists(S[1][1]), wn = N.since(0).map(l => l.op + " " + l.path), wo = O.since(0).map(l => l.op + " " + l.path);
    if (J(ln) !== J(lo) || J(wn) !== J(wo) || J(N.db.tree.root) !== J(O.db.tree.root)) { same = false; bad = bad || [n, J(ln) === J(lo), wn.length, wo.length]; }
  }
  ok("every person's lists each day, every write and the whole database = main's (the ✎ drawn " + drawn + " times, never tapped)", same && drawn > 50, bad);
}

// ── A2 ──
console.log("\n── A2 · Up for Grabs' own switch still finds every kid's screen the same (it runs on Mom's device, in Mom mode) ──");
{ const w = await mk("old", IDX), d = await dev(w, "mom"); d.run(HJS); const p = R(d, "const p=hgPlan({}); return {ok:p.ok,why:p.why,same:p.same};");
  ok("hgPlan on the old pool: every kid's Up for Grabs the same now and after, nothing in the way", p.ok && p.same.length === 4 && p.same.every(Boolean), p); }

// ── H ──
console.log("\n── H · hcGo refuses: not Mom, not a table row, Take over off ──");
for (const [kind, who, id, why] of [["plan", "kid", "c_a_dishes", "a kid's device"], ["plan", "momoff", "m_tea", "Mom's device out of Mom mode"], ["plan", "kc", "c_a_dishes", "Mom mode on Kids' Corner"], ["plan", "mom", "no_such_chore", "an id not in the table"], ["plan", "mom", "x'y", "an id with a quote"], ["off", "mom", "m_tea", "Take over off"]]) {
  const w = await mk(kind, IDX), d = await dev(w, who), s0 = R(d, "return [mpSubView,hhView,tab];"), m = w.mark(); d.run("hcGo(" + J(id) + ");1"); await w.flush();
  ok(why + ": hcGo does nothing (no move, no <script>, no write)", J(R(d, "return [mpSubView,hhView,tab];")) === J(s0) && R(d, "return __tags.length;") === 0 && w.since(m).length === 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
if (BASE && !process.env.BASE_HTML) try { fs.unlinkSync(BASE); } catch (e) {}
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
