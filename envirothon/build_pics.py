#!/usr/bin/env python3
"""
ENVPICS — shrink the ID Flash pictures into the repo (step 6 of the Envirothon plan, 2026-10-27).

  python3 -I envirothon/build_pics.py [source-folder] [--pillow DIR]      (default ~/Desktop/Envirothon/pics;
                                                        --pillow adds a folder holding Pillow to sys.path, since -I ignores PYTHONPATH)

Reads the source folder's pics_index.json (treated as data: nothing in it is executed), keeps only pictures whose
licence is free to reuse (CC BY / CC BY-SA / CC0 / public domain), and writes a small web copy of each one to
    envirothon/pics/<deck>/<item-slug>/<n>.jpg         (longest side MAX_SIDE px, JPEG quality QUALITY, no metadata,
                                                        aspect kept; <deck> = forestry_id | wildlife_id | aquatic_id)
plus
    envirothon/pics/index.json   = { "<card name exactly as in nc_envirothon_unit.json>": [ {url, credit, shot}, … ] }
    envirothon/pics/CREDITS.md   = every picture's author, licence and source link, and what was left out and why.

Pictures are per ITEM (species / tool) and shared by every card of that item, so the index repeats an item's list under
each of its card names (the app looks a card up by name; gzip on GitHub Pages makes the repetition nearly free).
The build is idempotent: rerun it and every output is rewritten from the source. Needs Pillow
(`python3 -m pip install --user pillow`); without it the script says so and writes nothing.

  --extra DIR (repeatable; her yes 2026-10-30 "Yes, add them"): a checked Commons set in the staging layout —
    DIR/index_staging.json = { "<item>": [ {url: "<any>/<group>/<slug>/<n>.jpg", credit: "author · Wikimedia Commons ·
    licence", shot, source, note?} ] } — e.g. ~/Desktop/Envirothon/pics_staging (2026-10-28) and pics_fill (2026-10-30).
    Each picture follows the item's existing ones (numbering continues), goes under every ID card of its item (else the
    item's own name, e.g. a gear item with no card), passes the same FREE rule, and is skipped when its Commons file page
    is already in the set. Every extra picture is written with "check": true, so the teacher's 📷 Photos to add list asks
    her to confirm it once (CPPHOTOTODO).
"""
import json, os, re, sys, io

MAX_SIDE = 600      # px, longest side — a drill card shows ≈330 px and a full-screen flash ≈600 px; 1200 px would be 60 MB
QUALITY = 70        # JPEG quality; with MAX_SIDE this lands the 361 free pictures near 15 MB (target: well under 20 MB)
FREE = re.compile(r"^(CC BY(-SA)?( \d(\.\d)?( [a-z]{2})?)?|CC0( 1\.0)?|Public domain)$", re.I)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "pics")
ARGS = sys.argv[1:]
if "--pillow" in ARGS:
    i = ARGS.index("--pillow"); sys.path.insert(0, ARGS[i + 1]); del ARGS[i:i + 2]
EXTRA = []
while "--extra" in ARGS:
    i = ARGS.index("--extra"); EXTRA.append(os.path.expanduser(ARGS[i + 1])); del ARGS[i:i + 2]
SRC = ARGS[0] if ARGS else os.path.expanduser("~/Desktop/Envirothon/pics")
DECK_DIR = {"Forestry · ID": "forestry_id", "Wildlife · ID": "wildlife_id", "Aquatic Ecology · ID": "aquatic_id"}
UNIT = os.path.join(HERE, "nc_envirothon_unit.json")
# --extra groups (the folder after the set's own top folder) → the deck whose items they extend; a group with no deck
# (gear, tools, land practices, pests, lakes) keys its items by name
EXTRA_DECK = {"forestry_id": "Forestry · ID", "wildlife_id": "Wildlife · ID", "aquatic_id": "Aquatic Ecology · ID",
              "soils_id": "Soils and Land Use · ID"}
