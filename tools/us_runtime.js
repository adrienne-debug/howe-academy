// us_runtime.js — the runtime half of us.js (tools/build_us_js.py pastes it after US_DATA). Hands back one card's picture as
// a data URI the app's <img src> can show: a photo from us_pics_1.js / us_pics_2.js (window.HoweUSPics), or a drawing made
// here — the flag (4 U.S.C. §1–2 proportions), the holidays, the civics diagrams, the amendment icons, a badge for a person
// with no true likeness, and, with geo.js loaded (window.HoweGeo), the 13-colony maps and the battle/war pins. Pure: no DOM,
// no network, no app globals; loads in Node for test_us_data.js (module.exports) and in the browser (window.HoweUS).
const D = US_DATA;
const COL = { red: "#B22234", blue: "#3C3B6E", white: "#ffffff", ink: "#1f2937", mute: "#6b7280", line: "#9ca3af", pale: "#f3f4f6",
  gold: "#d97706", gold2: "#fbbf24", green: "#15803d", sky: "#e0f2fe", navy: "#1e3a8a", lit: "#f97316", brown: "#92400e", skin: "#e7b98f",
  region: { "New England": "#0072B2", "Middle": "#009E73", "Southern": "#E69F00" } };
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const num = v => (Math.round(v * 10) / 10).toString();
const S = 300;
function svg(body, vb, w, h) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (vb || ("0 0 " + S + " " + S)) + '" width="' + (w || S) + '" height="' + (h || S) + '">' + body + '</svg>'; }
function uri(t) { return t ? "data:image/svg+xml;utf8," + encodeURIComponent(t) : null; }
function bg(fill) { return '<rect x="0" y="0" width="300" height="300" rx="28" fill="' + (fill || "#f8fafc") + '"/>'; }
function R(x, y, w, h, f, o) { o = o || {}; return '<rect x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '"' + (o.rx ? ' rx="' + num(o.rx) + '"' : "") + ' fill="' + (f || "none") + '"' + (o.s ? ' stroke="' + o.s + '" stroke-width="' + (o.sw || 4) + '"' : "") + (o.t ? ' transform="' + o.t + '"' : "") + '/>'; }
function Cc(x, y, r, f, o) { o = o || {}; return '<circle cx="' + num(x) + '" cy="' + num(y) + '" r="' + num(r) + '" fill="' + (f || "none") + '"' + (o.s ? ' stroke="' + o.s + '" stroke-width="' + (o.sw || 4) + '"' : "") + '/>'; }
function P(d, f, o) { o = o || {}; return '<path d="' + d + '" fill="' + (f || "none") + '"' + (o.s ? ' stroke="' + o.s + '" stroke-width="' + (o.sw || 4) + '" stroke-linejoin="round" stroke-linecap="round"' : "") + (o.t ? ' transform="' + o.t + '"' : "") + '/>'; }
function T(x, y, t, size, fill, o) { o = o || {}; return '<text x="' + num(x) + '" y="' + num(y) + '" font-family="DM Sans, Nunito, Arial, sans-serif" font-size="' + size + '" font-weight="' + (o.w || 800) + '" fill="' + (fill || COL.ink) + '" text-anchor="' + (o.a || "middle") + '">' + esc(t) + '</text>'; }
function G(t, body) { return '<g transform="' + t + '">' + body + '</g>'; }
function starPts(cx, cy, r) { let p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.382 : r; p.push(num(cx + rr * Math.cos(a)) + "," + num(cy + rr * Math.sin(a))); } return p.join(" "); }
function star(cx, cy, r, f, o) { o = o || {}; return '<polygon points="' + starPts(cx, cy, r) + '" fill="' + (f || COL.white) + '"' + (o.s ? ' stroke="' + o.s + '" stroke-width="' + (o.sw || 3) + '" stroke-linejoin="round"' : "") + '/>'; }

// ── the flag: hoist 1.0, fly 1.9; 13 stripes; canton 7/13 × 0.76; 50 stars in 9 rows of 6 and 5 (4 U.S.C. §1–2; EO 10834) ──
function flagBody(x, y, w) {
  const h = w / 1.9, sh = h / 13; let b = R(x, y, w, h, COL.white);
  for (let i = 0; i < 13; i += 2) b += R(x, y + i * sh, w, sh, COL.red);
  const cw = 0.76 * h, ch = 7 * sh; b += R(x, y, cw, ch, COL.blue);
  const E = 0.054 * h, H = 0.063 * h, K = 0.0616 * h;
  for (let r = 1; r <= 9; r++) for (let c = 1; c <= 11; c++) if ((r + c) % 2 === 0) b += star(x + c * H, y + r * E, K / 2);
  return b + R(x, y, w, h, "none", { s: "#d1d5db", sw: 1.5 });
}
const flag = () => svg(bg("#eef2ff") + flagBody(15, 79, 270));
// ── people and things (each draws inside a 300 box) ──
function person(x, y, s, f, o) { o = o || {}; s = s || 1; return G("translate(" + num(x) + " " + num(y) + ") scale(" + num(s) + ")", Cc(0, -38, 16, o.skin || COL.skin) + P("M-28 20 Q-28 -16 0 -18 Q28 -16 28 20 Z", f || COL.navy) + (o.hair ? P("M-17 -42 Q0 -66 17 -42 Q12 -52 0 -54 Q-12 -52 -17 -42Z", o.hair) : "")); }
function dome(x, y, s, f) { s = s || 1; f = f || "#e5e7eb"; let b = R(-60, 20, 120, 10, f, { s: COL.ink, sw: 3 }) + R(-50, -10, 100, 30, f, { s: COL.ink, sw: 3 });
  for (let i = -40; i <= 40; i += 16) b += R(i - 3, -8, 6, 26, COL.ink);
  b += P("M-34 -10 Q-34 -52 0 -54 Q34 -52 34 -10 Z", f, { s: COL.ink, sw: 3 }) + R(-4, -66, 8, 12, COL.ink) + Cc(0, -68, 4, COL.ink);
  return G("translate(" + num(x) + " " + num(y) + ") scale(" + num(s) + ")", b); }
