/* test_fb_frame_emoji.js — FBFRAME (her "Yes, build the fix" 2026-11-23)
 *
 * The Firebase v8 SDK sends a message longer than 16384 characters as several WebSocket frames, cut by position
 * (vendor-firebase-database-v8.js, `me`). A cut between the two halves of an emoji sent each half alone; the browser
 * turns a lone half into U+FFFD, so the server kept "��" (live: the 11/23 "Make the copy" broke week 30's Daily Drill
 * title; 5 older past-week titles broke the same way in earlier big saves).
 *
 *   1. the change is in the vendored SDK once, and both senders still use the one splitter
 *   2. the splitter: every piece fits, the pieces join back to the message, no emoji is ever cut — at every offset
 *   3. ASCII is cut exactly as before (the long-poll path sends base64, so it is unchanged)
 *   4. the SDK's own send(): frames → UTF-8 the way a browser sends them → joined by the server = the message, emoji and all
 *   5. "minus the feature": the old splitter fails 2 and 4 on the same inputs (so this test sees the bug)
 *   6. optional, read-only: ARCH_CORE_SNAPSHOT=<folder with archive.json> rebuilds the real Make-the-copy message
 *   run: node test_fb_frame_emoji.js
 */
"use strict";
const fs = require("fs"), path = require("path");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + (typeof x === "string" ? x : JSON.stringify(x)).slice(0, 600) + ")" : "")); } };

const SDK = fs.readFileSync(path.join(__dirname, "vendor-firebase-database-v8.js"), "utf8");
const A0 = SDK.indexOf("/* HOWE FBFRAME_START"), A1 = SDK.indexOf("/* HOWE FBFRAME_END */");
const OLD = 'function me(e,t){var n=e.length;if(n<=t)return[e];for(var r=[],i=0;i<n;i+=t)n<i+t?r.push(e.substring(i,n)):r.push(e.substring(i,i+t));return r}';
const MINUS = A0 >= 0 && A1 > A0 ? SDK.slice(0, A0) + OLD + SDK.slice(A1 + "/* HOWE FBFRAME_END */".length) : SDK;

// the splitter and the WebSocket send(), taken from the SDK text itself
function splitterOf(src) {
  const i = src.indexOf("function me(e,t){"); if (i < 0) throw new Error("splitter not found");
  const j = src.indexOf("return r}", i) + "return r}".length;
  return (0, eval)("(" + src.slice(i, j) + ")");
}
function sendOf(src, me) {
  const i = src.indexOf("gt.prototype.send=function(e){"); if (i < 0) throw new Error("WebSocket send not found");
  const j = src.indexOf("},gt.prototype.", i) + 1;
  const body = src.slice(i + "gt.prototype.send=".length, j);
  return (0, eval)("(function(me,O){ return " + body + "; })")(me, JSON.stringify);
}
// a browser sends each text frame as UTF-8: a lone half of an emoji becomes U+FFFD (Node's encoder does the same)
const onTheWire = s => Buffer.from(s, "utf8").toString("utf8");
// what the server ends up with: the frame count, then the frames joined
function serverGets(send, msgObj) {
  const frames = [];
  const conn = { resetKeepAlive() {}, bytesSent: 0, stats_: { incrementCounter() {} }, sendString_(s) { frames.push(onTheWire(s)); } };
  send.call(conn, msgObj);
  const n = frames.length > 1 ? Number(frames[0]) : 1, body = frames.length > 1 ? frames.slice(1) : frames;
  return { count: n, frames: body.length, text: body.join("") };
}
const HI = c => c >= 0xD800 && c <= 0xDBFF, LO = c => c >= 0xDC00 && c <= 0xDFFF;
function cutsAnEmoji(pieces) { return pieces.some((p, k) => k < pieces.length - 1 && HI(p.charCodeAt(p.length - 1)) && LO(pieces[k + 1].charCodeAt(0))); }

const me = splitterOf(SDK), meOld = splitterOf(MINUS);
const send = sendOf(SDK, me), sendOld = sendOf(MINUS, meOld);
const FRAME = 16384;

