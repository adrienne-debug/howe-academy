#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_geo_flags.py — builds geoflags.js, the Geography Path's Stage-8 flags (PLAN_geography_path_2026-11-10.md §5.2 Stage 8,
§6.1, Appendix E "Flags"; slice 5 GEOEXTRA).

One flag per country of the Countries deck, from Wikimedia Commons "Flag of <Country>.svg", PUBLIC DOMAIN ONLY (the plan's
rule: "a flag whose Commons file is not public domain is left out and the country stays in Stage 6 only"). Each SVG is
slimmed here — editor metadata dropped, every path re-written with whole coordinates at ~0.2 px on a 300-px card — so the
whole set is a few hundred KB instead of 3.4 MB. Per-file credits (file, author, licence, page) ride in the output.

Inputs (download once, do not commit):
    --meta   flags_meta.json   {card: {title, url, descurl, license, licenseCode, copyrighted, artist, sha1, …}} from the Commons API
    --svg    folder            the downloaded SVGs + _index.json {card: file name}
Output: geoflags.js — window.HoweGeoFlags (lazy, HA_LAZY_FILES.geoflags; loaded only when a Flags card needs a picture).

    python3 -I tools/build_geo_flags.py --meta <flags_meta.json> --svg <folder> [--out geoflags.js] [--check <png folder>]