function ballotBox(x, y, s) { return G("translate(" + num(x) + " " + num(y) + ") scale(" + num(s || 1) + ")", R(-30, -78, 46, 56, COL.white, { s: COL.ink, sw: 3, t: "rotate(-8)" }) + P("M-18 -52 l8 9 l16 -20", "none", { s: COL.green, sw: 6 }) + R(-60, -30, 120, 90, COL.navy, { rx: 6 }) + R(-34, -34, 68, 8, COL.ink, { rx: 4 }) + star(0, 18, 18, COL.white)); }
function paper(x, y, s, inner) { return G("translate(" + num(x) + " " + num(y) + ") scale(" + num(s || 1) + ")", P("M-45 -60 h70 l20 20 v100 h-90 Z", COL.white, { s: COL.ink, sw: 3 }) + P("M25 -60 v20 h20", "none", { s: COL.ink, sw: 3 }) + (inner || "")); }
function lines(x, y, n, w, gap) { let b = ""; for (let i = 0; i < n; i++) b += R(x, y + i * gap, w - (i === n - 1 ? w * 0.35 : 0), 5, COL.line, { rx: 2.5 }); return b; }
function checkboxes() { let b = ""; for (let i = 0; i < 3; i++) { b += R(-30, -30 + i * 28, 16, 16, COL.white, { s: COL.ink, sw: 2.5 }) + R(-6, -24 + i * 28, 40, 5, COL.line, { rx: 2.5 }); } return b + P("M-28 -22 l5 6 l10 -12", "none", { s: COL.green, sw: 4 }); }
function scales(x, y, s, f) { f = f || COL.gold; return G("translate(" + num(x) + " " + num(y) + ") scale(" + num(s || 1) + ")", R(-4, -60, 8, 110, f) + R(-36, 46, 72, 10, f, { rx: 4 }) + R(-70, -54, 140, 7, f, { rx: 3 }) + Cc(0, -62, 8, f) +
  P("M-62 -50 L-82 0 M-62 -50 L-42 0 M62 -50 L42 0 M62 -50 L82 0", "none", { s: f, sw: 3 }) + P("M-88 0 Q-62 26 -36 0 Z", f) + P("M36 0 Q62 26 88 0 Z", f)); }
function gavel(x, y, s) { return G("translate(" + num(x) + " " + num(y) + ") scale(" + num(s || 1) + ") rotate(-35)", R(-50, -16, 70, 32, COL.brown, { rx: 6 }) + R(-6, 14, 12, 80, COL.brown, { rx: 4 }) + R(-56, -12, 8, 24, "#78350f", { rx: 2 }) + R(18, -12, 8, 24, "#78350f", { rx: 2 })); }
function scroll(x, y, s, inner) { return G("translate(" + num(x) + " " + num(y) + ") scale(" + num(s || 1) + ")", R(-60, -70, 120, 140, "#fef3c7", { s: "#b45309", sw: 3 }) + Cc(-60, -70, 10, "#fde68a", { s: "#b45309", sw: 3 }) + Cc(60, 70, 10, "#fde68a", { s: "#b45309", sw: 3 }) + (inner || lines(-42, -45, 6, 84, 17))); }
function house(x, y, s, f) { return G("translate(" + num(x) + " " + num(y) + ") scale(" + num(s || 1) + ")", P("M-60 -5 L0 -60 L60 -5 Z", f || "#b91c1c") + R(-46, -5, 92, 65, "#fde68a", { s: COL.ink, sw: 3 }) + R(-12, 22, 24, 38, COL.brown)); }
function coin(x, y, r, t) { return Cc(x, y, r, "#fcd34d", { s: COL.gold, sw: 4 }) + T(x, y + r * 0.36, t || "$", r * 1.0, "#92400e"); }
function calendar(x, y, s, big, f) { return G("translate(" + num(x) + " " + num(y) + ") scale(" + num(s || 1) + ")", R(-60, -55, 120, 115, COL.white, { s: COL.ink, sw: 3, rx: 10 }) + R(-60, -55, 120, 30, f || COL.red, { rx: 10 }) + R(-60, -35, 120, 10, f || COL.red) + R(-35, -66, 8, 22, COL.ink, { rx: 3 }) + R(27, -66, 8, 22, COL.ink, { rx: 3 }) + (big ? T(0, 40, big, 56, COL.ink) : "")); }
function check(x, y, s, f) { return P("M" + num(x - 30 * s) + " " + num(y) + " l" + num(22 * s) + " " + num(24 * s) + " l" + num(42 * s) + " " + num(-50 * s), "none", { s: f || COL.green, sw: 12 * s }); }
function cross(x, y, r, f) { return P("M" + num(x - r) + " " + num(y - r) + " L" + num(x + r) + " " + num(y + r) + " M" + num(x + r) + " " + num(y - r) + " L" + num(x - r) + " " + num(y + r), "none", { s: f || "#dc2626", sw: 14 }); }
function bottle(x, y, s) { return G("translate(" + num(x) + " " + num(y) + ") scale(" + num(s || 1) + ")", P("M-10 -70 h20 v30 q24 12 24 40 v70 h-68 v-70 q0 -28 24 -40 Z", "#86efac", { s: COL.green, sw: 3 }) + R(-12, -78, 24, 10, COL.brown)); }
function chain(x, y, broken) { let b = ""; const link = (cx, cy, rot) => '<ellipse cx="' + num(cx) + '" cy="' + num(cy) + '" rx="26" ry="15" fill="none" stroke="#6b7280" stroke-width="9" transform="rotate(' + rot + ' ' + num(cx) + ' ' + num(cy) + ')"/>';
  b += link(x - 80, y, -20) + link(x - 42, y - 6, 20); if (broken) b += P("M" + num(x - 12) + " " + num(y - 20) + " q 10 10 0 26", "none", { s: "#6b7280", sw: 9 }) + P("M" + num(x + 14) + " " + num(y - 18) + " q -10 10 0 26", "none", { s: "#6b7280", sw: 9 }) + P("M" + num(x - 6) + " " + num(y - 40) + " l 8 -14 M" + num(x + 4) + " " + num(y + 28) + " l 8 14", "none", { s: COL.gold, sw: 5 });
  return b + link(x + 42, y + 6, 20) + link(x + 80, y, -20); }
