#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_geo_js.py — builds geo.js, the Geography Path's picture data (PLAN_geography_path_2026-11-10.md §6, slice 0 GEODATA).

Every map picture the path shows (continent silhouettes, ocean maps, state outlines, countries lit on their continent,
rivers, mountain ranges, the Stage-3 "My Country" features and the real-world examples behind the landform words) is
drawn from ONE open dataset — Natural Earth (public domain; naturalearthdata.com) — projected, clipped and simplified
here into small SVG path strings. geo.js = this data + a tiny runtime (tools/geo_runtime.js) that composes a card's
picture on demand and hands it back as an SVG data URI, so the app's existing picture pipeline needs no change.

Pure Python 3 (no shapely / pyshp): the inputs are the GeoJSON files of the natural-earth-vector repository.

    python3 tools/build_geo_js.py --data <folder with the .geojson files> [--out geo.js]

Inputs (all Natural Earth, public domain — download once, do not commit):
    ne_50m_admin_0_countries.geojson          countries (CONTINENT, ADM0_A3)
    ne_50m_admin_1_states_provinces.geojson   US states (iso_a2 == US)
    ne_110m_land.geojson                      land for the globe insets and the world map
    ne_50m_land.geojson                       land for the continent views
    ne_50m_geography_marine_polys.geojson     oceans, gulfs, bays, straits
    ne_50m_lakes.geojson                      the Great Lakes
    ne_50m_rivers_lake_centerlines.geojson    rivers
    ne_10m_geography_regions_polys.geojson    mountain ranges, deltas, deserts, plateaus, gorges, island groups
    ne_50m_populated_places_simple.geojson    capitals (the dot on a country card)

