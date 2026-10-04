/*
 * Node tests — 🎉 FAMILY-TIME CELEBRATIONS (FAMCELEB). Her design 2026-10-04:
 *   • a block can carry a celebration (off / confetti / a song from the Song List)
 *   • a kid whose OWN work is done while that family time is still ahead → confetti (Day songs)
 *   • Mom checks the block's last subject → ONE show with the block's song naming every kid whose whole day
 *     is now done; kids still working are NOT named and get their own show later
 *   • a block with no celebration → nothing changes
 * Code sliced verbatim out of index.html.   run:  node test_family_celebration.js [index.html]
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.argv[2] || path.join(__dirname, "index.html"), "utf8");
function extractFn(name) {
  const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("not found: " + name);
  let depth = 0, started = false;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    const c = src[k];
    if (c === "{") { depth++; started = true; } else if (c === "}") { depth--; if (started && depth === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced: " + name);
}
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

const fns = ["rtSchoolworkDone", "hasCelebrated", "markCelebrated", "celebrateDayComplete", "famCelebOf", "famCelebSong",
  "_famCelebHas", "_famCelebMark", "_famCelebNames", "_famCelebCards", "famCelebOwnWork", "famCelebBlockCheck", "famCelebRowHTML"];
const code = fns.map(extractFn).join("\n");

function world(opts) {
  const store = {}, writes = [], shows = [];
  const env = {
    WK: "week30", _todayDay: "monday", day: "monday", ROSTER: ["taylor", "makenzie", "andrew", "caleb"], FAM_ICON: "🏡",
    checked: {}, claimed: {}, tasks: [], defs: opts.defs, celebSongs: opts.songs || [],
  };
  const ctx = Object.assign(env, {
    ld: k => store[k] ? JSON.parse(JSON.stringify(store[k])) : null, sv: (k, v) => { store[k] = v; },
    db: { ref: p => ({ set: v => writes.push([p, v]) }) },
    _rtSwTodayLay: () => null, getActiveTasks: () => env.tasks, effectiveDay: t => t.day,
    famDefs: () => env.defs, cap: s => s ? s[0].toUpperCase() + s.slice(1) : s, esc: s => String(s),
    toMin: t => { const m = String(t).match(/(\d+):(\d+)\s*(AM|PM)/); let h = +m[1] % 12; if (m[3] === "PM") h += 12; return h * 60 + +m[2]; },
    _showCelebration: (kid, title, o) => shows.push({ kid, title, o: o || {} }),
    store, writes, shows,
  });
  new Function("ctx", "with(ctx){" + code + "; Object.assign(ctx,{" + fns.join(",") + "});}")(ctx);
  return ctx;
}
const SONG = { name: "School Work Party", url: "https://x/songs/party.mp3" };
const FT = (celeb) => ({ fbFT: { name: "Family Time", kids: ["taylor", "makenzie", "andrew", "caleb"], celeb } });
function card(id, who, time, extra) { return Object.assign({ id, who, day: "monday", time, title: id }, extra || {}); }
function famCards(day) {
  const out = [];
  ["taylor", "makenzie", "andrew", "caleb"].forEach(k => ["hist", "sci", "ra"].forEach((it, i) =>
    out.push(card(k + "_" + it, k, ["1:00 PM", "1:30 PM", "2:00 PM"][i], { famBlock: "fbFT", famItem: it, day: day || "monday" }))));
  return out;
}

console.log("— own work done before Family Time —");
{
  const w = world({ defs: FT(SONG.url), songs: [SONG] });
  w.tasks = [card("c_nb", "caleb", "9:00 AM"), card("c_close", "caleb", "11:00 AM"), ...famCards()];
  w.checked.c_nb = 1;
  ok("one own card still open → no show", w.famCelebOwnWork("caleb", "monday") === false && w.shows.length === 0);
  w.checked.c_close = 1;
  ok("own work done, family time ahead → confetti show", w.famCelebOwnWork("caleb", "monday") === true && w.shows.length === 1);
  ok("title names Caleb + the block", /Caleb's own work is done! 🏡 Family Time is next\./.test(w.shows[0].title), w.shows[0].title);
  ok("uses the kid's Day songs (occasion day), not the block song", w.shows[0].o.occasion === "day" && !w.shows[0].o.song);
  ok("fires once", w.famCelebOwnWork("caleb", "monday") === false && w.shows.length === 1);
  ok("targeted leaf write", w.writes.some(x => x[0] === "week30/celeb_used/caleb_monday_own" && x[1] === true));
  ok("not marked as day-celebrated (still gets named at family time)", !w.hasCelebrated("caleb", "monday"));
}
{
  const w = world({ defs: FT(SONG.url), songs: [SONG] });
  w.tasks = [card("c_close", "caleb", "11:00 AM"), ...famCards()];
  w.claimed.c_close = 1;
  ok("a card SENT to Mom counts as done (claim path)", w.famCelebOwnWork("caleb", "monday") === true);
}
{
  const w = world({ defs: FT(undefined) });
  w.tasks = [card("c_close", "caleb", "11:00 AM"), ...famCards()]; w.checked.c_close = 1;
  ok("block with NO celebration → no own-work show (nothing changes)", w.famCelebOwnWork("caleb", "monday") === false && w.shows.length === 0);
}
{
  const d = FT(SONG.url); d.fbFT.off = true;
  const w = world({ defs: d });
  w.tasks = [card("c_close", "caleb", "11:00 AM"), ...famCards()]; w.checked.c_close = 1;
  ok("block turned off → no show", w.famCelebOwnWork("caleb", "monday") === false);
}
{
  const w = world({ defs: FT(SONG.url) });
  w.tasks = [card("c_close", "caleb", "11:00 AM"), ...famCards("tuesday")]; w.checked.c_close = 1;
  w.tasks[0].day = "tuesday";
  ok("not today → no show", w.famCelebOwnWork("caleb", "tuesday") === false);
}

console.log("— Mom checks off the last Family Time subject —");
function famDay(celeb) {
  const w = world({ defs: FT(celeb), songs: [SONG] });
  w.tasks = [card("t_own", "taylor", "9:00 AM"), card("m_own", "makenzie", "9:00 AM"), card("a_own", "andrew", "9:00 AM"),
    card("c_own", "caleb", "9:00 AM"), card("m_late", "makenzie", "3:00 PM"), ...famCards()];
  ["t_own", "m_own", "a_own", "c_own"].forEach(id => w.checked[id] = 1);   // Makenzie still has m_late
  return w;
}
{
  const w = famDay(SONG.url);
  w.tasks.filter(t => t.famBlock && t.famItem !== "ra").forEach(t => w.checked[t.id] = 1);
  ok("History + Science checked, Read Aloud open → no show yet", w.famCelebBlockCheck("fbFT", "monday") === false && w.shows.length === 0);
  w.tasks.filter(t => t.famItem === "ra").forEach(t => w.checked[t.id] = 1);   // the one-tap fan-out
  ok("last subject checked → ONE show", w.famCelebBlockCheck("fbFT", "monday") === true && w.shows.length === 1);
  const s = w.shows[0];
  ok("names exactly the kids whose whole day is done", s.title === "🎉 Family Time done! Taylor, Andrew & Caleb finished the day!", s.title);
  ok("Makenzie (still working) is NOT named", !/Makenzie/.test(s.title));
  ok("plays the block's song", s.o.song && s.o.song.url === SONG.url && s.o.song.name === "School Work Party");
  ok("done kids marked so their own day show doesn't play on top", ["taylor", "andrew", "caleb"].every(k => w.hasCelebrated(k, "monday")));
  ok("Makenzie NOT marked — she still gets her own show", !w.hasCelebrated("makenzie", "monday"));
  // the per-kid 600/700 ms timers that follow the fan-out
  const before = w.shows.length; ["taylor", "andrew", "caleb"].forEach(k => w.celebrateDayComplete(k, "monday"));
  ok("…and the per-kid day shows that follow are suppressed", w.shows.length === before);
  ok("fires once per block per day", w.famCelebBlockCheck("fbFT", "monday") === false && w.shows.length === before);
  w.checked.m_late = 1; w.celebrateDayComplete("makenzie", "monday");
  ok("Makenzie finishes later → her own normal show", w.shows.length === before + 1 && w.shows[before].title === "Makenzie finished the day!");
}
{
  const w = famDay(SONG.url);
  w.tasks.forEach(t => { if (t.famBlock) w.checked[t.id] = 1; }); w.checked.t_own = 0; w.checked.a_own = 0; w.checked.c_own = 0;
  ["t_own", "a_own", "c_own"].forEach(id => delete w.checked[id]);
  w.famCelebBlockCheck("fbFT", "monday");
  ok("nobody fully done → just \"Family Time done!\"", w.shows[0] && w.shows[0].title === "🎉 Family Time done!", w.shows[0] && w.shows[0].title);
}
{
  const w = famDay("confetti");
  w.tasks.forEach(t => { if (t.famBlock) w.checked[t.id] = 1; });
  w.famCelebBlockCheck("fbFT", "monday");
  ok("confetti mode → noSong", w.shows[0] && w.shows[0].o.noSong === true && !w.shows[0].o.song);
}
{
  const w = famDay(undefined);
  w.tasks.forEach(t => { if (t.famBlock) w.checked[t.id] = 1; });
  ok("no celebration on the block → no combined show, kids keep their normal shows", w.famCelebBlockCheck("fbFT", "monday") === false && w.shows.length === 0);
  w.celebrateDayComplete("caleb", "monday");
  ok("…Caleb's normal day show still plays", w.shows.length === 1 && w.shows[0].title === "Caleb finished the day!");
}
{
  const w = famDay("https://x/songs/deleted.mp3");
  w.tasks.forEach(t => { if (t.famBlock) w.checked[t.id] = 1; });
  w.famCelebBlockCheck("fbFT", "monday");
  ok("song removed from the list → still plays its saved url", w.shows[0].o.song && w.shows[0].o.song.url === "https://x/songs/deleted.mp3");
}
{
  // Fact Review style: kids-only block, no celebration, in the morning — Family Time celebration unaffected by it
  const defs = FT(SONG.url); defs.fbFR = { name: "Fact Review", kids: ["andrew", "makenzie"] };
  const w = world({ defs, songs: [SONG] });
  w.tasks = [card("a_fr", "andrew", "9:00 AM", { famBlock: "fbFR", famItem: "fr" }), card("m_fr", "makenzie", "9:00 AM", { famBlock: "fbFR", famItem: "fr" }), ...famCards()];
  w.checked.a_fr = 1; w.checked.m_fr = 1;
  ok("Fact Review (no celebration) finishing → no combined show", w.famCelebBlockCheck("fbFR", "monday") === false && w.shows.length === 0);
}

console.log("— Fact Review (no celebration) counts as OWN work (her 'a' 10/4) —");
{
  const defs = FT(SONG.url); defs.fbFR = { name: "Fact Review", kids: ["andrew", "makenzie"] };
  const w = world({ defs, songs: [SONG] });
  w.tasks = [card("a_own", "andrew", "10:00 AM"), card("a_fr", "andrew", "9:00 AM", { famBlock: "fbFR", famItem: "fr" }), ...famCards()];
  w.checked.a_own = 1;
  ok("Fact Review still open → no own-work confetti yet", w.famCelebOwnWork("andrew", "monday") === false && w.shows.length === 0);
  ok("…own work not done while Fact Review open", w.rtSchoolworkDone("andrew", "monday", true) === false);
  w.checked.a_fr = 1;
  ok("Fact Review done → own-work confetti", w.famCelebOwnWork("andrew", "monday") === true && /Andrew's own work is done! 🏡 Family Time is next\./.test(w.shows[0].title));
  defs.fbFR.celeb = "confetti";
  const w2 = world({ defs, songs: [SONG] });
  w2.tasks = [card("a_own", "andrew", "10:00 AM"), card("a_fr", "andrew", "9:00 AM", { famBlock: "fbFR", famItem: "fr" }), ...famCards()];
  w2.checked.a_own = 1;
  ok("a block WITH a celebration is family again → own work done without it", w2.rtSchoolworkDone("andrew", "monday", true) === true);
}

console.log("— rtSchoolworkDone unchanged without the new flag —");
{
  const w = famDay(SONG.url);
  ok("Caleb not done while Family Time is open (old behaviour)", w.rtSchoolworkDone("caleb", "monday") === false);
  ok("…but his own work is (skipFam)", w.rtSchoolworkDone("caleb", "monday", true) === true);
  ok("Makenzie own work not done", w.rtSchoolworkDone("makenzie", "monday", true) === false);
}

console.log("— editor row —");
{
  const w = world({ defs: FT(SONG.url), songs: [SONG] });
  const J = s => String(s);
  const h = w.famCelebRowHTML("fbFT", w.defs.fbFT, true, J);
  ok("dropdown lists off / confetti / the song, song selected", /No family celebration/.test(h) && /Confetti, no song/.test(h) && /<option value="https:\/\/x\/songs\/party.mp3" selected>🎵 School Work Party/.test(h));
  ok("Try it button when set", /famCelebTest\('fbFT'\)/.test(h));
  const h2 = w.famCelebRowHTML("fbFT", { name: "x" }, true, J);
  ok("unset → 'No family celebration' selected, no Try it", /<option value="" selected>No family celebration/.test(h2) && !/Try it/.test(h2));
  ok("kid view (not Mom) → read-only text", !/<select/.test(w.famCelebRowHTML("fbFT", w.defs.fbFT, false, J)));
}

console.log("— Song List: family-time-only songs (her yes 10/4) —");
{
  const names = ["celebSongToggleOcc", "getSongsForKid", "celebSongUsedBy", "celebSongRemove"];
  const code2 = names.map(extractFn).join("\n");
  const env = { celebSongs: [], saves: 0, deleted: [], confirms: [], confirmAns: true, defs: {} };
  const ctx = Object.assign(env, {
    celebSongsSave: () => env.saves++, renderAll: () => {}, famDefs: () => env.defs,
    confirm: (m) => { env.confirms.push(m); return env.confirmAns; },
    firebase: { storage: () => ({ refFromURL: (u) => ({ delete: () => { env.deleted.push(u); return { catch: () => {} }; } }) }) },
  });
  new Function("ctx", "with(ctx){" + code2 + "; Object.assign(ctx,{" + names.join(",") + "});}")(ctx);
  const A = { name: "School Work Party", url: "https://firebasestorage.x/party.mp3", occ: { day: true, session: false } };
  const B = { name: "Other", url: "https://firebasestorage.x/other.mp3" };
  env.celebSongs.push(A, B);
  ctx.celebSongToggleOcc(0, "day");
  ok("turning off the last 'Plays on' keeps BOTH off (was: flipped back to both)", A.occ && A.occ.day === false && A.occ.session === false, A.occ);
  ok("family-only song never plays on Day", !ctx.getSongsForKid("caleb", "day").includes(A));
  ok("…nor on Session", !ctx.getSongsForKid("caleb", "session").includes(A));
  ok("a song with no setting still plays on both", ctx.getSongsForKid("caleb", "day").includes(B) && ctx.getSongsForKid("caleb", "session").includes(B));
  ctx.celebSongToggleOcc(0, "session");
  ok("turning one back on works", A.occ.session === true && ctx.getSongsForKid("caleb", "session").includes(A));
  env.defs = { fbFT: { name: "Family Time", celeb: A.url }, fbFR: { name: "Fact Review" } };
  ok("knows which blocks use a song", JSON.stringify(ctx.celebSongUsedBy(A.url)) === '["Family Time"]' && ctx.celebSongUsedBy(B.url).length === 0);
  env.confirmAns = false; ctx.celebSongRemove(0);
  ok("✕ on a block's song asks first; No → nothing removed", env.celebSongs.length === 2 && env.confirms.length === 1 && /Family Time will keep playing it/.test(env.confirms[0]));
  env.confirmAns = true; ctx.celebSongRemove(0);
  ok("Yes → off the list, but the music FILE is kept", env.celebSongs.length === 1 && env.celebSongs[0] === B && env.deleted.length === 0);
  ctx.celebSongRemove(0);
  ok("a song no block uses deletes as before (file too, no question)", env.celebSongs.length === 0 && env.deleted[0] === B.url && env.confirms.length === 2);
}

console.log("— wiring —");
ok("finalizeDone schedules the block check at 300 ms (before the 700 ms day show)", /setTimeout\(function\(\)\{ try\{ famCelebBlockCheck\(_fb,_todayDay\); \}catch\(e\)\{\} \},300\)/.test(src));
ok("finalizeDone own-work check for own cards + non-celebrating block cards", /if\(!t\.gotAhead&&!\(t\.famBlock&&famCelebOf\(famDefs\(\)\[t\.famBlock\]\)\)\) setTimeout\(function\(\)\{ try\{ famCelebOwnWork\(t\.who,_todayDay\); \}catch\(e\)\{\} \},700\)/.test(src));
ok("claim path own-work check", /!t\.famBlock&&typeof famCelebOwnWork==="function"\) setTimeout\(function\(\)\{ try\{ famCelebOwnWork\(t\.who,_todayDay\); \}catch\(e\)\{\} \},600\)/.test(src));
ok("_showCelebration honours noSong", /const chosen=opts\.noSong\?null:/.test(src));
ok("editor row wired into the block editor", /if\(typeof famCelebRowHTML==="function"\) h\+=famCelebRowHTML\(id,b,ed,J\);/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