function speech(x, y, s) { return G("translate(" + num(x) + " " + num(y) + ") scale(" + num(s || 1) + ")", P("M-70 -50 h140 q14 0 14 14 v60 q0 14 -14 14 h-90 l-30 26 v-26 h-20 q-14 0 -14 -14 v-60 q0 -14 14 -14 Z", COL.white, { s: COL.navy, sw: 5 }) + lines(-50, -28, 3, 100, 18)); }
function shield(x, y, s, inner) { return G("translate(" + num(x) + " " + num(y) + ") scale(" + num(s || 1) + ")", P("M0 -70 L60 -50 Q60 30 0 70 Q-60 30 -60 -50 Z", COL.navy, { s: COL.gold, sw: 5 }) + (inner || star(0, -5, 30, COL.white))); }
function people3(x, y, s, fills) { fills = fills || [COL.navy, COL.red, COL.green]; return person(x - 55 * (s || 1), y + 6, (s || 1) * 0.85, fills[0]) + person(x + 55 * (s || 1), y + 6, (s || 1) * 0.85, fills[2]) + person(x, y, s || 1, fills[1]); }
function clockFace(x, y, r) { return Cc(x, y, r, COL.white, { s: COL.ink, sw: 5 }) + P("M" + num(x) + " " + num(y) + " V" + num(y - r * 0.7) + " M" + num(x) + " " + num(y) + " L" + num(x + r * 0.45) + " " + num(y + r * 0.2), "none", { s: COL.ink, sw: 6 }); }
function chairs(x, y, n, f) { let b = ""; for (let i = 0; i < n; i++) { const r = Math.floor(i / 6), c = i % 6; b += R(x - 105 + c * 36, y - 30 + r * 46, 26, 30, f || COL.brown, { rx: 5 }); } return b; }
function arrow(x1, y1, x2, y2, f) { const a = Math.atan2(y2 - y1, x2 - x1), h = 16; return P("M" + num(x1) + " " + num(y1) + " L" + num(x2) + " " + num(y2), "none", { s: f || COL.ink, sw: 7 }) + P("M" + num(x2) + " " + num(y2) + " L" + num(x2 - h * Math.cos(a - 0.5)) + " " + num(y2 - h * Math.sin(a - 0.5)) + " L" + num(x2 - h * Math.cos(a + 0.5)) + " " + num(y2 - h * Math.sin(a + 0.5)) + " Z", f || COL.ink); }
function skyline(x, y) { return R(x - 100, y - 40, 40, 80, "#94a3b8") + R(x - 56, y - 80, 44, 120, "#64748b") + R(x - 8, y - 55, 36, 95, "#94a3b8") + R(x + 32, y - 100, 40, 140, "#475569") + R(x + 76, y - 30, 30, 70, "#94a3b8"); }
function ship(x, y, s) { return G("translate(" + num(x) + " " + num(y) + ") scale(" + num(s || 1) + ")", P("M-90 20 L90 20 L66 52 L-70 52 Z", COL.brown) + R(-4, -80, 6, 100, "#78350f") + P("M6 -76 L6 10 L70 10 Z", COL.white, { s: COL.mute, sw: 2 }) + P("M-6 -60 L-6 10 L-66 10 Z", COL.white, { s: COL.mute, sw: 2 }) + P("M2 -82 l24 6 l-24 6 Z", COL.red)); }
function globe(x, y, r) { return Cc(x, y, r, "#bfdbfe", { s: COL.navy, sw: 4 }) + P("M" + num(x - r * 0.55) + " " + num(y - r * 0.55) + " q" + num(r * 0.3) + " " + num(-r * 0.2) + " " + num(r * 0.5) + " " + num(r * 0.15) + " q" + num(r * 0.1) + " " + num(r * 0.5) + " " + num(r * 0.25) + " " + num(r * 0.9) + " q" + num(-r * 0.35) + " 0 " + num(-r * 0.45) + " " + num(-r * 0.55) + " Z", "#4ade80", { s: COL.green, sw: 2 }) + '<ellipse cx="' + num(x) + '" cy="' + num(y) + '" rx="' + num(r * 0.45) + '" ry="' + num(r) + '" fill="none" stroke="' + COL.navy + '" stroke-width="2" opacity="0.5"/>' + P("M" + num(x - r) + " " + num(y) + " H" + num(x + r), "none", { s: COL.navy, sw: 2 }); }
function hand(x, y, s, f) { return G("translate(" + num(x) + " " + num(y) + ") scale(" + num(s || 1) + ")", R(-26, -10, 52, 56, f || COL.skin, { rx: 14 }) + R(-26, -52, 11, 50, f || COL.skin, { rx: 5.5 }) + R(-12, -60, 11, 56, f || COL.skin, { rx: 5.5 }) + R(2, -58, 11, 54, f || COL.skin, { rx: 5.5 }) + R(16, -48, 10, 44, f || COL.skin, { rx: 5 }) + R(-46, 0, 26, 11, f || COL.skin, { rx: 5.5, t: "rotate(-35 -33 5)" })); }