--check renders every original and slimmed flag with macOS qlmanage and reports the pixel difference (a visual check, Mac only).
Nothing here touches the app or any database.
"""
import argparse, json, math, os, re, subprocess, sys, tempfile
import xml.etree.ElementTree as ET

SVGNS = "http://www.w3.org/2000/svg"
XLINK = "http://www.w3.org/1999/xlink"
ET.register_namespace("", SVGNS)
ET.register_namespace("xlink", XLINK)

# Left out on purpose, with the reason the report and the app give. Oman: the Commons file is under Oman's own government
# licence (OGL-om), not public domain — the plan's rule. Afghanistan: Commons' current file is the Taliban's flag, which the
# UN does not recognise — a contested flag is not taught as fact; Mom's call (default: left out).
LEFT_OUT = {"Afghanistan": "its flag is disputed — Commons' current file is the Taliban flag, which the UN does not recognise (Mom's call)"}

KEEP_EL = {"svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "defs", "use", "symbol", "clipPath", "mask",
           "linearGradient", "radialGradient", "stop", "pattern", "text", "tspan", "style"}
DROP_ATTR = {"id"}   # re-added below when something refers to it
GEOM_ATTR = {"x", "y", "width", "height", "cx", "cy", "r", "rx", "ry", "x1", "y1", "x2", "y2"}
NUM = re.compile(r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?")

def local(tag): return tag.split("}", 1)[1] if tag.startswith("{") else tag
def ns(tag): return tag[1:].split("}", 1)[0] if tag.startswith("{") else ""

def fmtn(v, dec):
    if dec <= 0: s = str(int(round(v)))
    else:
        s = ("%.*f" % (dec, v)).rstrip("0").rstrip(".")
    if s in ("-0", "", "-"): s = "0"
    if s.startswith("0.") : s = s[1:]
    elif s.startswith("-0."): s = "-" + s[2:]
    return s

def join_nums(nums):
    out = ""
    for s in nums:
        if out and not (s.startswith("-") or (s.startswith(".") and ("." in re.split(r"[^0-9.]", out)[-1] or out[-1] == "."))):
            out += " "
        out += s
    return out

# ── transforms ──
def mat_mul(a, b):
    return [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
            a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]]
def parse_transform(t):
    m = [1, 0, 0, 1, 0, 0]
    for fn, args in re.findall(r"(\w+)\s*\(([^)]*)\)", t or ""):
        v = [float(x) for x in NUM.findall(args)]
        if fn == "matrix" and len(v) == 6: n = v
        elif fn == "translate": n = [1, 0, 0, 1, v[0] if v else 0, v[1] if len(v) > 1 else 0]
        elif fn == "scale": n = [v[0], 0, 0, v[1] if len(v) > 1 else v[0], 0, 0]
        elif fn == "rotate":
            a = math.radians(v[0]); c, s = math.cos(a), math.sin(a); n = [c, s, -s, c, 0, 0]
            if len(v) == 3: n = mat_mul(mat_mul([1, 0, 0, 1, v[1], v[2]], n), [1, 0, 0, 1, -v[1], -v[2]])
        elif fn == "skewX": n = [1, 0, math.tan(math.radians(v[0])), 1, 0, 0]
        elif fn == "skewY": n = [1, math.tan(math.radians(v[0])), 0, 1, 0, 0]
        else: continue
        m = mat_mul(m, n)
    return m
def mat_scale(m): return math.sqrt(abs(m[0] * m[3] - m[1] * m[2])) or 1e-9

# ── paths: parse → absolute → rounded → relative (from the ROUNDED points, so no error builds up) ──
ARGC = {"m": 2, "l": 2, "h": 1, "v": 1, "c": 6, "s": 4, "q": 4, "t": 2, "a": 7, "z": 0}
def tokenize_path(d):
    i, n, out = 0, len(d), []
    cmd = None; argi = 0
    while i < n:
        ch = d[i]
        if ch in " \t\r\n,": i += 1; continue
        if ch.isalpha():
            if ch.lower() not in ARGC: raise ValueError("bad path command " + ch)
            cmd = ch; out.append(ch); argi = 0; i += 1; continue
        if cmd and cmd.lower() == "a" and (argi % 7) in (3, 4):   # arc flags: a single 0/1, may be written with no separator
            if ch not in "01": raise ValueError("bad arc flag")
            out.append(float(ch)); argi += 1; i += 1; continue
        m = NUM.match(d, i)
        if not m: raise ValueError("bad path near " + d[i:i + 20])
        out.append(float(m.group(0))); argi += 1; i = m.end()
    return out

def path_abs(d):
    """[(CMD upper, [abs numbers])] with H/V kept, S/T kept, arcs' endpoints absolute."""
    toks = tokenize_path(d); segs = []; i = 0; cx = cy = sx = sy = 0.0; cmd = None
    while i < len(toks):
        t = toks[i]
        if isinstance(t, str): cmd = t; i += 1
        if cmd is None: raise ValueError("path starts with a number")
        lc = cmd.lower(); rel = cmd.islower(); k = ARGC[lc]
        if lc == "z":
            segs.append(("Z", [])); cx, cy = sx, sy
            if i < len(toks) and not isinstance(toks[i], str): raise ValueError("numbers after Z")
            continue
        args = toks[i:i + k]
        if len(args) < k or any(isinstance(a, str) for a in args): raise ValueError("short path args")
        i += k
        a = list(args)
        if lc == "h": x = a[0] + (cx if rel else 0); segs.append(("H", [x])); cx = x
        elif lc == "v": y = a[0] + (cy if rel else 0); segs.append(("V", [y])); cy = y
        elif lc == "a":
            x, y = a[5] + (cx if rel else 0), a[6] + (cy if rel else 0)
            segs.append(("A", [a[0], a[1], a[2], a[3], a[4], x, y])); cx, cy = x, y
        else:
            pts = []
            for j in range(0, k, 2): pts += [a[j] + (cx if rel else 0), a[j + 1] + (cy if rel else 0)]
            C = cmd.upper()
            segs.append((C, pts)); cx, cy = pts[-2], pts[-1]
            if C == "M": sx, sy = cx, cy; cmd = "l" if rel else "L"   # implicit lineto after moveto
    return segs