EXTRA_DIR_ORDER = ["soils_id", "aquatic_gear", "forestry_tools", "soils_land", "forestry_pests", "aquatic_lakes"]
# a staged picture that is a near-copy of one already in the set (a difference hash within 6 bits, checked by eye): left out
EXTRA_SKIP = {"diospyros_virginiana,_persimmon_staminate_flower,_howard_county,_md,_helen_lowe_metmzn_2017-06-16-15.37_(35034974653).jpg"}
# a staged item named differently from the skill item it pictures (units/nc_envirothon/unit.json skills: x.item || x.name)
EXTRA_ITEM = {"Secchi disk": "Secchi disc", "D-frame net": "D-net", "Flow meter": "Price AA flow meter",
              "Diameter tape": "Diameter tape (d-tape)", "Tree calipers": "Caliper", "Chain or tape": "Chain"}

SEC_LABEL = {"aquatic_gear": "Sampling gear (Aquatics)", "forestry_tools": "Forestry tools", "soils_land": "Land practices and erosion (Soils)",
             "forestry_pests": "Forest pest signs (Forestry)", "aquatic_lakes": "Lake stages (Aquatics)"}


def sections(per=None):
    more = [EXTRA_DECK.get(g) or SEC_LABEL.get(g, g) for g in EXTRA_DIR_ORDER] if EXTRA else []
    return list(DECK_DIR) + [x for x in more if per is None or per.get(x)]


def unit_id_cards():
    """item name (lower case) -> (deck, [card names]) over the unit's "· ID" decks (an ID card's item is its `item`, else its front's first part)"""
    out = {}
    try:
        with open(UNIT, "r", encoding="utf-8") as f:
            unit = json.load(f)
    except (OSError, ValueError):
        return out
    for d in unit.get("decks") or []:
        key = str(d.get("key", ""))
        if not key.endswith("· ID"):
            continue
        for c in d.get("cards") or []:
            name = str(c.get("name", ""))
            item = str(c.get("item") or name.split(" · ")[0]).strip()
            if item and name:
                out.setdefault(item.lower(), (key, []))[1].append(name)
    return out


def add_extra(items, card_item, extra_cards):
    """Fold every --extra set into `items` (data only: nothing in it is run). Returns the number of pictures, or None."""
    seen = set()        # Commons file pages already in the set (the main source and earlier extras)
    for it in items.values():
        for p in it["pics"]:
            u = str(p.get("source_url", ""))
            if u.startswith("https://commons.wikimedia.org/wiki/File:"):
                seen.add(u.split("File:", 1)[1].replace(" ", "_").lower())
    by_item = {}
    for (deck, item) in items:
        by_item.setdefault(item.lower(), (deck, item))
    ucards = unit_id_cards()
    n = 0
    for root in EXTRA:
        try:
            with open(os.path.join(root, "index_staging.json"), "r", encoding="utf-8") as f:
                ext = json.load(f)
        except (OSError, ValueError) as e:
            print("--extra %s: no index_staging.json (%s)" % (root, e)); return None
        if not isinstance(ext, dict):
            print("--extra %s: index_staging.json is not a name → list" % root); return None
        for raw_item, lst in sorted(ext.items()):
            if not isinstance(lst, list):
                continue
            item = EXTRA_ITEM.get(raw_item, raw_item)
            for p in lst:
                if not isinstance(p, dict) or not isinstance(p.get("url"), str):
                    continue
                parts = p["url"].split("/")
                if len(parts) != 4 or not re.fullmatch(r"[a-z_]+", parts[1]) or not re.fullmatch(r"[a-z0-9_]+", parts[2]) or not re.fullmatch(r"\d+\.jpg", parts[3]):
                    print("--extra %s: skipped %s (url is not <set>/<group>/<slug>/<n>.jpg)" % (root, p["url"])); continue
                group, slug = parts[1], parts[2]
                cred = [x.strip() for x in str(p.get("credit", "")).split(" · ")]
                if len(cred) < 3:
                    print("--extra %s: skipped %s (credit is not author · provider · licence)" % (root, p["url"])); continue
                page = str(p.get("source", ""))
                title = page.split("File:", 1)[1].replace(" ", "_").lower() if "File:" in page else ""
                if not page.startswith("https://commons.wikimedia.org/wiki/File:") or title in seen or title in EXTRA_SKIP:
                    continue    # not a Commons file page, or already in the set: no duplicates
                seen.add(title)
                deck = EXTRA_DECK.get(group)
                key = by_item.get(item.lower()) if deck else None
                if key and key[0] != deck:
                    key = None
                if not key:
                    key = (deck or "group:" + group, item)
                    if key not in items:
                        items[key] = {"slug": slug, "pics": [], "dir": DECK_DIR.get(deck, group)}
                        if deck not in DECK_DIR:
                            items[key]["sec"] = deck or SEC_LABEL.get(group, group)
                        u = ucards.get(item.lower())
                        extra_cards[key] = u[1] if (u and deck and u[0] == deck) else [item]
                        by_item.setdefault(item.lower(), key)
                items[key]["pics"].append({"file": "/".join(parts[1:]), "_abs": os.path.join(root, *parts[1:]), "_root": root,
                                           "license": cred[-1], "author": " · ".join(cred[:-2]), "provider": cred[-2],
                                           "shot": str(p.get("shot") or "photo"), "source_url": page, "note": str(p.get("note", "")), "check": True})
                n += 1
    return n