// ── holidays (Stage 2) ──
const HOLIDAY = {
  "New Year's Day": () => bg("#eef2ff") + clockFace(150, 160, 78) + Cc(60, 60, 8, COL.red) + Cc(240, 70, 7, COL.gold) + Cc(250, 240, 8, COL.green) + Cc(50, 240, 7, COL.navy) + R(90, 40, 10, 10, COL.gold, { t: "rotate(30 95 45)" }) + R(215, 120, 10, 10, COL.red, { t: "rotate(20 220 125)" }),
  "Martin Luther King Jr Day": () => bg("#ecfeff") + P("M70 170 Q120 110 190 130 Q215 90 255 92 Q230 108 232 128 Q262 150 230 182 Q180 214 110 196 Q80 190 70 170 Z", COL.white, { s: "#0e7490", sw: 4 }) + P("M120 160 Q160 70 210 60 Q190 110 190 140", "#f0f9ff", { s: "#0e7490", sw: 4 }) + Cc(238, 108, 4, COL.ink) + P("M256 100 l18 6 l-18 6 Z", COL.gold) + P("M60 230 q30 -20 60 0 t60 0", "none", { s: COL.green, sw: 6 }),
  "Presidents' Day": () => bg("#f5f3ff") + '<ellipse cx="105" cy="150" rx="62" ry="78" fill="#fde68a" stroke="' + COL.gold + '" stroke-width="7"/>' + '<ellipse cx="200" cy="150" rx="62" ry="78" fill="#fde68a" stroke="' + COL.gold + '" stroke-width="7"/>' + person(105, 182, 1.1, COL.ink) + person(200, 182, 1.1, COL.ink) + star(150, 50, 18, COL.red),
  "Memorial Day": () => bg("#f0fdf4") + R(70, 40, 8, 220, "#78716c") + G("translate(78 115)", flagBody(0, 0, 120)) + Cc(210, 225, 22, "#dc2626") + Cc(210, 225, 8, COL.ink) + P("M210 247 v30", "none", { s: COL.green, sw: 5 }),
  "Juneteenth": () => bg("#fff7ed") + Cc(150, 200, 70, "#f59e0b") + R(0, 200, 300, 100, "#16a34a", { rx: 0 }) + P("M0 200 H300", "none", { s: "#15803d", sw: 4 }) + [-60, -30, 0, 30, 60].map(a => P("M" + num(150 + 90 * Math.sin(a * Math.PI / 180)) + " " + num(200 - 90 * Math.cos(a * Math.PI / 180)) + " L" + num(150 + 120 * Math.sin(a * Math.PI / 180)) + " " + num(200 - 120 * Math.cos(a * Math.PI / 180)), "none", { s: "#f59e0b", sw: 8 })).join("") + star(150, 50, 18, COL.red),
  "Independence Day": () => bg("#0f172a") + [[90, 100, COL.red], [210, 90, "#60a5fa"], [150, 190, COL.gold2]].map(f => { let b = ""; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; b += P("M" + num(f[0] + 14 * Math.cos(a)) + " " + num(f[1] + 14 * Math.sin(a)) + " L" + num(f[0] + 55 * Math.cos(a)) + " " + num(f[1] + 55 * Math.sin(a)), "none", { s: f[2], sw: 6 }); } return b + Cc(f[0], f[1], 7, COL.white); }).join(""),
  "Labor Day": () => bg("#fefce8") + P("M60 190 Q60 90 150 86 Q240 90 240 190 Z", "#facc15", { s: "#a16207", sw: 6 }) + R(40, 186, 220, 22, "#facc15", { s: "#a16207", sw: 6, rx: 10 }) + R(138, 80, 24, 106, "#eab308"),
  "Columbus Day": () => bg("#e0f2fe") + ship(150, 165, 1.3) + P("M20 250 q30 -14 60 0 t60 0 t60 0 t60 0 t60 0", "none", { s: "#0284c7", sw: 6 }),
  "Veterans Day": () => bg("#eff6ff") + P("M110 40 L150 140 L190 40 Z", COL.red) + P("M126 40 L150 100 L174 40 Z", COL.blue) + Cc(150, 180, 62, COL.gold2, { s: COL.gold, sw: 7 }) + star(150, 180, 40, COL.white, { s: COL.gold, sw: 3 }),
  "Thanksgiving": () => bg("#fff7ed") + [-70, -42, -14, 14, 42, 70].map((a, i) => '<ellipse cx="' + num(150 + 75 * Math.sin(a * Math.PI / 180)) + '" cy="' + num(165 - 75 * Math.cos(a * Math.PI / 180)) + '" rx="22" ry="48" fill="' + ["#b45309", "#ea580c", "#facc15", "#ea580c", "#b45309", "#facc15"][i] + '" transform="rotate(' + a + ' ' + num(150 + 75 * Math.sin(a * Math.PI / 180)) + ' ' + num(165 - 75 * Math.cos(a * Math.PI / 180)) + ')"/>').join("") + Cc(150, 180, 55, "#92400e") + Cc(150, 125, 26, "#a16207") + Cc(142, 120, 4, COL.ink) + P("M150 128 l14 6 l-14 6 Z", COL.gold) + P("M146 140 q6 16 -2 22", "#dc2626", { s: "#dc2626", sw: 5 }) + P("M130 232 v28 M170 232 v28", "none", { s: COL.gold, sw: 6 }),
  "Christmas Day": () => bg("#f0fdf4") + P("M150 50 L235 230 H65 Z", "#16a34a") + P("M150 50 L210 170 H90 Z", "#15803d") + R(135, 230, 30, 40, COL.brown) + star(150, 52, 24, COL.gold2, { s: COL.gold, sw: 3 }) + Cc(120, 190, 8, COL.red) + Cc(180, 200, 8, COL.red) + Cc(150, 150, 8, COL.gold2),
};
// ── civics, amendments, history fallbacks ──
const ICON = {
  law: () => bg("#fef3c7") + R(40, 150, 140, 100, "#1e3a8a", { rx: 8 }) + R(52, 160, 116, 80, "#dbeafe") + P("M110 160 V240", "none", { s: "#1e3a8a", sw: 5 }) + gavel(205, 110, 1.1),
  citizen: () => bg("#eef2ff") + person(130, 210, 2.0, COL.navy) + R(205, 60, 5, 150, "#78716c") + G("translate(210 60)", flagBody(0, 0, 70)),
  rights: () => bg("#eef2ff") + shield(150, 150, 1.6, check(150 - 150 + 0, 0, 1.3, COL.white)),
  responsibilities: () => bg("#f0fdf4") + paper(150, 155, 1.5, checkboxes()),
  democracy: () => bg("#eef2ff") + people3(110, 195, 1.15) + ballotBox(230, 200, 0.75),
  republic: () => bg("#eef2ff") + people3(80, 220, 0.75) + arrow(140, 180, 175, 180) + dome(235, 175, 0.9),
  veto: () => bg("#fef2f2") + paper(150, 150, 1.6, lines(-30, -30, 5, 66, 18)) + cross(150, 150, 60),
  senator: () => bg("#eef2ff") + person(105, 230, 1.6, COL.navy) + person(195, 230, 1.6, COL.red) + dome(150, 95, 0.8),
  representative: () => bg("#eef2ff") + person(110, 230, 2.0, COL.navy) + Cc(215, 100, 34, "#dc2626") + P("M187 118 L215 175 L243 118 Z", "#dc2626") + Cc(215, 100, 13, COL.white),
  bill: () => bg("#f8fafc") + paper(70, 150, 0.9, lines(-30, -30, 5, 60, 18)) + arrow(115, 150, 150, 150) + dome(205, 165, 0.75) + check(225, 75, 0.8),
  governor: () => bg("#fff7ed") + person(110, 235, 1.8, COL.green) + dome(215, 140, 0.75) + star(215, 50, 20, COL.gold2, { s: COL.gold, sw: 3 }),
  mayor: () => bg("#f8fafc") + skyline(150, 190) + person(150, 270, 1.4, COL.red),
  capitol: () => bg("#eef2ff") + dome(150, 175, 1.8),
  vote: () => bg("#eef2ff") + ballotBox(150, 175, 1.5),
  election: () => bg("#eef2ff") + calendar(150, 160, 1.5, "", COL.blue) + check(150, 175, 1.2),
  ballot: () => bg("#f8fafc") + paper(150, 155, 1.6, checkboxes()),
  jury: () => bg("#fef3c7") + chairs(150, 150, 12) + scales(150, 85, 0.45),
  amendment: () => bg("#fef3c7") + scroll(130, 150, 1.2) + Cc(225, 90, 34, COL.green) + P("M225 70 V110 M205 90 H245", "none", { s: COL.white, sw: 9 }),
  ratify: () => bg("#fef3c7") + scroll(130, 150, 1.2) + P("M210 180 l-14 60 l24 -16 l24 16 l-14 -60", COL.red) + Cc(220, 165, 38, "#dc2626", { s: "#991b1b", sw: 5 }) + check(220, 165, 0.6, COL.white),
  preamble: () => bg("#fef3c7") + scroll(150, 150, 1.5, R(-42, -48, 84, 14, "#92400e", { rx: 4 }) + lines(-42, -18, 5, 84, 16)),
  monroe: () => bg("#eff6ff") + globe(130, 160, 85) + hand(235, 170, 1.0),
  seneca: () => bg("#fdf4ff") + people3(140, 210, 1.3, ["#7c3aed", "#db2777", "#7c3aed"]) + scroll(240, 95, 0.5),
  reconstruction: () => bg("#f8fafc") + house(130, 180, 1.5, "#64748b") + R(195, 90, 12, 110, COL.brown, { rx: 4, t: "rotate(30 200 145)" }) + R(215, 70, 40, 26, "#6b7280", { rx: 4, t: "rotate(30 235 83)" }),
  factory: () => bg("#f1f5f9") + P("M30 250 V150 L80 120 V150 L130 120 V150 L180 120 V150 L230 120 V250 Z", "#94a3b8", { s: "#475569", sw: 4 }) + R(240, 70, 26, 180, "#64748b") + Cc(253, 50, 14, "#cbd5e1") + Cc(268, 30, 18, "#e2e8f0") + R(60, 190, 30, 30, "#fde68a") + R(130, 190, 30, 30, "#fde68a"),
  newdeal: () => bg("#fefce8") + P("M60 170 Q60 80 150 76 Q240 80 240 170 Z", "#facc15", { s: "#a16207", sw: 6 }) + R(40, 166, 220, 22, "#facc15", { s: "#a16207", sw: 6, rx: 10 }) + T(150, 245, "", 10),
  school: () => bg("#fef2f2") + house(150, 190, 1.7, "#b91c1c") + R(138, 40, 24, 40, "#b91c1c") + P("M130 40 L150 22 L170 40 Z", "#7f1d1d") + Cc(150, 58, 7, COL.gold2),
  tribute: () => bg("#0f172a") + P("M118 270 L128 20 L142 20 L132 270 Z", "#bfdbfe") + P("M168 270 L158 20 L172 20 L182 270 Z", "#bfdbfe") + R(40, 262, 220, 14, "#334155", { rx: 4 }) + star(60, 50, 4, COL.white) + star(240, 80, 4, COL.white) + star(220, 40, 3, COL.white),
};
// amendment icons by number (number badge drawn on top)
const AMEND = {
  1: () => speech(150, 150, 1.3), 2: () => shield(150, 155, 1.5), 3: () => house(150, 160, 1.6) + cross(205, 90, 28),
  4: () => house(150, 160, 1.6, "#475569") + R(170, 170, 38, 34, COL.gold, { rx: 6 }) + P("M178 170 v-14 a11 11 0 0 1 22 0 v14", "none", { s: COL.gold, sw: 6 }),
  5: () => person(120, 220, 1.8, COL.navy) + shield(215, 135, 0.7), 6: () => chairs(150, 185, 12) + clockFace(150, 85, 40),
  7: () => chairs(150, 185, 12) + coin(150, 85, 34), 8: () => scales(150, 160, 1.4), 9: () => paper(150, 150, 1.4, lines(-30, -36, 4, 60, 18)) + Cc(205, 210, 30, COL.green) + P("M205 192 V228 M187 210 H223", "none", { s: COL.white, sw: 8 }),
  10: () => dome(95, 170, 0.9) + arrow(150, 150, 185, 150) + house(240, 175, 0.75, COL.green), 11: () => dome(130, 170, 1.1) + hand(240, 175, 0.8),
  12: () => paper(100, 155, 1.0, T(0, 10, "P", 44, COL.navy)) + paper(205, 155, 1.0, T(0, 10, "VP", 36, COL.red)), 13: () => chain(150, 150, true),
  14: () => people3(130, 210, 1.3) + shield(240, 100, 0.55), 15: () => ballotBox(150, 165, 1.2) + person(60, 250, 0.9, "#7c2d12", { skin: "#8d5524" }) + person(240, 250, 0.9, COL.navy),
  16: () => coin(110, 160, 55) + coin(190, 140, 55), 17: () => ballotBox(110, 175, 1.0) + dome(225, 175, 0.8),
  18: () => bottle(150, 170, 1.4) + cross(150, 150, 70), 19: () => ballotBox(110, 175, 1.0) + person(225, 235, 1.6, "#db2777", { hair: COL.brown }),
  20: () => calendar(150, 160, 1.5, "20", COL.blue), 21: () => bottle(130, 170, 1.3) + check(220, 100, 1.0),
  22: () => check(100, 150, 1.4) + check(205, 150, 1.4), 23: () => ballotBox(110, 175, 1.0) + star(225, 140, 55, "#dc2626", { s: "#991b1b", sw: 4 }),
  24: () => ballotBox(110, 175, 1.0) + coin(225, 130, 40) + cross(225, 130, 36), 25: () => R(105, 120, 90, 90, "#b45309", { rx: 10 }) + R(105, 80, 90, 50, "#92400e", { rx: 10 }) + R(110, 205, 14, 50, "#78350f") + R(176, 205, 14, 50, "#78350f") + arrow(40, 170, 90, 170, COL.green),
  26: () => ballotBox(110, 175, 1.0) + person(225, 235, 1.4, COL.green), 27: () => coin(105, 170, 48) + calendar(205, 160, 0.8, "", COL.blue),
};
function amendCard(n) { const f = AMEND[n]; if (!f) return null; const lab = n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"));
  return svg(bg("#fffbeb") + f() + R(14, 14, 86, 46, COL.navy, { rx: 23 }) + T(57, 47, lab, 28, COL.white)); }
