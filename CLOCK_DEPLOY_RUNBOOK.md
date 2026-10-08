# 🕰 School-day drill clock — deploy runbook (Howe only)

Branch `school-day-clock` (one plumbing commit on `d0a0dc5`). Code and slot shift ship **together, on a calm
evening, with nobody drilling**. Softener ships **OFF for every kid**. DeWalt / Burris: later, after Howe runs a week.

## Why the shift has to ship with the code
Booked review slots (`next_due`) are stored in the OLD units — the family-wide print counter (~40s). The new
code reads each kid's school-day number (~190s). Code without the shift → every booked card is instantly
overdue. Shift without the code → nothing comes due for months. Same evening, back to back.

## Steps (main session, Adrienne present)
```
T=$(node ~/.howe/fbtoken.js); DB=https://howeacademy-default-rtdb.firebaseio.com; D=~/Desktop/clock_shift_$(date +%Y%m%d); mkdir -p $D
```
1. **Full backup of mastery/** — `curl -s "$DB/mastery.json?auth=$T" -o $D/mastery_FULL_BACKUP.json`
   then confirm it parses and its size is in line with earlier backups.
2. **Fresh fetch** (read-only):
   `curl -s "$DB/mastery/printLog.json?auth=$T" -o $D/printLog.json` ·
   `curl -s "$DB/calendar.json?auth=$T" -o $D/calendar.json` ·
   `curl -s "$DB/pace/plans.json?auth=$T" -o $D/plans.json` ·
   `for k in lincoln ellis lucy julian; do curl -s "$DB/mastery/$k.json?auth=$T" -o $D/mastery_$k.json; done`
3. **Plan** (read-only, run from the branch checkout so it uses the branch's clock code):
   `node scripts/clock_shift_plan.js $D` → **Adrienne reviews `$D/shift_plan_summary.txt`** (every card, old → new slot).
4. **On her yes, one sitting:** merge + push the branch (her deploy), then for each kid apply the targeted
   `next_due` paths — `curl -s -X PATCH "$DB/mastery/<kid>.json?auth=$T" -d @$D/shift_plan_<kid>.json` —
   and GET a few `mastery/<kid>/<key>/next_due` back to verify. If anyone drilled after step 2, redo 2–3 first.
5. **Reload every device** (stale builds keep the old clock; a drill logged on one would book slots in old units).
6. Open Mastery for each kid: header reads **Day #**, today's due count looks like a normal day, Drill Settings
   shows *Max Overdue Reviews / Drill = off*.

## Rollback
Revert the merge, then re-PATCH each card's `next_due` from `mastery_FULL_BACKUP.json`.

## Known limits
- A per-kid "school" override on a weekend doesn't tick the clock (same rule as the Pace page's school-day count).
- `printLog` keeps being appended (date + school-day number) but no longer drives anything.
- Softener caps Mom's drill only; kid study sessions (Mastery HQ piles) are not capped.