def path_out(segs, dec):
    out = []; cx = cy = sx = sy = 0.0; last = None; started = False
    def r(v): return round(v, dec) if dec > 0 else float(round(v))
    for C, a in segs:
        if C == "Z":
            if last == "z": continue
            out.append("z"); last = "z"; cx, cy = sx, sy; continue
        if C == "M":
            x, y = r(a[0]), r(a[1])
            if out and last == "m": out.pop()   # a moveto followed by a moveto: only the last counts
            nums = [x - cx, y - cy] if started else [x, y]
            out.append("m" + join_nums([fmtn(v, dec) for v in nums])); last = "m"; started = True
            cx, cy = x, y; sx, sy = x, y; continue
        if C == "H":
            x = r(a[0])
            if x == cx: continue
            out.append(("h", [x - cx])); cx = x; last = "h"; continue
        if C == "V":
            y = r(a[0])
            if y == cy: continue
            out.append(("v", [y - cy])); cy = y; last = "v"; continue
        if C == "A":
            x, y = r(a[5]), r(a[6])
            if x == cx and y == cy: continue
            rx, ry = abs(a[0]), abs(a[1])
            out.append(("a", [rx, ry, a[2], a[3], a[4], x - cx, y - cy], [max(dec, 0) + 1, max(dec, 0) + 1, 2, 0, 0, dec, dec])); cx, cy = x, y; last = "a"; continue
        pts = [r(v) for v in a]
        if all(pts[j] == cx and pts[j + 1] == cy for j in range(0, len(pts), 2)): continue   # collapsed to nothing at this size
        rel = []
        for j in range(0, len(pts), 2): rel += [pts[j] - cx, pts[j + 1] - cy]
        if C == "L" and rel[0] == 0: out.append(("v", [rel[1]]))
        elif C == "L" and rel[1] == 0: out.append(("h", [rel[0]]))
        else: out.append((C.lower(), rel))
        cx, cy = pts[-2], pts[-1]; last = C.lower()
    # emit, omitting a repeated command letter
    s = ""; prev = None
    for o in out:
        if isinstance(o, str): s += o; prev = o[0]; continue
        c, nums = o[0], o[1]
        if c == "a":
            decs = o[2]; parts = [fmtn(v, dd) for v, dd in zip(nums, decs)]
        else: parts = [fmtn(v, dec) for v in nums]
        body = join_nums(parts)
        if prev == c and c not in ("m",):
            sep = "" if body.startswith("-") or (body.startswith(".") and s and re.search(r"\.\d*$", s)) else " "
            s += sep + body
        else: s += c + body
        prev = c
    return s

def round_list(txt, dec):
    return join_nums([fmtn(float(v), dec) for v in NUM.findall(txt or "")])