// ── the three branches / levels / chambers ──
function branchCard(which) {
  const cols = [["L", 60, () => dome(0, 10, 0.55)], ["E", 150, () => house(0, 10, 0.6, "#94a3b8")], ["J", 240, () => scales(0, 0, 0.5)]];
  let b = bg("#f8fafc") + R(30, 240, 240, 18, "#78716c", { rx: 6 }) + P("M150 238 V200 M60 200 H240 M60 200 V170 M150 200 V170 M240 200 V170", "none", { s: "#78716c", sw: 8 });
  cols.forEach(c => { const lit = which === c[0]; b += Cc(c[1], 110, 54, lit ? "#fed7aa" : "#e5e7eb", { s: lit ? COL.lit : COL.line, sw: lit ? 7 : 4 }) + G("translate(" + c[1] + " 115)", c[2]()); });
  if (which === "C") b += arrow(100, 60, 200, 60, COL.lit) + arrow(200, 165, 100, 165, COL.lit) + P("M150 52 a6 6 0 1 1 0.1 0", "none");
  return svg(b);
}
function levelCard(which) { const ring = (r, k, f) => Cc(150, 150, r, which === k ? f : "#f3f4f6", { s: which === k ? COL.lit : COL.line, sw: which === k ? 8 : 4 });
  return svg(bg("#f8fafc") + ring(125, "federal", "#fed7aa") + ring(85, "state", "#fdba74") + ring(45, "local", "#fb923c") + star(150, 40, 14, which === "federal" ? COL.red : COL.line) + G("translate(150 150) scale(0.5)", house(0, 10, 1, which === "local" ? COL.red : "#9ca3af"))); }
