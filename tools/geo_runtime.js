// geo_runtime.js — the runtime half of geo.js (tools/build_geo_js.py pastes it after GEO_DATA). Composes one card
// picture at a time from the projected paths and returns it as an SVG data URI, so the app's picture pipeline
// (_unitPortrait → mastLiveVisual → <img src>) needs no change. Pure: no DOM, no network, no app globals; also loads
// in Node for test_geo_data.js (module.exports) and in the browser (window.HoweGeo).
const G = GEO_DATA;
// Okabe–Ito palette (colour-blind safe) — the plan's §6.3 / §8 row 12 default. Antarctica is slate so it shows on a pale map.
const COL = {
  cont: { "North America": "#E69F00", "South America": "#D55E00", "Europe": "#CC79A7", "Asia": "#F0E442", "Africa": "#009E73", "Australia": "#56B4E9", "Antarctica": "#94A3B8" },
  region: { "Northeast": "#0072B2", "Southeast": "#E69F00", "Midwest": "#009E73", "Southwest": "#D55E00", "West": "#CC79A7" },
  land: "#e5e7eb", landLine: "#9ca3af", sea: "#dbeafe", seaLit: "#2563eb", lit: "#f97316", litLine: "#9a3412", ink: "#1f2937", mute: "#6b7280",
  water: "#3b82f6", green: "#16a34a", sand: "#f5d58a", rock: "#a8a29e", sky: "#e0f2fe", sun: "#f59e0b", snow: "#f8fafc" };
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const num = v => (Math.round(v * 10) / 10).toString();
function svg(w, h, body, vb) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (vb || ("0 0 " + w + " " + h)) + '" width="' + w + '" height="' + h + '">' + body + '</svg>'; }
function P(d, fill, stroke, sw, extra) { if (!d) return ""; return '<path d="' + d + '" fill="' + (fill || "none") + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + (sw || 1) + '" stroke-linejoin="round" stroke-linecap="round"' : "") + (extra || "") + '/>'; }
function bboxOf(d) {   // bounding box of a path string (M/L absolute, one decimal)
  const nums = d.match(/-?\d+(\.\d+)?/g); if (!nums || nums.length < 4) return null;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i + 1 < nums.length; i += 2) { const x = +nums[i], y = +nums[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return [x0, y0, x1, y1];
}
function padBox(b, pad, minSize, limit) {   // square-ish viewBox around a box, padded, never past the limit box
  let w = b[2] - b[0], h = b[3] - b[1]; const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
  let s = Math.max(w, h) * (1 + pad * 2); if (minSize && s < minSize) s = minSize;
  let x = cx - s / 2, y = cy - s / 2;
  if (limit) { s = Math.min(s, Math.max(limit[2] - limit[0], limit[3] - limit[1])); x = Math.max(limit[0], Math.min(x, limit[2] - s)); y = Math.max(limit[1], Math.min(y, limit[3] - s)); }
  return num(x) + " " + num(y) + " " + num(s) + " " + num(s);
}
const contOf = name => { for (const c in G.country) if (G.country[c][name]) return c; return null; };

// ── building blocks ──
function globeBody(view, o) {   // the disc, every land pale, the view's own continent optionally lit; borders of its countries optional
  o = o || {}; const g = G.globe[view]; if (!g) return ""; const k = o.k || 1;   // k: stroke scale for a zoomed view
  let b = '<circle cx="500" cy="500" r="500" fill="' + COL.sea + '"/>' + P(g.land, COL.land, COL.landLine, (o.thin ? 1.2 : 2) * k);
  if (o.hi) b += edged(g.hi, o.hiFill || COL.cont[view] || COL.lit, o.hiLine || COL.litLine, (o.thin ? 1.2 : 2.5) * k, "");
  if (o.borders) b += P(g.borders, "none", "#ffffff", 1.6 * k);
  return b;
}
function globe(view, o) {   // a whole globe (1000-box) or a zoom (viewBox around a box); o.extra may be a function of k
  o = o || {};
  const vb = o.zoomBox ? padBox(o.zoomBox, o.pad == null ? 0.12 : o.pad, o.minSize || 0, [0, 0, 1000, 1000]) : null;
  const k = vb ? (+vb.split(" ")[2]) / 1000 : 1;
  const extra = typeof o.extra === "function" ? o.extra(k) : (o.extra || "");
  const body = globeBody(view, Object.assign({}, o, { k: k })) + extra + (o.outlineOnly ? "" : '<circle cx="500" cy="500" r="500" fill="none" stroke="' + COL.mute + '" stroke-width="' + num(3 * k) + '"/>');
  return svg(o.size || 300, o.size || 300, body, vb);
}
// the frame a small thing is shown in: at least ~3× its own size, never past the continent's box
function frameFor(own, contBox) { if (!own) return contBox; const s = Math.max(Math.max(own[2] - own[0], own[3] - own[1]) * 3.2, 150); const cs = Math.max(contBox[2] - contBox[0], contBox[3] - contBox[1]); if (s >= cs * 0.8) return contBox; const cx = (own[0] + own[2]) / 2, cy = (own[1] + own[3]) / 2; return [cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2]; }
function silhouette(d, wh, size, fill, stroke, o) {   // a fitted shape (100-box) scaled into size×size and centred
  o = o || {}; const s = size / 100; const w = wh[0] * s, h = wh[1] * s; const tx = (size - w) / 2, ty = (size - h) / 2;
  return '<g transform="translate(' + num(tx) + ' ' + num(ty) + ') scale(' + num(s) + ')">' + edged(d, o.outline ? "none" : fill, stroke, (o.outline ? 2.4 : 1.6) / s, o.trace ? ' stroke-dasharray="' + num(6 / s) + ' ' + num(5 / s) + '"' : "", o.outline) + '</g>';
}
// A shape made of several rings (a continent = its countries) drawn as ONE silhouette: the edge first, the fill on top,
// so the seams between rings disappear and only the outer edge shows. Outline mode strokes the rings as they are.
function edged(d, fill, stroke, sw, extra, outline) {
  if (outline || fill === "none") return P(d, "none", stroke, sw, extra);
  return P(d, stroke, stroke, sw * 2, extra) + P(d, fill, "none", 0, "");
}
function inset(x, y, size, inner) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + num(size / 1000) + ')">' + inner + '</g>'; }
function usBody(o) {   // the Albers-USA map: neighbours pale, states outlined, lakes, one thing lit
  o = o || {}; const U = G.us; let b = '<rect x="0" y="0" width="' + U.wh[0] + '" height="' + U.wh[1] + '" fill="' + COL.sea + '"/>';
  b += P(U.neighbours, "#f3f4f6", COL.landLine, 1.5);
  let states = ""; for (const n in U.state) states += U.state[n]; b += P(states, o.statesFill || COL.land, "#ffffff", o.thin ? 1.2 : 2);
  b += P(U.lakes, o.lakesFill || "#bfdbfe", "#93c5fd", 1);
  return b + (o.extra || "");
}
function usMap(o) { o = o || {}; const U = G.us; const vb = o.zoomBox ? padBox(o.zoomBox, o.pad == null ? 0.15 : o.pad, o.minSize || 0, [0, 0, U.wh[0], U.wh[1]]) : "0 0 " + U.wh[0] + " " + U.wh[1]; return svg(o.w || 300, o.h || Math.round(300 * U.wh[1] / U.wh[0]), usBody(o), vb); }
function worldBody(o) { o = o || {}; const W = G.world; return '<rect x="0" y="0" width="' + W.wh[0] + '" height="' + W.wh[1] + '" fill="#ffffff"/>' + P(W.outline, COL.sea, COL.mute, 1.5) + (o.oceansLit ? P(Object.keys(W.ocean).map(k => W.ocean[k]).join(""), o.oceansLit, "none") : "") + (o.ocean ? P(W.ocean[o.ocean], COL.seaLit, "none") : "") + P(W.land, COL.land, COL.landLine, 1.4) + (o.extra || ""); }
function world(o) { o = o || {}; const W = G.world; return svg(o.w || 300, o.h || Math.round(300 * W.wh[1] / W.wh[0]), worldBody(o), "0 0 " + W.wh[0] + " " + W.wh[1]); }
function dot(x, y, r, fill, k) { return '<circle cx="' + num(x) + '" cy="' + num(y) + '" r="' + num(r || 9) + '" fill="' + (fill || "#111827") + '" stroke="#ffffff" stroke-width="' + num(3 * (k || 1)) + '"/>'; }
function label(x, y, t, size, fill, anchor) { return '<text x="' + num(x) + '" y="' + num(y) + '" font-family="DM Sans, Nunito, sans-serif" font-size="' + (size || 14) + '" font-weight="700" fill="' + (fill || COL.ink) + '" text-anchor="' + (anchor || "middle") + '">' + esc(t) + '</text>'; }