# ── the slimmer ──
def slim(svg_text, eps_px=0.2, card_px=300.0):
    if re.search(r"<!ENTITY|<!DOCTYPE[^>]*\[", svg_text): raise ValueError("entity declarations — refused")
    if re.search(r"<script|foreignObject|<image|\bon[a-z]+\s*=|href\s*=\s*[\"'](?!#)", svg_text, re.I): raise ValueError("script, image or external link — refused")
    root = ET.fromstring(svg_text.encode("utf-8"))
    if local(root.tag) != "svg": raise ValueError("not an svg")
    vb = root.get("viewBox")
    if vb: vbx = [float(v) for v in NUM.findall(vb)]
    else:
        w = float(NUM.findall(root.get("width"))[0]); h = float(NUM.findall(root.get("height"))[0]); vbx = [0, 0, w, h]
    vw, vh = vbx[2], vbx[3]
    eps_root = vw * eps_px / card_px   # one rounding step in root units ≈ eps_px on a card_px-wide card
    # referenced ids
    refs = set(re.findall(r"url\(\s*#([^)\s]+)\s*\)", svg_text)) | set(re.findall(r"href\s*=\s*[\"']#([^\"']+)", svg_text))
    # pass 1: the largest scale anything is drawn at (defs content is drawn at its use sites — be safe, use the largest)
    maxs = [1.0]
    def walk_scale(el, m):
        lt = local(el.tag); mm = mat_mul(m, parse_transform(el.get("transform"))) if el.get("transform") else m
        if lt == "use": mm = mat_mul(mm, [1, 0, 0, 1, float(el.get("x") or 0), float(el.get("y") or 0)])
        maxs[0] = max(maxs[0], mat_scale(mm))
        for ch in list(el): walk_scale(ch, mm)
    walk_scale(root, [1, 0, 0, 1, 0, 0])
    DEFSY = {"defs", "symbol", "clipPath", "mask", "pattern"}
    def clean(el, m, in_defs):
        # drop foreign elements, comments, metadata
        for ch in list(el):
            if not isinstance(ch.tag, str) or ns(ch.tag) not in ("", SVGNS) or local(ch.tag) not in KEEP_EL:
                el.remove(ch); continue
        for k in list(el.attrib):
            if k.startswith("{") and ns(k) != XLINK: del el.attrib[k]; continue
            lk = local(k)
            if lk in DROP_ATTR and el.attrib[k] not in refs: del el.attrib[k]; continue
            if lk in ("version", "baseProfile", "enable-background", "space") : del el.attrib[k]; continue
            if lk.startswith("data-") or lk.startswith("sodipodi") or lk.startswith("inkscape"): del el.attrib[k]
        lt = local(el.tag)
        mm = mat_mul(m, parse_transform(el.get("transform"))) if el.get("transform") else m
        here = in_defs or lt in DEFSY
        s = maxs[0] if here else mat_scale(mm)
        dec = max(0, math.ceil(-math.log10(eps_root / s)))
        if lt == "path" and el.get("d"):
            el.set("d", path_out(path_abs(el.get("d")), dec))
            if not el.get("d"): el.set("d", "M0 0")
        if lt in ("polygon", "polyline") and el.get("points"): el.set("points", round_list(el.get("points"), dec))
        if lt in ("rect", "circle", "ellipse", "line", "use") and lt != "svg":
            for k in GEOM_ATTR:
                v = el.get(k)
                if v is not None and re.fullmatch(r"\s*" + NUM.pattern + r"\s*", v): el.set(k, fmtn(float(v), dec))
        if el.get("transform"):
            el.set("transform", re.sub(NUM, lambda mo: fmtn(float(mo.group(0)), 6) if abs(float(mo.group(0))) < 1e6 else mo.group(0), el.get("transform")))
        st = el.get("style")
        if st: el.set("style", ";".join(p.strip() for p in st.split(";") if p.strip() and not p.strip().startswith("-inkscape")))
        for ch in list(el): clean(ch, mm, here)
    clean(root, [1, 0, 0, 1, 0, 0], False)
    root.set("viewBox", " ".join(fmtn(v, 3) for v in vbx))
    ratio = vw / vh
    if ratio >= 1: root.set("width", fmtn(card_px, 0)); root.set("height", fmtn(card_px / ratio, 1))
    else: root.set("width", fmtn(card_px * ratio, 1)); root.set("height", fmtn(card_px, 0))   # a tall flag (Nepal) fits by its height
    for k in ("x", "y", "preserveAspectRatio"):
        if k in root.attrib: del root.attrib[k]
    txt = ET.tostring(root, encoding="unicode", short_empty_elements=True)
    txt = re.sub(r">\s+<", "><", txt)
    txt = txt.replace(' xmlns:xlink="' + XLINK + '"', "") if "xlink:" not in txt.split(">", 1)[1] else txt
    return txt, round(ratio, 3)

# A flag whose slimmed SVG is still big (a detailed coat of arms: Ecuador, El Salvador, Mexico, Spain…) is drawn ONCE here into a
# small palette PNG instead — at RASTER_PX wide (crisp on a 240-px card at 2× and on the TV), 64 colours. Rendered on the Mac
# from the public-domain SVG itself (qlmanage), so nothing else is downloaded. Everything else stays a vector.
RASTER_OVER = 12 * 1024
RASTER_PX = 480
SITE = "/Users/adriennehowe/Library/Python/3.9/lib/python/site-packages"   # Pillow, when run with python3 -I

def sized(orig_svg, w0, h0):
    """The original svg drawn at w0×h0 — given a viewBox from its width/height when it has none."""
    m = re.search(r"<svg\b[^>]*>", orig_svg); tag = m.group(0)
    def attr(k):
        a = re.search(r'\s' + k + r'\s*=\s*["\']([^"\']*)["\']', tag); return a.group(1) if a else None
    nt = tag
    if not attr("viewBox"):
        vw, vh = float(NUM.findall(attr("width"))[0]), float(NUM.findall(attr("height"))[0])
        nt = nt[:-1].rstrip("/") + ' viewBox="0 0 ' + fmtn(vw, 3) + ' ' + fmtn(vh, 3) + '"' + ("/>" if tag.endswith("/>") else ">")
    nt = re.sub(r'\s(width|height)\s*=\s*["\'][^"\']*["\']', "", nt)
    nt = nt.replace("<svg", '<svg width="' + fmtn(w0, 1) + '" height="' + fmtn(h0, 1) + '"', 1)
    return orig_svg[:m.start()] + nt + orig_svg[m.end():]

