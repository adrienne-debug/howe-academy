# After the drill — one list, one hand-off (design, 2026-11-08)

Her words 11/8: "word workout and then the games after the drill are kind of 2 different things, but both are the same
idea … find a uniform way to tie those together where it's one thing and it's just showing up after the drill that day
where they can work out all those things. I don't think we need the word workout button at the top any longer, but I do
like how it works out those words, and those words should be worked out, and that could be after the drill as well."

## Today: two systems doing one job (checked on main e5cbab4)

| | 🏋️ Word Workout (`WORDWORKOUT_START`, WWV2 + WWONE) | 🎮 Missed-card games (`MISSPLAY_START`, DRILLEND) |
|---|---|---|
| **Switch** | none — always on for spelling decks (`AAS Words`, `Spelling`, `SpellingYouSee`) | per kid, `mastery/<kid>_settings/missPlay.on` (off = nothing) |
| **Entry rule** | `wwNote(it,"miss")`: a spelling word missed on **2 different days** (drill ✗ via `wwAfterDrill`, study, check-up, a spelling test closed with "no time") → `item.ww.on`. **Right away** for a 🚩 problem word or a graded ✗ on a spelling test (`now`). | `mpAfterDrill`: a card scored ✗ in Mom's drill — or ~ while "close cards join" is on — whose deck the games can play (Which one?'s fair pick-3, or a Build-it spelling deck) → `item.gp = {on:true,…}`; cap full → `{wait:true}`. `mpAfterStudy`: wrong 2+ times in one study sitting. |
| **Exit rule** | right on **3 different days** (drill ✓ or the workout's hidden-word step) → `ww.on=false`, `ww.out`. A miss while on starts the 3 days over. Copying the shown word never counts. | right on the FIRST tap 3× the first day, once on later days → a right day; **3 right days** → off the list, due in Mom's next drill; there ✓ = learned (`gp.ok`), ✗/~ = straight back. A wrong tap starts the days over. |
| **"Still to do today"** | the chip counts every `ww.on` word (even one already right today) | `mpTodayList`: cards still needing first-tap rights today |
| **How it's worked** | 👀 See it, copy it (look → cover → write → compare → fix) → hidden word (🔊 hear it / fill the gaps), one button per screen | after the drill: 👀 Watch it (each card big, said, Mom's cue) → the round (Which one? tiles / 🔤 Build it for spelling) |
| **Where it shows** | "🏋️ Word Workout (N)" button at the top of the Mastery/drill screen (kids too) · "🏋️ Word Workout · N words" chip on the kid's Day page | "🎉 Let's have fun with the ones we missed!" hand-off over Scores after Mom's drill saves (switch on) · "🎮 Practice · N cards" chip on the Day page · "🎮 Now your games" on the last study session's finish screen |
| **What it writes / logs** | one targeted set `mastery/<kid>/<ix>/ww` per word. No log entry. | the round's ONE update on `mastery/<kid>` (`{ix}/gp`, `{ix}/next_due`, Build-it's `{ix}/ww`) + one `mastery/gameLog/<kid>/<day>` entry, `game:"practice"`, `from:"drill"` when opened after the drill (none from the Day chip, `"study"` from the study end). |

Overlap: a spelling word can be on BOTH (missed in the drill with the games on → `gp`; missed on a 2nd day → `ww`). Today the
kid sees it in both chips and works it twice. Build it inside the round already counts a Word Workout day for it (SPELLBUILD:
a right first try = a right day, a second miss = a miss), so the round moves both of its rules.

## The one design

**One "After the drill" list per kid** = Word Workout words ∪ missed cards, for today:
- **words** = `ww.on` words not yet right today (`ww.r` has no today) — the "still to do today" filter MISSPLAY already uses,
  applied to words, so a word done today stops being counted and a clean drill that already proved it shows nothing.
- **cards** = `mpTodayList(kid)` (switch on only; off = no cards, as today).
- **a card never appears twice**: a word that is also on today's games list is listed once, as a *card* — the round is
  the only thing that moves its games rule, and its Build it already moves its Word Workout rule. Everything else is a *word*.

**Entry rules: unchanged, one per kind.** `wwNote` / `wwAfterDrill` / the test / 🚩 hooks and `mpAfterDrill` /
`mpAfterStudy` are not touched — nothing is collected more or less than before. Paper drills feed words only, as today.

**Exit rules: unchanged, one per kind.** The workout's own steps (`wwCheck` → `wwNote right` → `_wwWriteCard`) and the
round's own steps (`mpNote` / `mpFinish`) do the counting, exactly as now.

**One hand-off screen** (`#ad-hand`), after Mom's drill saves and lands on Scores, whenever the list has anything today
(words or cards — carried-over ones count, as MISSPLAY's hand-off did; an empty list = Scores, as always):
> 🎉 **Let's work out the ones we missed!** · *<kid>* · 🏋️ N words · 🎮 M cards · **▶ Start** · Not now

Start (the tap unlocks the iPad voice) runs **one flow**: the words first, in the Word Workout as it is (see it, copy it →
hear it / fill the gaps, Check / Next word / All done), then the cards (👀 Watch it → the round, `from:"drill"`), then a
"⭐ All worked out!" toast. Closing a part early (✕) comes back to the hand-off with what's left: **▶ Keep going** / Not now.
A word worked in this sitting (right, or missed twice) doesn't come back in the same sitting.

**The top 🏋️ Word Workout button goes**, and **both Day-page chips go**. The kid's Day page (today, own day, not Mom's or
the all-kids view) shows ONE small line instead — **"✅ After the drill · N"** — when the list has anything left today, so
Mom can still see the count; tapping it opens the same hand-off. Opened from the Day line, the cards part opens the round
directly with no `from`, as the 🎮 chip did — so the game log reads exactly as before.

**One log, nothing new.** No new path, no new field: words write `mastery/<kid>/<ix>/ww` (as now), the round writes its one
update + its one `gameLog` entry (as now). The hand-off itself writes nothing.

**Not here:** the study end's "🎮 Now your games" (it opens the round; unchanged), a game-log entry for the words (that would
be a new write — a follow-up if she wants the words in Scores), switching Word Workout off per kid, the paper drill's hand-off.

## Build shape

One additive block `// AFTERDRILL_START … // AFTERDRILL_END` after `MISSPLAY_END`: `adWords`, `adCards`, `adList`,
`adCount` (pure over `masteryData`), `adAfterDrillSaved(kid)`, `adOpen(kid,from)`, `adStart`, `adNotNow`, `adPartClosed`,
`adRender`, `adDayLineHtml(kid,day)`. Guarded one-line hooks: `wwClose` / `mpClose` tell the flow a part closed;
`wwFinish` skips its "come back tomorrow" toast mid-flow; the workout's "Word i of N" counts only this sitting's words.
`mastSaveResults` calls `adAfterDrillSaved` in place of `mpAfterDrillSaved`; the Day page calls `adDayLineHtml` in place of
the two chips; the drill header's `wwBtnHtml` call goes. Old functions stay defined (their tests still run them).
Test: `test_after_drill_one.js`.