// ── the cards ──
function continentCard(name, o) {   // silhouette in its colour + a little globe with it lit (Stage 1)
  o = o || {}; const c = G.cont[name]; if (!c) return null;
  const S = o.size || 300; const fill = o.fill || COL.cont[name] || COL.lit;
  let b = silhouette(c.d, c.wh, S * 0.82, fill, o.outline ? COL.ink : COL.litLine, o);
  b = '<g transform="translate(' + num(S * 0.0) + ' ' + num(S * 0.02) + ')">' + b + '</g>';
  if (!o.noInset) b += inset(S - S * 0.34, S - S * 0.34, S * 0.32, globeBody(name, { hi: true, hiFill: fill, thin: true }) + '<circle cx="500" cy="500" r="500" fill="none" stroke="' + COL.mute + '" stroke-width="6"/>');
  return svg(S, S, b);
}
function oceanCard(name, o) { o = o || {}; if (!G.world.ocean[name]) return null; return world({ ocean: name, w: o.size || 300 }); }
function stateCard(name, o) {   // outline in the region colour + the US inset with the state lit (Stage 4; Stage 5 rides on the same key)
  o = o || {}; const s = G.state[name]; if (!s) return null;
  const S = o.size || 300; const fill = o.fill || (o.region && COL.region[o.region]) || COL.lit;
  let b = '<g transform="translate(0 ' + num(S * 0.02) + ')">' + silhouette(s.d, s.wh, S * 0.78, fill, o.outline ? COL.ink : COL.litLine, o) + '</g>';
  if (o.capital !== false && G.stcap[name] && !o.outline) { /* the capital dot sits on the US inset, not the silhouette (no projection for the fitted shape) */ }
  if (!o.noInset) {
    const U = G.us; const iw = S * 0.42, ih = iw * U.wh[1] / U.wh[0];
    let inner = usBody({ thin: true, extra: P(U.state[name], fill, COL.litLine, 2) + (G.stcap[name] && o.capital ? dot(G.stcap[name][0], G.stcap[name][1], 12) : "") });
    b += '<g transform="translate(' + num(S - iw - 4) + ' ' + num(S - ih - 4) + ') scale(' + num(iw / U.wh[0]) + ')">' + inner + '<rect x="0" y="0" width="' + U.wh[0] + '" height="' + U.wh[1] + '" fill="none" stroke="' + COL.mute + '" stroke-width="4"/></g>';
  }
  return svg(S, S, b);
}
function countryCard(name, o) {   // the continent's globe view, zoomed to the continent, the country lit, its capital dotted (Stages 6/7)
  o = o || {}; const view = o.cont || contOf(name); if (!view) return null;
  const d = G.country[view][name]; const g = G.globe[view];
  const cap = G.cap[name];
  const own = bboxOf(d); const frame = frameFor(own, g.box);   // the continent, or a small country with its neighbourhood
  const extra = k => P(d, o.outline ? "none" : (o.fill || COL.lit), o.outline ? COL.ink : COL.litLine, 2.5 * k) + (cap && o.capital !== false && !o.outline ? dot(cap[0], cap[1], Math.max(1.2, 10 * k), "#111827", k) : "");
  return globe(view, { borders: true, extra: extra, zoomBox: frame, pad: frame === g.box ? 0.08 : 0.05, size: o.size || 300 });
}
function featureCard(name, o) {   // a river, range, region, marine feature or lake lit on its continent globe (Stages 3, 9 and the landform words)
  o = o || {}; const F = G.river[name] || G.range[name] || G.region[name] || G.marine[name] || G.lake[name]; if (!F) return null;
  const isLine = !!G.river[name]; const g = G.globe[F.view]; const water = !!(G.marine[name] || G.lake[name]);
  const own = bboxOf(F.d); const frame = frameFor(own, g.box);
  const extra = k => isLine ? P(F.d, "none", o.fill || COL.seaLit, Math.max(9 * k, 1.2)) : P(F.d, o.fill || (water ? COL.seaLit : COL.lit), water ? "#1e40af" : COL.litLine, 2 * k);
  return globe(F.view, { borders: !!o.borders, extra: extra, zoomBox: frame, pad: frame === g.box ? 0.08 : 0.05, size: o.size || 300 });
}
function usFeatureCard(name, o) {   // Stage 3: on the Albers-USA map — United States, Washington DC, the Gulf, the Great Lakes, the Mississippi, the Rockies, the Appalachians, Alaska, Hawaii, Canada/Mexico via the globe
  o = o || {}; const U = G.us; let extra = "", zoomBox = null;
  if (name === "United States") { let all = ""; for (const n in U.state) all += U.state[n]; return usMap({ statesFill: COL.lit, w: o.size || 300 }); }
  if (name === "Washington DC" && U.dc) extra = dot(U.dc[0], U.dc[1], 16, "#dc2626") + '<circle cx="' + U.dc[0] + '" cy="' + U.dc[1] + '" r="34" fill="none" stroke="#dc2626" stroke-width="5"/>';
  else if (name === "Gulf of Mexico") extra = P(U.gulf, COL.seaLit, "#1e40af", 2);
  else if (name === "Chesapeake Bay") { extra = P(U.chesapeake, COL.seaLit, "#1e40af", 2); zoomBox = bboxOf(U.chesapeake); }
  else if (name === "Great Lakes") { extra = P(U.lakes, COL.seaLit, "#1e40af", 2); zoomBox = bboxOf(U.lakes); }
  else if (name === "Mississippi River") extra = P(U.river.Mississippi, "none", COL.seaLit, 14);
  else if (name === "Tributaries") extra = P(U.river.Mississippi, "none", COL.seaLit, 14) + P(U.river.Missouri + U.river.Ohio, "none", COL.lit, 10);
  else if (U.range[name]) extra = P(U.range[name], COL.lit, COL.litLine, 2);
  else if (name === "Alaska" || name === "Hawaii") { extra = P(U.state[name], COL.lit, COL.litLine, 2); zoomBox = bboxOf(U.state[name]); }
  else if (G.state[name]) { extra = P(U.state[name], o.fill || COL.lit, COL.litLine, 2); }
  else return null;
  return usMap({ extra: extra, zoomBox: zoomBox, pad: 0.6, minSize: 220, w: o.size || 300 });
}