def main():
    try:
        from PIL import Image, ImageOps
    except ImportError:
        print("Pillow is not installed: python3 -m pip install --user pillow   (nothing written)")
        return 2
    with open(os.path.join(SRC, "pics_index.json"), "r", encoding="utf-8") as f:
        src = json.load(f)
    cards = src.get("cards") or {}
    if not isinstance(cards, dict) or not cards:
        print("no cards in pics_index.json"); return 2

    # Group the source pictures by item; every card of an item lists the same pictures.
    items = {}          # (deck, item) -> {"slug", "pics": [src picture dicts]}
    card_item = {}      # card name -> (deck, item)
    for name, rec in cards.items():
        if not isinstance(rec, dict) or not isinstance(rec.get("pictures"), list):
            continue
        deck, item = str(rec.get("deck", "")), str(rec.get("item", ""))
        if deck not in DECK_DIR:
            continue
        key = (deck, item)
        card_item[name] = key
        if key not in items:
            pics = [p for p in rec["pictures"] if isinstance(p, dict) and isinstance(p.get("file"), str)]
            pics.sort(key=lambda p: p["file"])
            slug = pics[0]["file"].split("/")[1] if pics and len(pics[0]["file"].split("/")) == 3 else re.sub(r"[^a-z0-9]+", "_", item.lower()).strip("_")
            items[key] = {"slug": slug, "pics": pics, "dir": DECK_DIR[deck]}
    extra_cards = {}    # (deck, item) of an --extra item that is new -> card names it goes under
    if EXTRA:
        n_extra = add_extra(items, card_item, extra_cards)
        if n_extra is None:
            return 2

    index = {}
    credits = []        # (deck, item, n, author, licence, source_url, shot)
    left_out = []       # (deck, item, file, licence, note)
    total_bytes = 0; n_files = 0; per_deck = {}
    for (deck, item), it in sorted(items.items()):
        ddir = it["dir"]
        folder = os.path.join(OUT, ddir, it["slug"])
        os.makedirs(folder, exist_ok=True)
        # clear stale numbered copies so a rerun never leaves extras behind
        for old in os.listdir(folder):
            if re.fullmatch(r"\d+\.jpg", old):
                os.remove(os.path.join(folder, old))
        out_list = []
        n = 0
        for p in it["pics"]:
            lic = str(p.get("license", "")).strip()
            note = str(p.get("note", ""))
            parts = [x.strip() for x in note.split(";")]
            shot = parts[0] if parts and parts[0] else "photo"
            if "_abs" in p:
                shot, parts = p["shot"], [p["shot"], p["provider"]]
            if not FREE.match(lic):
                left_out.append((deck, item, p["file"], lic, note[:160]))
                continue
            base = p.get("_root") or SRC
            srcfile = os.path.normpath(p["_abs"] if "_abs" in p else os.path.join(SRC, p["file"]))
            if not srcfile.startswith(os.path.normpath(base) + os.sep) or not os.path.isfile(srcfile):
                left_out.append((deck, item, p["file"], lic, "file missing or outside the source folder"))
                continue
            n += 1
            im = Image.open(srcfile)
            im = ImageOps.exif_transpose(im).convert("RGB")
            im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, "JPEG", quality=QUALITY, optimize=True, progressive=True)   # no exif / icc → metadata stripped
            data = buf.getvalue()
            rel = "envirothon/pics/%s/%s/%d.jpg" % (ddir, it["slug"], n)
            with open(os.path.join(folder, "%d.jpg" % n), "wb") as f:
                f.write(data)
            total_bytes += len(data); n_files += 1
            provider = parts[1] if len(parts) > 1 else ""
            author = str(p.get("author", "")).strip() or "unknown"
            credit = " · ".join(x for x in [author, provider, lic] if x)
            rec = {"url": rel, "credit": credit, "shot": shot}
            if p.get("check"):
                rec["check"] = True     # added by --extra: the teacher confirms it once (CPPHOTOTODO)
            out_list.append(rec)
            credits.append((it.get("sec", deck), item, rel, author, lic, str(p.get("source_url", "")), shot))
            per_deck[it.get("sec", deck)] = per_deck.get(it.get("sec", deck), 0) + 1
        it["out"] = out_list

    for name, key in sorted(card_item.items()):
        index[name] = items[key]["out"]
    for key, names in sorted(extra_cards.items()):
        for name in names:
            if items[key]["out"]:
                index[name] = items[key]["out"]
    with open(os.path.join(OUT, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, separators=(",", ":"), sort_keys=True)

    short = [(it.get("sec", d), i, len(it["out"])) for (d, i), it in sorted(items.items()) if len(it["out"]) < 3]
    md = ["# ID Flash pictures — credits", "",
          "Built by `envirothon/build_pics.py` from `~/Desktop/Envirothon/pics/pics_index.json`%s. %d pictures, %.1f MB, longest side %d px, JPEG quality %d, metadata stripped. Pictures are per item (species / tool) and shared by every card of that item." % ("".join(" + `%s` (checked Commons photos, each marked for the teacher to confirm)" % ("~/" + os.path.relpath(e, os.path.expanduser("~")) if e.startswith(os.path.expanduser("~")) else e) for e in EXTRA), n_files, total_bytes / 1048576, MAX_SIDE, QUALITY), ""]
    for deck in sections(per_deck):
        md += ["## %s — %d pictures" % (deck, per_deck.get(deck, 0)), "", "| picture | item | shot | author | licence | source |", "|---|---|---|---|---|---|"]
        for (d, item, rel, author, lic, url, shot) in credits:
            if d == deck:
                md.append("| %s | %s | %s | %s | %s | %s |" % (rel.replace("envirothon/pics/", ""), item, shot, author.replace("|", "/"), lic, ("[link](%s)" % url) if url else ""))
        md.append("")
    md += ["## Left out — not shown to be free to reuse (%d)" % len(left_out), "",
           "These are the pictures extracted from the official NCWRC species profiles. Their licence line reads \"rights per credit line, educational use\" and the credit lines name individual photographers, so they are not free to republish on a public site. They stay in the Desktop folder; Adrienne can add any she has rights to by hand.", "",
           "| deck | item | source file | licence |", "|---|---|---|---|"]
    for (d, item, file, lic, note) in left_out:
        md.append("| %s | %s | %s | %s |" % (d, item, file, lic))
    md += ["", "## Items under three pictures after the cut (%d)" % len(short), ""]
    md += ["- %s · %s — %d picture%s" % (d, i, n, "" if n == 1 else "s") for (d, i, n) in short] or ["- none"]
    md.append("")
    with open(os.path.join(OUT, "CREDITS.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(md))

    print("wrote %d pictures, %.1f MB, into %s" % (n_files, total_bytes / 1048576, OUT))
    for deck in sections(per_deck):
        print("  %-38s %d" % (deck, per_deck.get(deck, 0)))
    print("  cards in index: %d, items: %d, left out: %d, items under 3: %s" % (len(index), len(items), len(left_out), short or "none"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