function chamberCard(n) {   // one seat dot per member, in rows of an arc — drawn as two dotted paths (red / blue) to stay small
  const rows = n > 200 ? 9 : 5, per = []; let tot = 0, placed = 0; for (let r = 0; r < rows; r++) { const rad = 50 + r * (95 / rows); per.push(rad); tot += rad; }
  const d = ["", ""]; per.forEach((rad, r) => { const k = r === rows - 1 ? n - placed : Math.round(n * rad / tot); for (let i = 0; i < k; i++) { const a = Math.PI - (i + 0.5) * Math.PI / k; d[i % 2] += "M" + num(150 + rad * Math.cos(a)) + " " + num(220 - rad * Math.sin(a)) + "h0"; } placed += k; });
  const w = n > 200 ? 7.2 : 11.2;
  return svg(bg("#eef2ff") + P(d[0], "none", { s: COL.red, sw: w }) + P(d[1], "none", { s: COL.navy, sw: w }) + R(110, 230, 80, 30, "#78716c", { rx: 6 })); }
// ── a person with no true likeness: a badge, never an invented face (plan §6.2) ──
const BADGE = { "Squanto": ["S", "#15803d", () => P("M150 230 V160 M150 200 q-30 -10 -34 -40 M150 185 q30 -10 34 -40", "none", { s: "#15803d", sw: 7 }) + '<ellipse cx="150" cy="140" rx="16" ry="34" fill="#facc15" stroke="#a16207" stroke-width="3"/>'],
  "Sacagawea": ["S", "#b45309", () => P("M70 200 Q150 240 230 200 L220 190 Q150 220 80 190 Z", "#92400e") + P("M150 200 L120 120 M150 200 L180 120", "none", { s: "#78350f", sw: 6 })],
  "Betsy Ross": ["B", "#1e3a8a", () => R(80, 120, 140, 90, COL.white, { s: COL.mute, sw: 2 }) + (() => { let b = R(80, 120, 60, 50, COL.blue); for (let i = 0; i < 13; i++) { const a = i * 2 * Math.PI / 13; b += star(110 + 17 * Math.cos(a), 145 + 17 * Math.sin(a), 3.5); } for (let i = 0; i < 7; i++) b += R(140, 120 + i * 90 / 6.5, 80, 90 / 13, COL.red); return b; })()] };