Nothing here touches the app or any database.
"""
import argparse, heapq, json, math, os, re, sys

# ───────────────────────────── the names the unit uses (Appendices A, B, D, E of the plan) ─────────────────────────────
CONTINENTS = ["North America", "South America", "Europe", "Asia", "Africa", "Australia", "Antarctica"]
# Natural Earth calls the seventh "Oceania"; the card says Australia (the kid-level name; her call in §8 row 1).
NE_CONTINENT = {"Australia": "Oceania"}
# Globe centre (lon, lat) per continent view — the hemisphere the kid sees.
GLOBE_CENTRE = {"North America": (-100, 45), "South America": (-60, -22), "Europe": (15, 52), "Asia": (90, 38),
                "Africa": (20, 4), "Australia": (140, -25), "Antarctica": (0, -90)}
OCEANS = {"Pacific Ocean": ["North Pacific Ocean", "South Pacific Ocean"], "Atlantic Ocean": ["North Atlantic Ocean", "South Atlantic Ocean"],
          "Indian Ocean": ["INDIAN OCEAN"], "Arctic Ocean": ["Arctic Ocean"], "Southern Ocean": ["SOUTHERN OCEAN"]}
STATES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
          "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
          "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
          "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
          "Washington", "West Virginia", "Wisconsin", "Wyoming"]
# card name → Natural Earth NAME (only where they differ)
COUNTRY_NE = {"Dominican Republic": "Dominican Rep.", "Democratic Republic of the Congo": "Dem. Rep. Congo", "United States": "United States of America"}
COUNTRIES = {
    "North America": ["Canada", "Mexico", "Cuba", "Guatemala", "Panama", "Costa Rica", "Jamaica", "Haiti", "Dominican Republic", "Honduras", "United States"],
    "South America": ["Brazil", "Argentina", "Chile", "Peru", "Colombia", "Venezuela", "Ecuador", "Bolivia", "Uruguay", "Paraguay"],
    "Europe": ["United Kingdom", "Ireland", "France", "Spain", "Portugal", "Italy", "Germany", "Netherlands", "Belgium", "Switzerland", "Austria", "Poland",
               "Czechia", "Hungary", "Greece", "Norway", "Sweden", "Finland", "Denmark", "Iceland", "Ukraine", "Russia", "Romania"],
    "Asia": ["China", "Japan", "South Korea", "North Korea", "India", "Pakistan", "Bangladesh", "Nepal", "Sri Lanka", "Vietnam", "Thailand", "Indonesia",
             "Philippines", "Malaysia", "Singapore", "Mongolia", "Kazakhstan", "Afghanistan", "Iran", "Iraq", "Saudi Arabia", "Israel", "Turkey", "United Arab Emirates"],
    "Africa": ["Egypt", "Morocco", "Algeria", "Libya", "Nigeria", "Ghana", "Ethiopia", "Kenya", "Tanzania", "Uganda", "Democratic Republic of the Congo",
               "South Africa", "Madagascar", "Sudan", "Somalia", "Senegal"],
    "Australia": ["Australia", "New Zealand", "Papua New Guinea", "Fiji"]}
# Which continent view a country is drawn on (Russia and Turkey straddle; the card shows them on the continent the unit files them under).
# Rivers (Appendix E): card name → (Natural Earth river name(s), continent view)
RIVERS = {"Mississippi River": (["Mississippi"], "North America"), "Amazon River": (["Amazonas", "Amazon"], "South America"),
          "Nile River": (["Nile", "Victoria Nile", "Albert Nile", "White Nile", "Blue Nile"], "Africa"), "Congo River": (["Congo"], "Africa"),
          "Danube River": (["Danube"], "Europe"), "Rhine River": (["Rhine"], "Europe"), "Thames River": (["Thames"], "Europe"), "Volga River": (["Volga"], "Europe"),
          "Ganges River": (["Ganges"], "Asia"), "Yangtze River": (["Yangtze"], "Asia"), "Mekong River": (["Mekong"], "Asia"), "Murray River": (["Murray"], "Australia")}
# Mountain ranges (Appendix E): card name → (Natural Earth region NAME, continent view)
RANGES = {"Appalachian Mountains": ("APPALACHIAN MTS.", "North America"), "Rocky Mountains": ("ROCKY MOUNTAINS", "North America"),
          "Sierra Nevada": ("SIERRA NEVADA", "North America"), "Andes Mountains": ("ANDES", "South America"), "Alps": ("ALPS", "Europe"),
          "Pyrenees": ("PYRENEES", "Europe"), "Ural Mountains": ("URAL MOUNTAINS", "Europe"), "Caucasus Mountains": ("CAUCASUS MTS.", "Asia"),
          "Himalayas": ("HIMALAYAS", "Asia"), "Atlas Mountains": ("ATLAS MOUNTAINS", "Africa"), "Drakensberg": ("DRAKENSBERG", "Africa"),
          "Great Dividing Range": ("GREAT DIVIDING RANGE", "Australia")}
# Physical regions behind landform words (Appendix C) and Stage-3 features: card/word → (NE region NAME, continent view)
REGIONS = {"Sahara Desert": ("SAHARA", "Africa"), "Colorado Plateau": ("COLORADO PLATEAU", "North America"), "Great Plains": ("GREAT PLAINS", "North America"),
           "Central Valley": ("Central Valley", "North America"), "Grand Canyon": ("Grand Canyon", "North America"), "Nile Delta": ("Nile Delta", "Africa"),
           "Mississippi Delta": ("Mississippi Delta", "North America"), "Isthmus of Panama": ("Is. de Panamá", "North America"),
           "Hawaiian Islands": ("HAWAIIAN ISLANDS", "North America"), "Florida Peninsula": ("FLORIDA", "North America"), "Serengeti Plains": ("Serengeti Plains", "Africa"),
           "Amazon Basin": ("AMAZON BASIN", "South America"), "Barren Grounds": ("BARREN GROUNDS", "North America"), "Scandinavia": ("SCANDINAVIA", "Europe"),
           "Greenland": ("GREENLAND", "North America")}
# Marine features: card/word → (NE marine name, view)
MARINE = {"Gulf of Mexico": ("Gulf of Mexico", "us"), "Chesapeake Bay": ("Chesapeake Bay", "us"), "Hudson Bay": ("Hudson Bay", "North America"),
          "Strait of Gibraltar": ("Strait of Gibraltar", "Europe"), "Mediterranean Sea": ("Mediterranean Sea", "Europe"), "Caribbean Sea": ("Caribbean Sea", "North America")}
GREAT_LAKES = ["Lake Superior", "Lake Michigan", "Lake Huron", "Lake Erie", "Lake Ontario"]
US_RIVERS = {"Mississippi": ["Mississippi"], "Missouri": ["Missouri"], "Ohio": ["Ohio"]}
US_RANGES = {"Rocky Mountains": "ROCKY MOUNTAINS", "Appalachian Mountains": "APPALACHIAN MTS.", "Sierra Nevada": "SIERRA NEVADA", "Cascade Range": "CASCADE RANGE",
             "Colorado Plateau": "COLORADO PLATEAU", "Great Plains": "GREAT PLAINS", "Central Valley": "Central Valley", "Grand Canyon": "Grand Canyon",
             "Mississippi Delta": "Mississippi Delta", "Florida": "FLORIDA"}

CREDITS = {
    "Natural Earth": {"license": "Public domain", "url": "https://www.naturalearthdata.com/",
                      "line": "Map data: Natural Earth (public domain) · naturalearthdata.com",
                      "sets": ["ne_50m_admin_0_countries", "ne_50m_admin_1_states_provinces", "ne_110m_land", "ne_50m_land", "ne_50m_geography_marine_polys",
                               "ne_50m_lakes", "ne_50m_rivers_lake_centerlines", "ne_10m_geography_regions_polys", "ne_50m_populated_places_simple"]},
    "Drawings": {"license": "Own work (Howe Academy)", "line": "Drawing: Howe Academy"}}

# ───────────────────────────── geometry helpers ─────────────────────────────
def rings_of(geom):
    """Every ring of a (Multi)Polygon as a list of [lon,lat] lists; outer first per polygon (holes follow)."""
    if not geom: return []
    t = geom["type"]
    if t == "Polygon": return [list(r) for r in geom["coordinates"]]
    if t == "MultiPolygon": return [list(r) for p in geom["coordinates"] for r in p]
    return []

def lines_of(geom):
    if not geom: return []
    t = geom["type"]
    if t == "LineString": return [list(geom["coordinates"])]
    if t == "MultiLineString": return [list(l) for l in geom["coordinates"]]
    return []

def ring_area(pts):
    a = 0.0
    n = len(pts)
    for i in range(n):
        x1, y1 = pts[i][0], pts[i][1]; x2, y2 = pts[(i + 1) % n][0], pts[(i + 1) % n][1]
        a += x1 * y2 - x2 * y1
    return a / 2.0

def visvalingam(pts, min_area, closed):
    """Drop points whose triangle with its neighbours is smaller than min_area (projected units²)."""
    n = len(pts)
    if n <= (4 if closed else 2): return pts
    if closed and pts[0] == pts[-1]: pts = pts[:-1]; n -= 1
    prev = list(range(-1, n - 1)); nxt = list(range(1, n + 1))
    if closed: prev[0] = n - 1; nxt[-1] = 0
    else: prev[0] = -1; nxt[-1] = -1
    alive = [True] * n
    def tri(i):
        p, q = prev[i], nxt[i]
        if p < 0 or q < 0: return float("inf")
        (ax, ay), (bx, by), (cx, cy) = pts[p], pts[i], pts[q]
        return abs((bx - ax) * (cy - ay) - (cx - ax) * (by - ay)) / 2.0
    areas = [tri(i) for i in range(n)]
    heap = [(areas[i], i) for i in range(n) if areas[i] != float("inf")]
    heapq.heapify(heap)
    left = n; floor = closed and 4 or 2
    while heap and left > floor:
        a, i = heapq.heappop(heap)
        if not alive[i] or a != areas[i]: continue
        if a >= min_area: break
        alive[i] = False; left -= 1
        p, q = prev[i], nxt[i]
        if p >= 0: nxt[p] = q
        if q >= 0: prev[q] = p
        for j in (p, q):
            if j >= 0 and alive[j]:
                areas[j] = max(tri(j), a)   # never below the area that removed its neighbour
                if areas[j] != float("inf"): heapq.heappush(heap, (areas[j], j))
    out = [pts[i] for i in range(n) if alive[i]]
    return out

def fmt(v, dec=1):
    s = ("%.*f" % (dec, v)) if dec else str(int(round(v)))
    if dec and "." in s: s = s.rstrip("0").rstrip(".")
    if s in ("-0", ""): s = "0"
    return s

def path_of_rings(rings, closed=True, dec=0):
    """SVG path with absolute M/L. 1000-box layers use whole units (0.5 unit = 0.15 px on a 300 px card); fitted
    100-box silhouettes keep one decimal. Consecutive duplicate points are dropped."""
    parts = []
    for r in rings:
        if len(r) < (3 if closed else 2): continue
        pts = []; last = None
        for x, y in r:
            p = (fmt(x, dec), fmt(y, dec))
            if p != last: pts.append(p); last = p
        if closed and len(pts) > 1 and pts[0] == pts[-1]: pts.pop()
        if len(pts) < (3 if closed else 2): continue
        parts.append("M" + pts[0][0] + " " + pts[0][1] + "L" + " ".join(x + " " + y for x, y in pts[1:]) + ("Z" if closed else ""))
    return "".join(parts)

def bbox(rings):
    xs = [p[0] for r in rings for p in r]; ys = [p[1] for r in rings for p in r]
    if not xs: return None
    return [min(xs), min(ys), max(xs), max(ys)]

def fit_rings(rings, size=100.0):
    """Scale + translate rings to fit a size×size box (keeps aspect). Returns (rings, [w,h])."""
    b = bbox(rings)
    if not b: return rings, [size, size]
    w, h = b[2] - b[0], b[3] - b[1]
    s = size / max(w, h, 1e-9)
    out = [[[(x - b[0]) * s, (y - b[1]) * s] for x, y in r] for r in rings]
    return out, [round(w * s, 1), round(h * s, 1)]

# ───────────────────────────── projections ─────────────────────────────
R = 500.0   # globe radius: the globe sits in a 1000×1000 box

def ortho_factory(lon0, lat0):
    l0, p0 = math.radians(lon0), math.radians(lat0)
    sp0, cp0 = math.sin(p0), math.cos(p0)
    def proj(lon, lat):
        l, p = math.radians(lon), math.radians(lat)
        cosc = sp0 * math.sin(p) + cp0 * math.cos(p) * math.cos(l - l0)
        x = R * math.cos(p) * math.sin(l - l0)
        y = R * (cp0 * math.sin(p) - sp0 * math.cos(p) * math.cos(l - l0))
        return (500 + x, 500 - y, cosc)
    return proj

def ortho_ring(proj, ring, closed=True):
    """Project a ring and clip it to the visible hemisphere; invisible stretches are replaced by the horizon arc."""
    pts = [proj(lon, lat) for lon, lat in ring]
    vis = [c > 1e-9 for _, _, c in pts]
    if not any(vis): return []
    if all(vis): return [[(x, y) for x, y, _ in pts]]
    n = len(pts)
    # find runs of visible points (ring-wise)
    start = next(i for i in range(n) if not vis[i])  # start the walk on an invisible point so runs don't wrap
    order = [(start + k) % n for k in range(n)]
    runs, cur = [], None
    for idx in order:
        if vis[idx]:
            if cur is None: cur = []
            cur.append(idx)
        elif cur is not None:
            runs.append(cur); cur = None
    if cur is not None: runs.append(cur)
    if not closed:
        return [[(pts[i][0], pts[i][1]) for i in run] for run in runs]
    def horizon_pt(a, b):   # a visible, b invisible → point on the horizon between them (linear in the great-circle sense is overkill; interpolate in 3-D)
        (x1, y1, c1), (x2, y2, c2) = pts[a], pts[b]
        t = c1 / (c1 - c2) if c1 != c2 else 0.5
        x, y = x1 + (x2 - x1) * t, y1 + (y2 - y1) * t
        ang = math.atan2(y - 500, x - 500)
        return (500 + R * math.cos(ang), 500 + R * math.sin(ang))
    out = []
    for run in runs:
        seg = [horizon_pt(run[0], (run[0] - 1) % n)] + [(pts[i][0], pts[i][1]) for i in run] + [horizon_pt(run[-1], (run[-1] + 1) % n)]
        out.append(seg)
    # join consecutive segments along the horizon arc (the short way round), closing the last to the first
    ring_out = []
    for k, seg in enumerate(out):
        ring_out.extend(seg)
        nxt = out[(k + 1) % len(out)]
        a1 = math.atan2(seg[-1][1] - 500, seg[-1][0] - 500); a2 = math.atan2(nxt[0][1] - 500, nxt[0][0] - 500)
        d = a2 - a1
        while d > math.pi: d -= 2 * math.pi
        while d < -math.pi: d += 2 * math.pi
        steps = max(1, int(abs(d) / math.radians(6)))
        for s in range(1, steps):
            a = a1 + d * s / steps
            ring_out.append((500 + R * math.cos(a), 500 + R * math.sin(a)))
    return [ring_out]

# Robinson (table by 5° latitude: PLEN = x scale, PDFE = y scale)
ROB = [(1.0000, 0.0000), (0.9986, 0.0620), (0.9954, 0.1240), (0.9900, 0.1860), (0.9822, 0.2480), (0.9730, 0.3100), (0.9600, 0.3720),
       (0.9427, 0.4340), (0.9216, 0.4958), (0.8962, 0.5571), (0.8679, 0.6176), (0.8350, 0.6769), (0.7986, 0.7346), (0.7597, 0.7903),
       (0.7186, 0.8435), (0.6732, 0.8936), (0.6213, 0.9394), (0.5722, 0.9761), (0.5322, 1.0000)]
WORLD_W, WORLD_H = 1000.0, 507.0
def robinson(lon, lat):
    a = abs(lat); i = int(a // 5); i = min(i, 17); f = (a - i * 5) / 5.0
    plen = ROB[i][0] + (ROB[i + 1][0] - ROB[i][0]) * f
    pdfe = ROB[i][1] + (ROB[i + 1][1] - ROB[i][1]) * f
    x = 0.8487 * plen * math.radians(lon)
    y = 1.3523 * pdfe * (1 if lat >= 0 else -1)
    # normalise: x in [-0.8487π, 0.8487π] → [0, WORLD_W]; y in [-1.3523, 1.3523] → [WORLD_H, 0]
    X = (x / (0.8487 * math.pi) + 1) / 2 * WORLD_W
    Y = (1 - y / 1.3523) / 2 * WORLD_H
    return (X, Y)

def albers_factory(lon0, lat0, phi1, phi2):
    l0, p0, p1, p2 = map(math.radians, (lon0, lat0, phi1, phi2))
    n = 0.5 * (math.sin(p1) + math.sin(p2))
    C = math.cos(p1) ** 2 + 2 * n * math.sin(p1)
    rho0 = math.sqrt(C - 2 * n * math.sin(p0)) / n
    def proj(lon, lat):
        l, p = math.radians(lon), math.radians(lat)
        theta = n * (l - l0)
        rho = math.sqrt(max(C - 2 * n * math.sin(p), 0)) / n
        return (rho * math.sin(theta), rho0 - rho * math.cos(theta))
    return proj

ALB48 = albers_factory(-96, 23, 29.5, 45.5)
ALBAK = albers_factory(-154, 50, 55, 65)
ALBHI = albers_factory(-157, 20, 8, 18)
# the Albers-USA frame: lower 48 fitted into 1000 wide; Alaska (×0.35) and Hawaii below left, the classroom layout
US_W, US_H = 1000.0, 620.0

class AlbersUSA:
    def __init__(self):
        self.s = None
    def calibrate(self, rings48):
        pts = [ALB48(lon, lat) for r in rings48 for lon, lat in r]
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        self.minx, self.maxx, self.miny, self.maxy = min(xs), max(xs), min(ys), max(ys)
        self.s = (US_W - 40) / (self.maxx - self.minx)
    def lower48(self, lon, lat):
        x, y = ALB48(lon, lat)
        return (20 + (x - self.minx) * self.s, 20 + (self.maxy - y) * self.s)
    def alaska(self, lon, lat):
        x, y = ALBAK(lon, lat)
        return (150 + x * self.s * 0.35, US_H - 95 - y * self.s * 0.35)
    def hawaii(self, lon, lat):
        x, y = ALBHI(lon, lat)
        return (330 + x * self.s * 0.9, US_H - 70 - y * self.s * 0.9)

# ───────────────────────────── loading ─────────────────────────────
def load(data_dir, name):
    with open(os.path.join(data_dir, name), encoding="utf-8") as f:
        return json.load(f)["features"]

def by_prop(features, key):
    out = {}
    for f in features:
        v = f["properties"].get(key)
        if v is not None: out.setdefault(v, []).append(f)
    return out

# ───────────────────────────── building one view ─────────────────────────────
def project_rings(proj_fn, rings, ortho=None, min_area=1.0, tol=0.6, closed=True):
    """Project rings with a (lon,lat)->(x,y) function, or an orthographic projection with clipping; drop slivers; simplify."""
    out = []
    for r in rings:
        if ortho is not None:
            segs = ortho_ring(ortho, r, closed=closed)
        else:
            segs = [[proj_fn(lon, lat) for lon, lat in r]]
        for s in segs:
            s = [(x, y) for x, y in s]
            if closed:
                if len(s) < 3 or abs(ring_area(s)) < min_area: continue
            s = visvalingam(s, tol, closed)
            if closed and len(s) < 3: continue
            if not closed and len(s) < 2: continue
            out.append(s)
    return out

def build(data_dir):
    print("loading…", file=sys.stderr)
    countries = load(data_dir, "ne_50m_admin_0_countries.geojson")
    states_all = load(data_dir, "ne_50m_admin_1_states_provinces.geojson")
    land110 = load(data_dir, "ne_110m_land.geojson")
    land50 = load(data_dir, "ne_50m_land.geojson")
    marine = load(data_dir, "ne_50m_geography_marine_polys.geojson")
    lakes = load(data_dir, "ne_50m_lakes.geojson")
    rivers = load(data_dir, "ne_50m_rivers_lake_centerlines.geojson")
    regions = load(data_dir, "ne_10m_geography_regions_polys.geojson")
    places = load(data_dir, "ne_50m_populated_places_simple.geojson")

    c_by_name = {f["properties"]["NAME"]: f for f in countries}
    c_by_cont = by_prop(countries, "CONTINENT")
    us_states = {f["properties"]["name"]: f for f in states_all if f["properties"].get("iso_a2") == "US"}
    marine_by = by_prop(marine, "name")
    lakes_by = by_prop(lakes, "name")
    rivers_by = by_prop(rivers, "name")
    regions_by = by_prop(regions, "NAME")

    D = {"v": 1, "globe": {}, "world": {}, "us": {}, "cont": {}, "state": {}, "country": {}, "river": {}, "range": {}, "region": {}, "marine": {}, "lake": {}, "cap": {}, "stcap": {}}

    # ── globe views (one per continent centre): all land (110m) + each continent's land (50m countries dissolved by colour, not geometry) ──
    print("globe views…", file=sys.stderr)
    for cont in CONTINENTS:
        lon0, lat0 = GLOBE_CENTRE[cont]
        proj = ortho_factory(lon0, lat0)
        land = project_rings(None, [r for f in land110 for r in rings_of(f["geometry"])], ortho=proj, min_area=25, tol=5.0)
        D["globe"][cont] = {"land": path_of_rings(land)}
        # the continent itself = its countries' outer rings (50m), as one path
        ne_name = NE_CONTINENT.get(cont, cont)
        feats = c_by_cont.get(ne_name, [])
        if cont == "Europe":   # Russia and Turkey straddle: the kid sees Europe's part — Natural Earth files both under Europe/Asia; keep Natural Earth's filing
            pass
        rings = [r for f in feats for r in rings_of(f["geometry"])]
        hi = project_rings(None, rings, ortho=proj, min_area=12, tol=4.0)
        D["globe"][cont]["hi"] = path_of_rings(hi)
        b = bbox(hi)
        D["globe"][cont]["box"] = [round(v, 1) for v in b] if b else [0, 0, 1000, 1000]
        # every country of the continent in this view (for the grey outlines behind a lit country) — only the ones the path names, plus big neighbours
        D["country"].setdefault(cont, {})
        wanted = set(COUNTRIES.get(cont, []))
        for card in sorted(wanted):
            f = c_by_name.get(COUNTRY_NE.get(card, card))
            if not f: print("  !! no country", card, file=sys.stderr); continue
            rs = project_rings(None, rings_of(f["geometry"]), ortho=proj, min_area=8, tol=3.0)
            if not rs: rs = project_rings(None, rings_of(f["geometry"]), ortho=proj, min_area=0.05, tol=0.3)   # a tiny country (Singapore) keeps its speck
            D["country"][cont][card] = path_of_rings(rs, dec=1 if len(rs) and abs(ring_area(rs[0])) < 8 else 0)
        # outlines of ALL countries on the continent (one path) so the lit one sits among its neighbours
        allc = project_rings(None, [r for f in feats for r in rings_of(f["geometry"])], ortho=proj, min_area=14, tol=5.0)
        D["globe"][cont]["borders"] = path_of_rings(allc)
        # capitals of the named countries (dot)
        for card in wanted:
            f = c_by_name.get(COUNTRY_NE.get(card, card))
            if not f: continue
            a3 = f["properties"].get("ADM0_A3")
            cands = [p for p in places if p["properties"].get("featurecla") == "Admin-0 capital" and p["properties"].get("adm0_a3") == a3]
            if not cands: cands = [p for p in places if p["properties"].get("featurecla") in ("Admin-0 capital", "Admin-0 capital alt") and p["properties"].get("adm0_a3") == a3]
            if cands:
                p = cands[0]["properties"]; x, y, c = proj(p["longitude"], p["latitude"])
                if c > 0: D["cap"][card] = [round(x, 1), round(y, 1), p["name"].replace("  ", " ")]
    # ── continent silhouettes (fit to a 100-box) ──
    print("continent silhouettes…", file=sys.stderr)
    for cont in CONTINENTS:
        lon0, lat0 = GLOBE_CENTRE[cont]
        proj = ortho_factory(lon0, lat0)
        feats = c_by_cont.get(NE_CONTINENT.get(cont, cont), [])
        rings = [r for f in feats for r in rings_of(f["geometry"])]
        if cont == "Europe":   # Europe's silhouette without Russia's Siberian bulk: clip to lon < 60 by dropping far-east rings' points east of 65°E
            rings = [[(min(lon, 65.0), lat) for lon, lat in r] for r in rings]
        rs = project_rings(None, rings, ortho=proj, min_area=25, tol=1.5)
        fitted, wh = fit_rings(rs, 100.0)
        fitted = [visvalingam([(x, y) for x, y in r], 0.3, True) for r in fitted if abs(ring_area(r)) > 0.6 or r is fitted[0]]
        D["cont"][cont] = {"d": path_of_rings(fitted, dec=1), "wh": wh}
    # ── world map (Robinson): land + the five oceans ──
    print("world map…", file=sys.stderr)
    land = project_rings(robinson, [r for f in land110 for r in rings_of(f["geometry"])], min_area=8, tol=2.5)
    D["world"]["land"] = path_of_rings(land)
    D["world"]["wh"] = [WORLD_W, WORLD_H]
    D["world"]["ocean"] = {}
    for card, parts in OCEANS.items():
        rings = [r for part in parts for f in marine_by.get(part, []) for r in rings_of(f["geometry"])]
        rs = project_rings(robinson, rings, min_area=6, tol=3.0)
        D["world"]["ocean"][card] = path_of_rings(rs)
    # graticule bits the word diagrams use: equator, tropics, prime meridian, every 30° of latitude and longitude
    def line(pts): return path_of_rings([[robinson(lon, lat) for lon, lat in pts]], closed=False)
    D["world"]["equator"] = line([(lon, 0) for lon in range(-180, 181, 5)])
    D["world"]["lat30"] = "".join(line([(lon, lat) for lon in range(-180, 181, 5)]) for lat in (-60, -30, 30, 60))
    D["world"]["lon30"] = "".join(line([(lon, lat) for lat in range(-90, 91, 5)]) for lon in range(-150, 181, 30))
    D["world"]["prime"] = line([(0, lat) for lat in range(-90, 91, 5)])
    D["world"]["outline"] = line([(lon, 90) for lon in range(-180, 181, 5)] + [(180, lat) for lat in range(90, -91, -5)] + [(lon, -90) for lon in range(180, -181, -5)] + [(-180, lat) for lat in range(-90, 91, 5)])
    # ── Albers USA: states, lakes, rivers, ranges, gulf, neighbours ──
    print("us map…", file=sys.stderr)
    A = AlbersUSA()
    lower48 = [r for n, f in us_states.items() if n not in ("Alaska", "Hawaii") for r in rings_of(f["geometry"])]
    A.calibrate(lower48)
    D["us"]["wh"] = [US_W, US_H]
    D["us"]["state"] = {}
    for n in STATES:
        f = us_states[n]
        pr = A.alaska if n == "Alaska" else A.hawaii if n == "Hawaii" else A.lower48
        rs = project_rings(pr, rings_of(f["geometry"]), min_area=3 if n != "Hawaii" else 0.6, tol=1.8)
        D["us"]["state"][n] = path_of_rings(rs)
        # the state silhouette, fitted to a 100-box, in its own Albers (lower-48 frame for the 48; AK/HI their own)
        pr2 = (lambda lon, lat: ALBAK(lon, lat)) if n == "Alaska" else (lambda lon, lat: ALBHI(lon, lat)) if n == "Hawaii" else (lambda lon, lat: ALB48(lon, lat))
        raw = [[pr2(lon, lat) for lon, lat in r] for r in rings_of(f["geometry"])]
        raw = [[(x, -y) for x, y in r] for r in raw]   # y up → down
        fitted, wh = fit_rings(raw, 100.0)
        keep = [r for r in fitted if abs(ring_area(r)) > (0.4 if n in ("Hawaii", "Alaska") else 1.5) or r is fitted[0]]
        keep = [visvalingam(r, 0.25, True) for r in keep]
        fitted, wh = fit_rings(keep, 100.0)
        D["state"][n] = {"d": path_of_rings(fitted, dec=1), "wh": wh}
    dc = us_states.get("District of Columbia")
    if dc:
        rs = [[A.lower48(lon, lat) for lon, lat in r] for r in rings_of(dc["geometry"])]
        b = bbox(rs); D["us"]["dc"] = [round((b[0] + b[2]) / 2, 1), round((b[1] + b[3]) / 2, 1)]
    # neighbours (Canada, Mexico, Cuba, Bahamas) in the lower-48 frame, clipped to the frame by dropping far points
    nb = []
    for n in ("Canada", "Mexico", "Cuba", "Bahamas"):
        f = c_by_name.get(n)
        if f: nb += rings_of(f["geometry"])
    nbr = []
    for r in nb:
        pts = [A.lower48(lon, lat) for lon, lat in r if -170 < lon < -50 and 10 < lat < 72]
        if len(pts) > 3: nbr.append(pts)
    nbr = [visvalingam(p, 4.0, True) for p in nbr if abs(ring_area(p)) > 30]
    D["us"]["neighbours"] = path_of_rings(nbr)
    lk = [r for n in GREAT_LAKES for f in lakes_by.get(n, []) for r in rings_of(f["geometry"])]
    D["us"]["lakes"] = path_of_rings(project_rings(A.lower48, lk, min_area=2, tol=1.6))
    D["us"]["river"] = {}
    for card, names in US_RIVERS.items():
        ls = [l for n in names for f in rivers_by.get(n, []) for l in lines_of(f["geometry"])]
        D["us"]["river"][card] = path_of_rings(project_rings(A.lower48, ls, tol=0.8, closed=False), closed=False)
    D["us"]["range"] = {}
    for card, nm in US_RANGES.items():
        rs = [r for f in regions_by.get(nm, []) for r in rings_of(f["geometry"])]
        D["us"]["range"][card] = path_of_rings(project_rings(A.lower48, rs, min_area=2, tol=2.5))
    D["us"]["gulf"] = path_of_rings(project_rings(A.lower48, [r for f in marine_by.get("Gulf of Mexico", []) for r in rings_of(f["geometry"])], min_area=2, tol=1.2))
    D["us"]["chesapeake"] = path_of_rings(project_rings(A.lower48, [r for f in marine_by.get("Chesapeake Bay", []) for r in rings_of(f["geometry"])], min_area=0.5, tol=0.6))
    for p in places:
        pp = p["properties"]
        if pp.get("featurecla") == "Admin-1 capital" and pp.get("adm0name") == "United States of America" and pp.get("adm1name") in STATES:
            st = pp["adm1name"]; pr = A.alaska if st == "Alaska" else A.hawaii if st == "Hawaii" else A.lower48
            x, y = pr(pp["longitude"], pp["latitude"]); D["stcap"][st] = [round(x, 1), round(y, 1), pp["name"].replace("  ", " ")]
    # ── rivers, ranges, regions and marine features on their continent globe ──
    print("features…", file=sys.stderr)
    def globe_feature(view, rings, closed=True, min_area=3, tol=1.5):
        lon0, lat0 = GLOBE_CENTRE[view]; proj = ortho_factory(lon0, lat0)
        rs = project_rings(None, rings, ortho=proj, min_area=min_area if closed else 0, tol=tol * 1.6, closed=closed)
        return path_of_rings(rs, closed=closed)
    for card, (names, view) in RIVERS.items():
        ls = [l for n in names for f in rivers_by.get(n, []) for l in lines_of(f["geometry"])]
        if not ls: print("  !! no river", card, file=sys.stderr)
        D["river"][card] = {"view": view, "d": globe_feature(view, ls, closed=False, tol=1.2)}
    for card, (nm, view) in RANGES.items():
        rs = [r for f in regions_by.get(nm, []) for r in rings_of(f["geometry"])]
        if not rs: print("  !! no range", card, file=sys.stderr)
        D["range"][card] = {"view": view, "d": globe_feature(view, rs, min_area=2, tol=1.5)}
    for card, (nm, view) in REGIONS.items():
        rs = [r for f in regions_by.get(nm, []) for r in rings_of(f["geometry"])]
        if not rs: print("  !! no region", card, file=sys.stderr)
        D["region"][card] = {"view": view, "d": globe_feature(view, rs, min_area=0.5, tol=1.0)}
    for card, (nm, view) in MARINE.items():
        rs = [r for f in marine_by.get(nm, []) for r in rings_of(f["geometry"])]
        if not rs: print("  !! no marine", card, file=sys.stderr)
        if view == "us": continue   # drawn from D.us
        D["marine"][card] = {"view": view, "d": globe_feature(view, rs, min_area=0.5, tol=1.0)}
    # Great Lakes on the North America globe (for Stage-3 "lake")
    lkr = [r for n in GREAT_LAKES for f in lakes_by.get(n, []) for r in rings_of(f["geometry"])]
    D["lake"]["Great Lakes"] = {"view": "North America", "d": globe_feature("North America", lkr, min_area=0.5, tol=1.0)}
    # Alaska and Hawaii on the North America globe (Stage 3 "far-away states")
    D["globe"]["North America"]["alaska"] = globe_feature("North America", rings_of(us_states["Alaska"]["geometry"]), min_area=1, tol=1.5)
    D["globe"]["North America"]["hawaii"] = globe_feature("North America", rings_of(us_states["Hawaii"]["geometry"]), min_area=0.1, tol=0.5)
    D["globe"]["North America"]["usa"] = D["country"]["North America"].get("United States", "")
    return D

# ───────────────────────────── emit ─────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True, help="folder with the Natural Earth .geojson files")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "geo.js"))
    ap.add_argument("--runtime", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "geo_runtime.js"))
    a = ap.parse_args()
    D = build(a.data)
    D["credits"] = CREDITS
    D["lists"] = {"continents": CONTINENTS, "oceans": list(OCEANS), "states": STATES, "countries": COUNTRIES, "rivers": list(RIVERS), "ranges": list(RANGES),
                  "regions": list(REGIONS), "marine": list(MARINE)}
    data = json.dumps(D, ensure_ascii=False, separators=(",", ":"))
    with open(a.runtime, encoding="utf-8") as f: runtime = f.read()
    head = ("// geo.js — Geography Path pictures (GENERATED by tools/build_geo_js.py — do not edit by hand; edit the build or tools/geo_runtime.js).\n"
            "// Map data: Natural Earth (public domain) · naturalearthdata.com. Drawings: Howe Academy. PLAN_geography_path_2026-11-10.md §6.\n"
            "// Loaded lazily (HA_LAZY_FILES.geo) only by a family that has the unit; nothing here runs on its own.\n")
    out = head + "(function(){\nconst GEO_DATA=" + data + ";\n" + runtime + "\n})();\n"
    with open(a.out, "w", encoding="utf-8") as f: f.write(out)
    sizes = {k: len(json.dumps(v, ensure_ascii=False, separators=(",", ":"))) for k, v in D.items()}
    print("wrote", a.out, len(out), "bytes; sections:", json.dumps(sizes), file=sys.stderr)

if __name__ == "__main__":
    main()