// ── drawn diagrams for the words that have no map (own work) — every one in a 300×300 box ──
const land = (d, f) => P(d, f || COL.green, "#166534", 3);
const DRAW = {
  "globe": () => svg(300, 300, '<g transform="scale(0.3)">' + globeBody("North America", {}) + '<circle cx="500" cy="500" r="500" fill="none" stroke="#374151" stroke-width="8"/><ellipse cx="500" cy="500" rx="500" ry="170" fill="none" stroke="#374151" stroke-width="4"/><ellipse cx="500" cy="500" rx="170" ry="500" fill="none" stroke="#374151" stroke-width="4"/></g>' + '<rect x="130" y="290" width="40" height="10" fill="#6b7280"/><rect x="146" y="270" width="8" height="22" fill="#6b7280"/>'),
  "map": () => svg(300, 300, '<g transform="translate(0 55) scale(0.3)">' + worldBody({}) + '</g><rect x="0" y="55" width="300" height="152" fill="none" stroke="#374151" stroke-width="3"/>'),
  "equator": () => svg(300, 300, '<g transform="scale(0.3)">' + globeBody("Africa", {}) + '<circle cx="500" cy="500" r="500" fill="none" stroke="#374151" stroke-width="6"/><path d="M0 500L1000 500" stroke="#dc2626" stroke-width="18" stroke-dasharray="40 24"/></g>'),
  "North Pole": () => svg(300, 300, '<g transform="scale(0.3)">' + globeBody("Europe", {}) + '<circle cx="500" cy="500" r="500" fill="none" stroke="#374151" stroke-width="6"/></g>' + dot(150, 14, 12, "#dc2626") + '<path d="M150 14L150 -20" stroke="#dc2626" stroke-width="6"/>' + label(150, 48, "N", 30, "#dc2626")),
  "South Pole": () => svg(300, 300, '<g transform="scale(0.3)">' + globeBody("Antarctica", { hi: true, hiFill: COL.snow, hiLine: "#94a3b8" }) + '<circle cx="500" cy="500" r="500" fill="none" stroke="#374151" stroke-width="6"/></g>' + dot(150, 150, 12, "#dc2626") + label(150, 190, "S", 30, "#dc2626")),
  "Northern Hemisphere": () => svg(300, 300, '<g transform="scale(0.3)">' + globeBody("Africa", {}) + '<path d="M0 500A500 500 0 0 1 1000 500Z" fill="#f97316" fill-opacity="0.45"/><path d="M0 500L1000 500" stroke="#dc2626" stroke-width="12"/><circle cx="500" cy="500" r="500" fill="none" stroke="#374151" stroke-width="6"/></g>'),
  "Southern Hemisphere": () => svg(300, 300, '<g transform="scale(0.3)">' + globeBody("Africa", {}) + '<path d="M0 500A500 500 0 0 0 1000 500Z" fill="#f97316" fill-opacity="0.45"/><path d="M0 500L1000 500" stroke="#dc2626" stroke-width="12"/><circle cx="500" cy="500" r="500" fill="none" stroke="#374151" stroke-width="6"/></g>'),
  "compass rose": () => compass({}),
  "north": () => compass({ lit: "N" }), "south": () => compass({ lit: "S" }), "east": () => compass({ lit: "E" }), "west": () => compass({ lit: "W" }),
  "cardinal directions": () => compass({ lit: "NSEW" }), "intermediate directions": () => compass({ inter: true, lit: "NE SE SW NW" }),
  "map key": () => svg(300, 300, '<rect x="30" y="40" width="240" height="220" rx="14" fill="#fffbeb" stroke="#374151" stroke-width="3"/>' + label(150, 78, "Map Key", 24) + '<rect x="55" y="105" width="34" height="22" fill="' + COL.water + '"/>' + label(100, 123, "water", 17, COL.ink, "start") + '<rect x="55" y="145" width="34" height="22" fill="' + COL.green + '"/>' + label(100, 163, "forest", 17, COL.ink, "start") + '<path d="M55 205L89 205" stroke="#dc2626" stroke-width="5"/>' + label(100, 211, "road", 17, COL.ink, "start") + '<circle cx="72" cy="240" r="8" fill="#111827"/>' + label(100, 246, "city", 17, COL.ink, "start")),
  "lines of latitude": () => world({ extra: P(G.world.lat30, "none", "#dc2626", 4) + P(G.world.equator, "none", "#dc2626", 6) }),
  "lines of longitude": () => world({ extra: P(G.world.lon30, "none", "#dc2626", 4) }),
  "prime meridian": () => svg(300, 300, '<g transform="scale(0.3)">' + globeBody("Africa", {}) + '<circle cx="500" cy="500" r="500" fill="none" stroke="#374151" stroke-width="6"/><path d="M' + primeX() + ' 0L' + primeX() + ' 1000" stroke="#dc2626" stroke-width="16"/></g>' + label(150, 290, "0°", 24, "#dc2626")),
  "map scale": () => svg(300, 300, '<g transform="translate(0 30) scale(0.3)">' + usBody({ thin: true }) + '</g><rect x="40" y="235" width="220" height="16" fill="#ffffff" stroke="#111827" stroke-width="2"/><rect x="40" y="235" width="55" height="16" fill="#111827"/><rect x="150" y="235" width="55" height="16" fill="#111827"/>' + label(40, 275, "0", 14) + label(150, 275, "500", 14) + label(260, 275, "1,000 miles", 14)),
  "elevation": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.sky + '"/><path d="M0 230L300 230L300 300L0 300Z" fill="' + COL.water + '"/><path d="M0 230L60 200L120 110L170 160L220 60L270 150L300 170L300 230Z" fill="' + COL.green + '" stroke="#166534" stroke-width="3"/><path d="M0 230L300 230" stroke="#1e3a8a" stroke-width="3" stroke-dasharray="8 6"/>' + label(292, 222, "sea level", 13, "#1e3a8a", "end") + '<path d="M220 60L220 230" stroke="#dc2626" stroke-width="3" stroke-dasharray="6 5"/>' + label(228, 150, "how high?", 14, "#dc2626", "start")),
  "sea level": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.sky + '"/><path d="M0 170L300 170L300 300L0 300Z" fill="' + COL.water + '"/><path d="M0 170L90 100L150 150L230 70L300 140L300 170Z" fill="' + COL.green + '" stroke="#166534" stroke-width="3"/><path d="M0 170L300 170" stroke="#1e3a8a" stroke-width="4"/>' + label(150, 200, "sea level = 0 feet", 17, "#ffffff")),
  "contour lines": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="#fffbeb"/>' + [120, 95, 70, 45, 22].map((r, i) => '<ellipse cx="150" cy="150" rx="' + (r * 1.15) + '" ry="' + r + '" fill="none" stroke="#9a3412" stroke-width="' + (i === 0 ? 3 : 2) + '"/>').join("") + label(150, 154, "▲", 18, "#9a3412") + label(150, 285, "each line = the same height", 14, COL.mute)),
  "time zone": () => world({ extra: P(G.world.lon30, "none", "#374151", 2) + [2, 5, 8].map(k => '<rect x="' + (k * 1000 / 12) + '" y="0" width="' + (1000 / 12) + '" height="' + G.world.wh[1] + '" fill="#f97316" fill-opacity="0.35"/>').join("") }),
  "peak": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.sky + '"/><path d="M0 290L110 90L150 150L200 50L300 290Z" fill="' + COL.rock + '" stroke="#57534e" stroke-width="3"/><path d="M200 50L182 88L218 88Z" fill="' + COL.snow + '"/>' + dot(200, 50, 10, "#dc2626") + label(200, 32, "peak", 18, "#dc2626")),
  "valley": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.sky + '"/><path d="M0 60L90 220L150 240L210 220L300 60L300 300L0 300Z" fill="' + COL.green + '" stroke="#166534" stroke-width="3"/><path d="M0 60L90 220L150 240L210 220L300 60" fill="none" stroke="#166534" stroke-width="3"/><path d="M60 300L130 240L150 245L170 240L240 300Z" fill="#86efac"/><path d="M150 240L150 300" stroke="' + COL.water + '" stroke-width="8"/>' + label(150, 200, "valley", 18, "#14532d")),
  "plain": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.sky + '"/><path d="M0 170L300 170L300 300L0 300Z" fill="#86efac"/><path d="M0 170L300 170" stroke="#166534" stroke-width="3"/><path d="M0 165L45 150L90 165L140 148L190 165L240 152L300 165" fill="none" stroke="#166534" stroke-width="2"/><circle cx="250" cy="70" r="30" fill="' + COL.sun + '"/>' + label(150, 250, "wide and flat", 18, "#14532d")),
  "plateau": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.sky + '"/><path d="M0 290L40 290L70 110L230 110L260 290L300 290L300 300L0 300Z" fill="#d6a56d" stroke="#92400e" stroke-width="3"/><path d="M70 110L230 110" stroke="#92400e" stroke-width="4"/>' + label(150, 90, "high and flat on top", 15, "#92400e")),
  "canyon": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.sky + '"/><path d="M0 80L110 80L120 150L135 230L150 260L165 230L180 150L190 80L300 80L300 300L0 300Z" fill="#d6a56d" stroke="#92400e" stroke-width="3"/><path d="M0 120L110 125M0 170L118 172M190 125L300 120M184 172L300 170" stroke="#b45309" stroke-width="2"/><path d="M140 262L160 262" stroke="' + COL.water + '" stroke-width="8"/>' + label(150, 50, "a deep, steep valley", 15, "#92400e")),
  "island": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.water + '"/><path d="M80 170C70 120 120 80 170 90C230 100 240 160 210 200C180 240 100 230 80 170Z" fill="' + COL.sand + '" stroke="#b45309" stroke-width="3"/><path d="M110 165C110 130 150 110 180 125C205 138 205 180 180 195C150 210 112 200 110 165Z" fill="' + COL.green + '"/>'),
  "lake": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.green + '"/><path d="M80 170C70 120 120 80 170 90C230 100 240 160 210 200C180 240 100 230 80 170Z" fill="' + COL.water + '" stroke="#1e3a8a" stroke-width="3"/>'),
  "river": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.green + '"/><path d="M60 0C120 60 40 110 110 160C180 210 110 260 170 300" fill="none" stroke="' + COL.water + '" stroke-width="22" stroke-linecap="round"/><path d="M200 0C190 50 150 70 140 110" fill="none" stroke="' + COL.water + '" stroke-width="10"/>'),
  "mountain": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.sky + '"/><path d="M0 290L90 120L140 190L200 60L300 290Z" fill="' + COL.rock + '" stroke="#57534e" stroke-width="3"/><path d="M200 60L178 100L222 100Z" fill="' + COL.snow + '"/><path d="M90 120L76 148L104 148Z" fill="' + COL.snow + '"/>'),
  "desert": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="#fde68a"/><circle cx="240" cy="60" r="34" fill="' + COL.sun + '"/><path d="M0 220C60 180 120 180 180 215C230 245 270 230 300 215L300 300L0 300Z" fill="' + COL.sand + '"/><path d="M0 250C70 225 130 230 200 260C250 280 280 270 300 260" fill="none" stroke="#d97706" stroke-width="3"/><path d="M60 200L60 160M60 180C45 180 45 160 60 160M60 185C75 185 75 165 60 165" stroke="#15803d" stroke-width="6" fill="none"/>'),
  "coast": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.water + '"/><path d="M0 0L130 0C110 50 160 90 130 140C100 190 150 240 120 300L0 300Z" fill="' + COL.green + '" stroke="#166534" stroke-width="3"/><path d="M130 0C110 50 160 90 130 140C100 190 150 240 120 300" fill="none" stroke="' + COL.sand + '" stroke-width="12"/>' + label(215, 160, "sea", 18, "#ffffff") + label(60, 160, "land", 18, "#ffffff")),
  "bay": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.green + '"/><path d="M300 40C200 60 120 110 110 170C100 230 180 270 300 260Z" fill="' + COL.water + '" stroke="#1e3a8a" stroke-width="3"/>' + label(215, 160, "bay", 20, "#ffffff")),
  "peninsula": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.water + '"/><path d="M0 0L300 0L300 70L190 80C150 90 140 150 150 210C155 250 130 280 90 290L60 300L0 300Z" fill="' + COL.green + '" stroke="#166534" stroke-width="3"/>' + label(95, 200, "land", 18, "#ffffff") + label(235, 190, "water", 16, "#ffffff")),
  "isthmus": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.water + '"/><path d="M0 0L300 0L300 70C230 90 190 110 160 150C140 180 150 210 170 240C200 280 260 290 300 300L0 300L0 240C60 230 110 200 135 160C150 130 120 90 60 70L0 60Z" fill="' + COL.green + '" stroke="#166534" stroke-width="3"/>' + label(150, 200, "narrow", 15, "#ffffff")),
  "archipelago": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.water + '"/>' + [[60, 80, 28, 18], [120, 60, 20, 14], [170, 110, 34, 22], [230, 90, 18, 12], [90, 170, 24, 16], [160, 200, 30, 20], [240, 180, 22, 14], [120, 250, 26, 15], [210, 250, 18, 12]].map(e => '<ellipse cx="' + e[0] + '" cy="' + e[1] + '" rx="' + e[2] + '" ry="' + e[3] + '" fill="' + COL.green + '" stroke="#166534" stroke-width="2"/>').join("")),
  "delta": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.green + '"/><path d="M0 230L300 230L300 300L0 300Z" fill="' + COL.water + '"/><path d="M150 0L150 110" stroke="' + COL.water + '" stroke-width="18"/><path d="M150 110L80 232M150 110L130 232M150 110L175 232M150 110L225 232" stroke="' + COL.water + '" stroke-width="9" fill="none"/><path d="M150 110L80 232L225 232Z" fill="#86efac" fill-opacity="0.5"/>'),
  "strait": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.water + '"/><path d="M0 0L300 0L300 110C220 120 180 120 150 130C120 120 80 120 0 110Z" fill="' + COL.green + '" stroke="#166534" stroke-width="3"/><path d="M0 300L300 300L300 190C220 180 180 180 150 170C120 180 80 180 0 190Z" fill="' + COL.green + '" stroke="#166534" stroke-width="3"/>' + label(150, 158, "narrow water", 14, "#ffffff")),
  "gulf": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.green + '"/><path d="M300 20C150 30 70 100 70 170C70 240 160 290 300 280Z" fill="' + COL.water + '" stroke="#1e3a8a" stroke-width="3"/>' + label(200, 160, "gulf", 22, "#ffffff")),
  "glacier": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.sky + '"/><path d="M0 290L70 110L140 170L220 40L300 290Z" fill="' + COL.rock + '" stroke="#57534e" stroke-width="3"/><path d="M160 150C200 130 230 140 240 180C250 220 215 260 170 290L110 290C130 250 120 190 160 150Z" fill="#dbeafe" stroke="#60a5fa" stroke-width="3"/><path d="M175 180L170 270M205 185L200 265" stroke="#93c5fd" stroke-width="3"/>'),
  "fjord": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.rock + '"/><path d="M0 300L0 220C40 200 60 150 90 130C120 110 150 120 170 90C190 60 220 50 300 40L300 0L0 0Z" fill="' + COL.rock + '"/><path d="M130 300C120 240 110 200 125 160C140 120 170 100 200 60C230 20 260 10 300 0L300 300Z" fill="' + COL.water + '"/><path d="M0 300L130 300C120 240 110 200 125 160C140 120 170 100 200 60C230 20 260 10 300 0" fill="none" stroke="#57534e" stroke-width="4"/><path d="M0 300L0 230L60 300Z" fill="' + COL.water + '"/>' + label(70, 120, "cliffs", 16, "#ffffff")),
  "oasis": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="#fde68a"/><circle cx="60" cy="50" r="28" fill="' + COL.sun + '"/><ellipse cx="160" cy="215" rx="90" ry="38" fill="' + COL.water + '"/><ellipse cx="160" cy="215" rx="120" ry="60" fill="none" stroke="' + COL.green + '" stroke-width="10"/><path d="M120 190L120 110M120 120C95 120 90 90 120 95M120 125C145 125 150 95 120 100M200 180L200 100M200 110C175 110 170 80 200 85M200 115C225 115 230 85 200 90" stroke="#15803d" stroke-width="6" fill="none"/>'),
  "savanna": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="#fef3c7"/><circle cx="250" cy="60" r="30" fill="' + COL.sun + '"/><rect x="0" y="190" width="300" height="110" fill="#d9c270"/><path d="M60 190L60 120M60 120C20 120 25 80 60 85C95 80 100 120 60 120" stroke="#166534" stroke-width="5" fill="#15803d"/><path d="M220 190L220 140M220 140C190 140 195 110 220 115C245 110 250 140 220 140" stroke="#166534" stroke-width="4" fill="#15803d"/>' + label(150, 260, "grass, few trees", 15, "#78350f")),
  "rainforest": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="#bbf7d0"/>' + [[40, 240, 70], [110, 250, 90], [190, 240, 80], [260, 250, 70], [75, 180, 60], [150, 170, 75], [230, 180, 60]].map(t => '<rect x="' + (t[0] - 6) + '" y="' + (t[1] - 10) + '" width="12" height="60" fill="#78350f"/><circle cx="' + t[0] + '" cy="' + (t[1] - t[2] / 2) + '" r="' + (t[2] / 2) + '" fill="#15803d"/>').join("") + '<path d="M30 20L34 60M90 10L94 50M150 30L154 70M210 15L214 55M270 25L274 65" stroke="#60a5fa" stroke-width="4"/>'),
  "atmosphere": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="#0f172a"/><circle cx="150" cy="330" r="200" fill="#bfdbfe" fill-opacity="0.25"/><circle cx="150" cy="330" r="175" fill="#93c5fd" fill-opacity="0.35"/><circle cx="150" cy="330" r="150" fill="#60a5fa" fill-opacity="0.5"/><g transform="translate(0 180) scale(0.3)">' + globeBody("Africa", {}) + '</g>' + label(150, 70, "a blanket of air", 16, "#e0f2fe")),
  "tectonic plates": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="#fff7ed"/><path d="M0 170L100 160L130 110L300 100L300 300L0 300Z" fill="#d6a56d" stroke="#7c2d12" stroke-width="3"/><path d="M0 170L100 160L130 110L300 100" fill="none" stroke="#7c2d12" stroke-width="4"/><path d="M130 110L120 180L140 300" fill="none" stroke="#dc2626" stroke-width="5" stroke-dasharray="10 7"/><path d="M60 230L30 230M30 230L42 220M30 230L42 240" stroke="#1e3a8a" stroke-width="5" fill="none"/><path d="M210 230L240 230M240 230L228 220M240 230L228 240" stroke="#1e3a8a" stroke-width="5" fill="none"/>' + label(150, 50, "giant slabs that move", 15, "#7c2d12")),
  "volcano": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.sky + '"/><path d="M20 290L120 70L180 70L280 290Z" fill="#78716c" stroke="#44403c" stroke-width="3"/><path d="M150 290L135 80L165 80Z" fill="#dc2626"/><path d="M120 70L180 70L170 55L150 20L130 55Z" fill="#f97316"/><circle cx="150" cy="20" r="14" fill="#fde047"/><path d="M90 40C110 20 130 25 150 10C170 25 190 20 210 40" fill="none" stroke="#9ca3af" stroke-width="10" stroke-linecap="round"/>'),
  "caldera": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.sky + '"/><path d="M0 290L60 120L90 120L110 180L190 180L210 120L240 120L300 290Z" fill="#78716c" stroke="#44403c" stroke-width="3"/><path d="M110 180L190 180L185 200L115 200Z" fill="' + COL.water + '"/>' + label(150, 100, "a collapsed volcano", 15, "#44403c")),
  "geyser": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.sky + '"/><rect x="0" y="240" width="300" height="60" fill="#d6a56d"/><path d="M140 240L150 40L160 240Z" fill="#93c5fd"/><path d="M150 40C120 60 110 100 125 130M150 40C180 60 190 100 175 130" fill="none" stroke="#bfdbfe" stroke-width="10" stroke-linecap="round"/><ellipse cx="150" cy="240" rx="40" ry="10" fill="#60a5fa"/><path d="M150 240L150 300" stroke="#dc2626" stroke-width="10"/>'),
  "precipitation": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.sky + '"/><path d="M70 130C40 130 40 80 80 85C85 50 150 45 165 85C210 70 240 110 215 135Z" fill="#9ca3af"/>' + [70, 100, 130, 160, 190].map(x => '<path d="M' + x + ' 160L' + (x - 10) + ' 200" stroke="#2563eb" stroke-width="6" stroke-linecap="round"/><path d="M' + (x + 5) + ' 220L' + (x - 5) + ' 260" stroke="#2563eb" stroke-width="6" stroke-linecap="round"/>').join("") + '<path d="M235 175L235 195M225 185L245 185M228 178L242 192M242 178L228 192" stroke="#ffffff" stroke-width="4"/>'),
  "evaporation": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="' + COL.sky + '"/><circle cx="240" cy="60" r="34" fill="' + COL.sun + '"/><rect x="0" y="220" width="300" height="80" fill="' + COL.water + '"/>' + [60, 110, 160, 210].map(x => '<path d="M' + x + ' 210C' + (x - 15) + ' 180 ' + (x + 15) + ' 160 ' + x + ' 130C' + (x - 15) + ' 110 ' + (x + 10) + ' 95 ' + x + ' 80" fill="none" stroke="#bfdbfe" stroke-width="7" stroke-linecap="round" stroke-dasharray="14 10"/><path d="M' + x + ' 80L' + (x - 9) + ' 95M' + x + ' 80L' + (x + 9) + ' 95" stroke="#bfdbfe" stroke-width="7" fill="none" stroke-linecap="round"/>').join("")),
  "biome": () => world({ extra: '<rect x="0" y="0" width="1000" height="60" fill="#e0f2fe" fill-opacity="0.8"/><rect x="0" y="60" width="1000" height="70" fill="#86efac" fill-opacity="0.5"/><rect x="0" y="190" width="1000" height="130" fill="#15803d" fill-opacity="0.35"/><rect x="0" y="130" width="1000" height="60" fill="#fde68a" fill-opacity="0.7"/><rect x="0" y="320" width="1000" height="60" fill="#fde68a" fill-opacity="0.7"/>' }),
  "tundra": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="#e0f2fe"/><rect x="0" y="170" width="300" height="130" fill="#d1d5db"/><path d="M0 170C60 150 120 160 180 150C230 145 270 160 300 165" fill="#f8fafc"/><path d="M40 200L40 185M80 210L80 195M130 200L130 188M200 212L200 198M250 205L250 192" stroke="#78716c" stroke-width="4"/>' + label(150, 260, "cold, frozen, no trees", 15, "#374151")),
  "taiga": () => svg(300, 300, '<rect x="0" y="0" width="300" height="300" fill="#e0f2fe"/><rect x="0" y="250" width="300" height="50" fill="#f8fafc"/>' + [30, 80, 130, 180, 230, 280].map((x, i) => { const h = 150 + (i % 2) * 40; return '<path d="M' + x + ' ' + (260 - h) + 'L' + (x + 32) + ' 260L' + (x - 32) + ' 260Z" fill="#166534"/><path d="M' + x + ' ' + (260 - h) + 'L' + (x + 22) + ' ' + (260 - h / 2) + 'L' + (x - 22) + ' ' + (260 - h / 2) + 'Z" fill="#15803d"/>'; }).join("")),
  "continent": () => svg(300, 300, '<g transform="scale(0.3)">' + globeBody("Africa", {}) + P(G.globe.Africa.hi, COL.cont.Africa, COL.litLine, 3) + P(G.globe.Africa.land, "none", "none") + '<circle cx="500" cy="500" r="500" fill="none" stroke="#374151" stroke-width="6"/></g>'),
  "ocean": () => world({ oceansLit: COL.seaLit })
};
function primeX() { const m = /M(-?\d+(\.\d+)?)/.exec(G.world.prime || ""); return m ? m[1] : 500; }
function compass(o) {
  o = o || {}; const lit = o.lit || ""; const on = k => lit.indexOf(k) >= 0;
  const tri = (ang, k) => '<g transform="rotate(' + ang + ' 150 150)"><path d="M150 40L166 150L134 150Z" fill="' + (on(k) ? "#dc2626" : "#374151") + '"/><path d="M150 150L166 150L150 260L134 150Z" fill="none"/></g>';
  let b = '<circle cx="150" cy="150" r="140" fill="#fffbeb" stroke="#374151" stroke-width="3"/>';
  if (o.inter) b += ['NE', 'SE', 'SW', 'NW'].map((k, i) => '<g transform="rotate(' + (45 + i * 90) + ' 150 150)"><path d="M150 70L160 150L140 150Z" fill="' + (on(k) ? "#dc2626" : "#9ca3af") + '"/></g>' + label(150 + 112 * Math.sin((45 + i * 90) * Math.PI / 180), 156 - 112 * Math.cos((45 + i * 90) * Math.PI / 180), k, 17, on(k) ? "#dc2626" : "#6b7280")).join("");
  b += tri(0, "N") + tri(90, "E") + tri(180, "S") + tri(270, "W");
  b += label(150, 34, "N", 26, on("N") ? "#dc2626" : COL.ink) + label(275, 158, "E", 26, on("E") ? "#dc2626" : COL.ink) + label(150, 290, "S", 26, on("S") ? "#dc2626" : COL.ink) + label(25, 158, "W", 26, on("W") ? "#dc2626" : COL.ink);
  return svg(300, 300, b);
}
// words that show a real place instead of a drawing (the plan's "real example lit")
const WORD_MAP = { "Isthmus of Panama": null };
const WORD_FEATURE = { "lake": ["us", "Great Lakes"], "river": ["us", "Mississippi River"], "mountain": ["us", "Appalachian Mountains"], "island": ["feature", "Hawaiian Islands"],
  "bay": ["us", "Chesapeake Bay"], "peninsula": ["feature", "Florida Peninsula"], "isthmus": ["feature", "Isthmus of Panama"], "archipelago": ["feature", "Hawaiian Islands"],
  "delta": ["feature", "Nile Delta"], "strait": ["feature", "Strait of Gibraltar"], "gulf": ["us", "Gulf of Mexico"], "canyon": ["feature", "Grand Canyon"],
  "tributaries": ["us", "Tributaries"], "desert": ["feature", "Sahara Desert"], "plateau": ["feature", "Colorado Plateau"], "plain": ["feature", "Great Plains"],
  "valley": ["feature", "Central Valley"], "savanna": ["feature", "Serengeti Plains"], "rainforest": ["feature", "Amazon Basin"], "tundra": ["feature", "Barren Grounds"],
  "fjord": ["feature", "Scandinavia"], "glacier": ["feature", "Greenland"] };