function badgeCard(id) { const b = BADGE[id]; if (!b) return null; return svg(bg("#f8fafc") + Cc(150, 160, 120, "#ffffff", { s: b[1], sw: 8 }) + b[2]() + T(150, 95, b[0], 40, b[1])); }
function pledgeCard() { return svg(bg("#eef2ff") + flagBody(55, 22, 190) + P("M150 260 C 70 210 70 150 110 150 C 132 150 145 168 150 178 C 155 168 168 150 190 150 C 230 150 230 210 150 260 Z", "#dc2626") + hand(170, 200, 1.0)); }
function anthemCard() { const note = (x, y) => '<ellipse cx="' + x + '" cy="' + y + '" rx="17" ry="12" fill="' + COL.navy + '" transform="rotate(-20 ' + x + ' ' + y + ')"/>' + R(x + 12, y - 70, 6, 70, COL.navy) + P("M" + (x + 18) + " " + (y - 70) + " q 24 10 18 34", "none", { s: COL.navy, sw: 6 });
  return svg(bg("#eef2ff") + flagBody(30, 40, 150) + note(205, 210) + note(250, 190) + note(90, 250)); }

// ── maps (need geo.js) ──
function geoLib() { return (typeof HoweUS !== "undefined" && HoweUS.geo) || (typeof window !== "undefined" && window.HoweGeo) || null; }
function bboxOf(d) { const nums = String(d || "").match(/-?\d+(\.\d+)?/g); if (!nums || nums.length < 4) return null; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i + 1 < nums.length; i += 2) { const x = +nums[i], y = +nums[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return [x0, y0, x1, y1]; }
const COLONIES = {}; D.cards.forEach(c => { if (c.deck === "13 Colonies") COLONIES[c.name] = c.family; });
function usLayers(statesFill, extra) { const L = geoLib(); const U = L.data.us; let st = ""; for (const n in U.state) st += U.state[n];
  return R(0, 0, U.wh[0], U.wh[1], "#dbeafe") + P(U.neighbours, "#f3f4f6", { s: "#9ca3af", sw: 1.5 }) + P(st, statesFill || "#e5e7eb", { s: "#ffffff", sw: 2 }) + P(U.lakes, "#bfdbfe", { s: "#93c5fd", sw: 1 }) + (extra || ""); }
function colonyCard(name) {
  const L = geoLib(); if (!L || !L.data || !L.data.us) return null; const U = L.data.us; if (!U.state[name] || !COLONIES[name]) return null;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, tint = "";
  for (const n in COLONIES) { const b = bboxOf(U.state[n]); x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]);
    if (n !== name) tint += P(U.state[n], COL.region[COLONIES[n]] + "38", { s: "#ffffff", sw: 2 }); }
  const lb = bboxOf(U.state[name]), lw = Math.max(lb[2] - lb[0], lb[3] - lb[1]);
  const lit = P(U.state[name], COL.region[COLONIES[name]], { s: "#1f2937", sw: 3 }) +   // a speck (Rhode Island, Delaware…) gets a ring so it shows
    (lw < 45 ? Cc((lb[0] + lb[2]) / 2, (lb[1] + lb[3]) / 2, Math.max(28, lw * 0.9), COL.region[COLONIES[name]] + "33", { s: COL.region[COLONIES[name]], sw: 5 }) : "");
  const w = x1 - x0, h = y1 - y0, s = Math.max(w, h) * 1.12, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return svg(usLayers(null, tint + lit), num(cx - s / 2) + " " + num(cy - s / 2) + " " + num(s) + " " + num(s));
}
function pinCard(name) {
  const L = geoLib(); const p = D.pins[name]; if (!L || !L.data || !p) return null;
  if (p[0] === "route") { const pts = p.slice(1); let d = "M" + pts.map(q => num(q[0]) + " " + num(q[1])).join(" L");
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    const body = usLayers(null, P(d, "none", { s: "#dc2626", sw: 7 }) + arrow(a[0], a[1], b[0], b[1], "#dc2626") + Cc(pts[0][0], pts[0][1], 9, "#dc2626", { s: "#ffffff", sw: 3 }));
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]); const s = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.6, cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    return svg(body, num(cx - s / 2) + " " + num(Math.max(0, cy - s / 2)) + " " + num(s) + " " + num(s)); }
  const [frame, x, y] = p;
  const mark = (r, k) => Cc(x, y, r * 1.55, "#ffffff", { s: "#dc2626", sw: 3 * k }) + star(x, y, r, "#dc2626", { s: "#ffffff", sw: 2 * k });
  if (frame === "us" || frame === "hi") { const U = L.data.us; const s = frame === "hi" ? 170 : 360; const vx = Math.max(0, Math.min(U.wh[0] - s, x - s / 2)), vy = Math.max(0, Math.min(U.wh[1] - s, y - s / 2));
    return svg(usLayers(null, mark(frame === "hi" ? 13 : 26, s / 360)), num(vx) + " " + num(vy) + " " + s + " " + s); }
  const W = L.data.world; const s = 300; const vx = Math.max(0, Math.min(W.wh[0] - s, x - s / 2)), vy = Math.max(0, Math.min(W.wh[1] - s, y - s / 2));
  return svg(R(0, 0, W.wh[0], W.wh[1], "#dbeafe") + P(W.land, "#e5e7eb", { s: "#9ca3af", sw: 1.2 }) + mark(20, 0.8), num(vx) + " " + num(vy) + " " + s + " " + s);
}