console.log("\n── 1. one change, in the SDK's one splitter ──");
ok("FBFRAME is in the vendored SDK once", A0 > 0 && A1 > A0 && SDK.split("HOWE FBFRAME_START").length === 2);
ok("the splitter is defined once", SDK.split("function me(e,t){").length === 2);
ok("the WebSocket send still cuts with it at 16384", /gt\.prototype\.send=function\(e\)\{[^}]*me\(e,16384\)/.test(SDK));
ok("the long-poll send still cuts its base64 with it at 1840", /for\(var e=a\(e\),t=me\(e,1840\)/.test(SDK));
ok("nothing else in the SDK changed (minus the block = the file before)", MINUS.length === SDK.length - (A1 + "/* HOWE FBFRAME_END */".length - A0) + OLD.length && !/FBFRAME/.test(MINUS));

console.log("\n── 2. the splitter never cuts an emoji ──");
const E = ["🃏", "📄", "📖", "🏃", "📞", "📱", "👨‍👩‍👧"];
function msgWithEmojiAt(len, at, emoji) { const pad = "x".repeat(Math.max(0, at)); return (pad + emoji + "y".repeat(len)).slice(0, Math.max(len, at + emoji.length)); }
let bad = [], badOld = 0, tried = 0;
for (const size of [FRAME, 1840, 7]) {
  for (let edge = 1; edge <= 3; edge++) for (let d = -4; d <= 4; d++) for (const em of E) {
    const at = edge * size + d; if (at < 0) continue;
    const s = msgWithEmojiAt(size * 4 + 3, at, em); tried++;
    const p = me(s, size), q = meOld(s, size);
    if (!(p.every(x => x.length <= size && x.length > 0) && p.join("") === s && !cutsAnEmoji(p))) bad.push({ size, at, em });
    if (cutsAnEmoji(q)) badOld++;
  }
}
ok("every piece fits, the pieces join back to the message, no emoji cut (" + tried + " placements around every edge)", bad.length === 0, bad.slice(0, 5));
{
  // a message made only of emoji: every edge would land mid-pair for the old cut
  const s = "🃏".repeat(FRAME * 2 + 5);
  const p = me(s, FRAME);
  ok("all-emoji message: pieces fit, join back, never cut a pair", p.every(x => x.length <= FRAME) && p.join("") === s && !cutsAnEmoji(p), p.map(x => x.length));
  ok("…and a stray half at the very end is passed on as it is (nothing dropped)", me("a".repeat(FRAME - 1) + "\uD83C", FRAME).join("") === "a".repeat(FRAME - 1) + "\uD83C");
  ok("a short message is still one piece, untouched", me("🃏 Daily Drill", FRAME).length === 1 && me("🃏 Daily Drill", FRAME)[0] === "🃏 Daily Drill");
  ok("a piece of size 1 can't shrink to nothing (no endless loop)", me("🃏🃏", 1).join("") === "🃏🃏" && me("🃏🃏", 1).length === 4);
}

console.log("\n── 3. ASCII is cut exactly as before ──");
{
  let same = true;
  for (const n of [0, 1, 1839, 1840, 1841, 5000, FRAME - 1, FRAME, FRAME + 1, FRAME * 3 + 17]) {
    const s = Buffer.from("x".repeat(n)).toString("base64").slice(0, n) || "";
    const t = Array.from({ length: n }, (_, i) => String.fromCharCode(32 + (i * 7) % 95)).join("");
    for (const size of [1840, FRAME]) if (JSON.stringify(me(s, size)) !== JSON.stringify(meOld(s, size)) || JSON.stringify(me(t, size)) !== JSON.stringify(meOld(t, size))) same = false;
  }
  ok("base64 / plain text: the same pieces as the SDK made before", same);
  const accented = "é".repeat(FRAME * 2 + 3);   // one UTF-16 unit each: no pairs, nothing to move
  ok("accents (é) are single characters: cut exactly as before", JSON.stringify(me(accented, FRAME)) === JSON.stringify(meOld(accented, FRAME)));
}

console.log("\n── 4. the SDK's own send(), through the wire ──");
function bigMessage(atEdge) {
  // the shape of a Make-the-copy update: one root update with many archiveCore/<week> records (made-up titles only)
  const d = {};
  for (let w = 1; w <= 12; w++) {
    const tasks = [];
    for (let i = 0; i < 60; i++) tasks.push({ id: "w" + w + "_t" + i, who: ["kidA", "kidB"][i % 2], title: E[i % E.length] + " Card " + i, day: "monday", subjectKey: "s" + (i % 5) });
    d["archiveCore/week" + w] = { weekLabel: "Week " + w, tasks };
  }
  const env = r => ({ t: "d", d: { r, a: "m", b: { p: "/", d } } });
  if (!atEdge) return env(1);
  // shift a pad until an emoji's first half is the last character of frame 1 — the 11/23 case
  for (let pad = 0; pad < 200; pad++) {
    d["archiveCore/week1"].weekLabel = "Week 1" + "_".repeat(pad);
    const s = JSON.stringify(env(1));
    if (HI(s.charCodeAt(FRAME - 1))) return env(1);
  }
  throw new Error("couldn't place an emoji on the edge");
}
{
  const m = bigMessage(true), sent = JSON.stringify(m);
  ok("(the made-up message really has an emoji's first half as the last character of frame 1)", HI(sent.charCodeAt(FRAME - 1)) && LO(sent.charCodeAt(FRAME)));
  const got = serverGets(send, m);
  ok("the server gets exactly what was sent — every emoji whole", got.text === sent && !got.text.includes("�"), got.text.length + " vs " + sent.length);
  ok("…and the frame count it was told matches the frames that came", got.count === got.frames && got.frames > 1);
  ok("…and every frame is within the 16384 limit", (() => { const fr = []; send.call({ resetKeepAlive() {}, bytesSent: 0, stats_: { incrementCounter() {} }, sendString_(s) { fr.push(s); } }, m); return fr.slice(1).every(f => f.length <= FRAME); })());
  ok("the parsed record on the server equals the one sent", JSON.stringify(JSON.parse(got.text)) === JSON.stringify(m));
  const plain = bigMessage(false);
  ok("a big message with no emoji on an edge: same frames as before", (() => { const a = [], b = []; const c = arr => ({ resetKeepAlive() {}, bytesSent: 0, stats_: { incrementCounter() {} }, sendString_(s) { arr.push(s); } }); send.call(c(a), plain); sendOld.call(c(b), plain); return JSON.stringify(a) === JSON.stringify(b); })() || !cutsAnEmoji(meOld(JSON.stringify(plain), FRAME)));
}

console.log("\n── 5. minus the feature: the old splitter shows the bug on the same inputs ──");
{
  ok("old splitter cut an emoji in " + badOld + " of the " + tried + " placements", badOld > 0);
  const got = serverGets(sendOld, bigMessage(true));
  ok("old send(): the server's copy has \"��\" where the emoji was (the 11/23 week 30 title)", got.text.includes("��"));
}

console.log("\n── 6. live snapshot (read-only copy; names and titles never printed) ──");
const SNAP = process.env.ARCH_CORE_SNAPSHOT;
if (SNAP && fs.existsSync(path.join(SNAP, "archive.json"))) {
  const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const code = src.slice(src.indexOf("const ARCH_CORE="), src.indexOf("// the copy of one write")) + "\n" + src.slice(src.indexOf("const _acJson="), src.indexOf("\n", src.indexOf("const _acJson=")));
  const M = (0, eval)("(function(){" + code + "\n; return {archCoreOf,_acJson};})")();
  const isInt = k => /^(0|[1-9]\d*)$/.test(k) && Number(k) <= 2147483647;
  const fbOrder = v => { if (!v || typeof v !== "object") return v; const ks = Object.keys(v).sort((a, b) => { const ia = isInt(a), ib = isInt(b); if (ia && ib) return a - b; if (ia) return -1; if (ib) return 1; return a < b ? -1 : a > b ? 1 : 0; });
    if (ks.length && ks.every(isInt) && Math.max(...ks.map(Number)) < 2 * ks.length) { const arr = []; ks.forEach(k => arr[Number(k)] = fbOrder(v[k])); return arr; }
    const o = {}; ks.forEach(k => o[k] = fbOrder(v[k])); return o; };
  const A = fbOrder(JSON.parse(fs.readFileSync(path.join(SNAP, "archive.json"), "utf8")) || {});
  const upd = {}; Object.keys(A).forEach(wk => { upd["archiveCore/" + wk] = M._acJson(M.archCoreOf(A[wk])); });
  let oldCuts = 0, newBad = 0;
  for (let r = 1; r <= 99999; r *= 10) {
    const m = { t: "d", d: { r: r * 9 + 0, a: "m", b: { p: "/", d: upd } } }, sent = JSON.stringify(m);
    if (cutsAnEmoji(meOld(sent, FRAME))) oldCuts++;
    if (serverGets(send, m).text !== sent) newBad++;
  }
  ok("live: the real Make-the-copy message — before, " + oldCuts + " of 5 request numbers cut an emoji; now the server gets it exact every time", newBad === 0 && oldCuts > 0);
} else console.log("(live snapshot not run — set ARCH_CORE_SNAPSHOT=<folder with a read-only GET of archive.json>)");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