function wordCard(name, o) {
  o = o || {};
  if (o.real !== false && WORD_FEATURE[name] && !DRAW_ONLY[name]) { const [k, n] = WORD_FEATURE[name]; const pic = k === "us" ? usFeatureCard(n, o) : featureCard(n, o); if (pic && o.real === true) return pic; }
  if (DRAW[name]) return DRAW[name](o);
  if (WORD_FEATURE[name]) { const [k, n] = WORD_FEATURE[name]; return k === "us" ? usFeatureCard(n, o) : featureCard(n, o); }
  return null;
}
// Default for a word: the DRAWING (a kid-level diagram is clearer than a map for most words); opts.real=true gives the real-example map instead.
const DRAW_ONLY = {};

// ── public API ──
function text(kind, name, o) {
  o = o || {};
  switch (kind) {
    case "continent": return continentCard(name, o);
    case "ocean": return oceanCard(name, o);
    case "state": return stateCard(name, o);
    case "country": return countryCard(name, o);
    case "feature": return featureCard(name, o);
    case "us": return usFeatureCard(name, o);
    case "word": return wordCard(name, o);
    case "globe": return G.globe[name] ? globe(name, { hi: !!o.hi, size: o.size }) : null;
    case "world": return world(o);
  }
  return null;
}
function uri(kind, name, o) { const t = text(kind, name, o); return t ? "data:image/svg+xml;utf8," + encodeURIComponent(t) : null; }
function names(kind) {
  switch (kind) {
    case "continent": return G.lists.continents.slice();
    case "ocean": return G.lists.oceans.slice();
    case "state": return G.lists.states.slice();
    case "country": return [].concat.apply([], G.lists.continents.map(c => (G.lists.countries[c] || []).filter(n => n !== "United States")));
    case "river": return G.lists.rivers.slice();
    case "range": return G.lists.ranges.slice();
    case "feature": return G.lists.rivers.concat(G.lists.ranges, G.lists.regions, Object.keys(G.marine), Object.keys(G.lake));
    case "us": return ["United States", "Washington DC", "Gulf of Mexico", "Great Lakes", "Mississippi River", "Rocky Mountains", "Appalachian Mountains", "Alaska", "Hawaii", "Tributaries", "Chesapeake Bay"];
    case "word": return Object.keys(DRAW).concat(Object.keys(WORD_FEATURE).filter(k => !DRAW[k]));
  }
  return [];
}
function credit(kind, name) {
  const ne = G.credits["Natural Earth"].line, own = G.credits["Drawings"].line;
  if (kind === "word") return (DRAW[name] && !WORD_FEATURE[name]) ? own : (DRAW[name] ? own + " · " + ne : ne);
  if (kind === "continent" || kind === "state") return ne;
  return ne;
}
const HoweGeo = { version: G.v, colors: COL, text, uri, svg: uri, names, credit, credits: G.credits, has: (kind, name) => !!text(kind, name, { size: 10 }), data: G };
if (typeof window !== "undefined") window.HoweGeo = HoweGeo;
if (typeof module !== "undefined" && module.exports) module.exports = HoweGeo;