// ── the API ──
const BY = {}; D.cards.forEach(c => { BY[c.deck + "\u0001" + c.name] = c; });
function card(deck, name) { return BY[deck + "\u0001" + name] || null; }
function photo(id) { const P2 = (typeof window !== "undefined" && window.HoweUSPics) || (typeof HoweUS !== "undefined" && HoweUS.pics) || null; return (P2 && P2[id]) || null; }
function text(spec) {   // a drawn picture's SVG text (photos have none)
  if (!spec) return null; const i = spec.indexOf(":"), k = i < 0 ? spec : spec.slice(0, i), a = i < 0 ? "" : spec.slice(i + 1);
  switch (k) {
    case "flag": return flag(); case "pledge": return pledgeCard(); case "anthem": return anthemCard();
    case "holiday": return HOLIDAY[a] ? svg(HOLIDAY[a]()) : null; case "icon": return ICON[a] ? svg(ICON[a]()) : null;
    case "amend": return amendCard(+a); case "branch": return branchCard(a); case "level": return levelCard(a); case "chamber": return chamberCard(+a);
    case "badge": return badgeCard(a); case "colony": return colonyCard(a); case "pin": return pinCard(a);
  }
  return null;
}
function pic(deck, name) { const c = card(deck, name); return c ? c.pic || null : null; }
function svgFor(deck, name) { const p = pic(deck, name); if (!p) return null; if (p.indexOf("photo:") === 0) return photo(p.slice(6)); return uri(text(p)); }
function creditFor(deck, name) { const p = pic(deck, name); if (!p) return ""; if (p.indexOf("photo:") === 0) { const c = D.credits[p]; return c ? c.line : ""; }
  if (/^(colony|pin):/.test(p)) return D.credits.map.line; return D.credits.drawing.line; }
const HoweUS = { version: D.v, data: D, unit: D.unit, stages: D.stages, decks: D.decks, cards: D.cards, card, pic, text, svg: svgFor, credit: creditFor,
  credits: D.credits, uscis: D.uscis, colors: COL, geo: null, pics: null, holidays: Object.keys(HOLIDAY), icons: Object.keys(ICON), amendIcons: Object.keys(AMEND).map(Number), badges: Object.keys(BADGE) };
if (typeof window !== "undefined") window.HoweUS = HoweUS;
if (typeof module !== "undefined" && module.exports) module.exports = HoweUS;