def raster(orig_svg, name, ratio, workdir):
    """Render the ORIGINAL svg at RASTER_PX — given a viewBox from its width/height when it has none (qlmanage does not scale
    a file without one)."""
    if SITE not in sys.path: sys.path.append(SITE)
    from PIL import Image
    import base64, io
    w0, h0 = (RASTER_PX, RASTER_PX / ratio) if ratio >= 1 else (RASTER_PX * ratio, RASTER_PX)
    src = os.path.join(workdir, "r_" + name + ".svg")
    txt = sized(orig_svg, w0, h0)
    open(src, "w", encoding="utf-8").write(txt)
    subprocess.run(["qlmanage", "-t", "-s", str(RASTER_PX), "-o", workdir, src], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    im = Image.open(src + ".png").convert("RGBA")
    W, H = im.size
    w, h = (RASTER_PX, round(RASTER_PX / ratio)) if ratio >= 1 else (round(RASTER_PX * ratio), RASTER_PX)
    im = im.crop((0, 0, min(w, W), min(h, H)))
    q = im.quantize(colors=64, method=Image.Quantize.FASTOCTREE)
    b = io.BytesIO(); q.save(b, "PNG", optimize=True)
    return base64.b64encode(b.getvalue()).decode("ascii"), im.size

def build(meta, svgdir, check=None, workdir=None):
    idx = json.load(open(os.path.join(svgdir, "_index.json"), encoding="utf-8"))
    F = {}; left = {}; stats = []
    for card, m in meta.items():
        if card in LEFT_OUT: left[card] = LEFT_OUT[card]; continue
        lic = (m.get("license") or ""); code = (m.get("licenseCode") or "")
        if not (lic == "Public domain" and code == "pd" and str(m.get("copyrighted")) == "False"):
            left[card] = "its Commons flag file is not public domain (" + (lic or "no licence listed") + ")"; continue
        raw = open(os.path.join(svgdir, idx[card]), encoding="utf-8-sig").read()
        try: s, ratio = slim(raw)
        except Exception as e:
            left[card] = "its flag file could not be read safely (" + str(e) + ")"; continue
        title = m["title"][5:] if m["title"].startswith("File:") else m["title"]
        # Public domain needs no attribution; the plan's credit is "<file> · <author or 'public domain'> · <licence> · Commons".
        # The file's page (u) names its author — the authors are not copied here, so no person's name rides in the app's files.
        F[card] = {"s": s, "r": ratio, "f": title, "l": "Public domain", "u": m.get("descurl") or ""}
        if len(s.encode()) > RASTER_OVER and workdir:
            png, wh = raster(raw, idx[card][:-4], ratio, workdir)
            del F[card]["s"]; F[card]["p"] = png; F[card]["wh"] = list(wh)
        stats.append((card, len(raw.encode()), len((F[card].get("s") or F[card].get("p")).encode())))
    return F, left, stats

def qlpng(svg_path, outdir):
    subprocess.run(["qlmanage", "-t", "-s", "300", "-o", outdir, svg_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    return os.path.join(outdir, os.path.basename(svg_path) + ".png")

def visual_check(F, meta, svgdir, outdir):
    if SITE not in sys.path: sys.path.append(SITE)
    from PIL import Image, ImageChops
    idx = json.load(open(os.path.join(svgdir, "_index.json"), encoding="utf-8"))
    rows = []
    for card in F:
        if "s" not in F[card]: continue   # a PNG flag: rendered from the original itself
        a = os.path.join(outdir, "orig_" + idx[card]); b = os.path.join(outdir, "slim_" + idx[card])
        r = F[card]["r"]; w0, h0 = (300, 300 / r) if r >= 1 else (300 * r, 300)
        open(a, "w", encoding="utf-8").write(sized(open(os.path.join(svgdir, idx[card]), encoding="utf-8-sig").read(), w0, h0))
        open(b, "w", encoding="utf-8").write(F[card]["s"])
        pa, pb = qlpng(a, outdir), qlpng(b, outdir)
        try:
            ia = Image.open(pa).convert("RGB"); ib = Image.open(pb).convert("RGB")
            if ia.size != ib.size: ib = ib.resize(ia.size)
            d = ImageChops.difference(ia, ib).convert("L")
            hist = d.histogram(); n = sum(hist)
            big = sum(hist[48:]) / n
            mean = sum(i * h for i, h in enumerate(hist)) / n
            rows.append((card, round(mean, 2), round(big * 100, 2)))
        except Exception as e:
            rows.append((card, -1, -1))
    return rows

def emit(F, left, out):
    data = json.dumps({"flags": F, "left": left, "credit": {"source": "Wikimedia Commons", "rule": "public domain only (PLAN_geography_path_2026-11-10.md Appendix E)"}},
                      ensure_ascii=False, separators=(",", ":"), sort_keys=False)
    head = ("// geoflags.js — Geography Path Stage 8 flags (GENERATED by tools/build_geo_flags.py — do not edit by hand).\n"
            "// Wikimedia Commons \"Flag of <Country>.svg\", public domain only, slimmed; per-file credit on every flag. GEOEXTRA (slice 5).\n"
            "// Loaded lazily (HA_LAZY_FILES.geoflags) only when a Flags card needs its picture; nothing here runs on its own.\n")
    rt = r"""
const enc = s => "data:image/svg+xml;utf8," + encodeURIComponent(s);
const HoweGeoFlags = {
  names: () => Object.keys(D.flags),
  has: n => !!D.flags[n],
  text: n => (D.flags[n] ? (D.flags[n].s || null) : null),
  svg: n => { const f = D.flags[n]; return f ? (f.s ? enc(f.s) : "data:image/png;base64," + f.p) : null; },   // a detailed coat of arms is a small PNG (f.p)
  isPng: n => !!(D.flags[n] && D.flags[n].p),
  ratio: n => (D.flags[n] ? D.flags[n].r : null),
  credit: n => { const f = D.flags[n]; return f ? "Flag: " + f.f + " · " + f.l + " · Wikimedia Commons" : ""; },
  file: n => (D.flags[n] ? { file: D.flags[n].f, license: D.flags[n].l, url: D.flags[n].u } : null),
  left: () => Object.assign({}, D.left),
  credits: D.credit
};
if (typeof window !== "undefined") window.HoweGeoFlags = HoweGeoFlags;
if (typeof module !== "undefined" && module.exports) module.exports = HoweGeoFlags;
"""
    txt = head + "(function(){\nconst D=" + data + ";" + rt + "})();\n"
    open(out, "w", encoding="utf-8").write(txt)
    return len(txt.encode())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--meta", required=True); ap.add_argument("--svg", required=True)
    ap.add_argument("--out", default=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "geoflags.js"))
    ap.add_argument("--check", help="folder for the qlmanage renders (Mac); prints the pixel differences")
    a = ap.parse_args()
    meta = json.load(open(a.meta, encoding="utf-8"))
    work = tempfile.mkdtemp(prefix="geoflags_")
    F, left, stats = build(meta, a.svg, workdir=work)
    n = emit(F, left, a.out)
    print("wrote", a.out, n, "bytes;", len(F), "flags;", len(left), "left out:", json.dumps(left, ensure_ascii=False), file=sys.stderr)
    big = sorted(stats, key=lambda s: -s[2])[:12]
    print("largest slimmed:", big, file=sys.stderr)
    print("raw total", sum(s[1] for s in stats), "slim total", sum(s[2] for s in stats), file=sys.stderr)
    if a.check:
        os.makedirs(a.check, exist_ok=True)
        rows = visual_check(F, meta, a.svg, a.check)
        rows.sort(key=lambda r: -r[2])
        print("visual check (card, mean diff 0-255, % pixels off by >48):", file=sys.stderr)
        for r in rows[:25]: print("  ", r, file=sys.stderr)

if __name__ == "__main__":
    main()
