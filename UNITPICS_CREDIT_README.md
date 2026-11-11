# 📷 Extra pictures with credits (UNITPICS_CREDIT)

Her words, 2026-11-11: *"go on the website that I attach and get the additional pictures for each of the frogs and
toads and the snakes of North Carolina and add them to those units."* The site credits every photo to its
photographer, so the extras need a credit line.

This builds on **UNITMULTIPIC** (merged 2026-11-08), which already lets a unit card hold up to 5 pictures and has
the 🎲 "Multiple pictures" switch. **Nothing in UNITMULTIPIC changes**: the cap stays 4 extras, and the switch still
decides what the drill shows.

## The data, one line

`unitStudies/<id>/visuals/<deck>_<card> = {imageUrl, credit?, more:[url…], moreBy:{<p+hash of url>: {by, src}}}`

- `imageUrl` is still the main picture everywhere: drill, study, games, print sheets, the notebook and the Royal Line.
- `more` is still a list of URL strings (UNITMULTIPIC).
- `moreBy` is the new part. It holds one credit per picture, keyed by `unitPicCreditKey(url)` (`"p"` + a hash of the
  URL, so the key is never all digits). `by` is the photographer as the source prints it. `src` is the page the photo
  came from; it's stored for the record and never shown, because the page name is often the answer. A credit follows
  its picture through ★ and ✕, and an entry with no matching picture is ignored.
- The main picture's credit is still `credit` when it has one. No credit means no credit line.

## What the family sees

- **The chip**: a small dark pill, **📷 +N**, in the lower-right corner of the picture on the study flip card (front
  only) and on the day card's picture. It shows only when the card has extras. An emoji, a single photo, or a kid's
  own picture override gets no chip. Tapping the chip never flips the card.
- **The gallery**: a plain black full-screen view that opens on the main picture, then the extras. You move with ◀ ▶,
  a swipe, or the arrow keys, and it wraps around. Under each picture it shows "📷 Photo by …" (when known) and
  "2 / 5". ✕ or Esc closes it. There's no autoplay. The short fade is turned off under `prefers-reduced-motion`.
  It never shows the card's name or a link, because it can open on the question side of a card. Read-only.

## How Mom adds pictures herself

Open the unit and tap a card. Under the card's photo, **＋ another picture** now has an optional **Photo by** box
beside it. Type the credit first (or leave it blank), then pick the photo. **Save** writes, in UNITMULTIPIC's one
multi-path update on `unitStudies/<id>`:

- `visuals/<key>/more`: UNITMULTIPIC's own write, unchanged.
- `visuals/<key>/moreBy/<k> = {by}`: only for pictures added with a credit. When the save writes the card whole (a
  card with no picture yet), the credit goes inside that object instead.

Nothing is written in dry run. The block itself makes no database calls.

## Test

`node test_unit_pics_credit.js` runs 70 checks on the real code sliced from `index.html`.
