# 🦈 Types of Sharks — unit draft

A unit for David ("3D"), the Pre-K boy in the **Burris family (Melanie's app)**, asked for 2026-11-08: *"at this level, it
would be picture and name, but you can also go ahead and add information cards if you want to for the next level."* It is
a **file in the repo only** — nothing has been written to any Firebase. It is in the database shape the Units tab reads
(`unitStudies/types_of_sharks`), so you can load it yourself **into the Burris app**. (The file itself has no family or kid
names in it, so it would load the same way into any family's app.)

- **`sharks_unit_DRAFT.json`** — the unit record (1.7 MB; it's mostly the pictures).
- **`test_sharks_unit_draft.js`** — checks the file against the app's own code (`node test_sharks_unit_draft.js`, 33 checks).

## What's in it

**Two decks, set up as two stages** (the same way Letters Path and Math Fluency Path work). When you enroll him you
pick **Stage 1**; later, tap **➡ Start Stage 2: Shark facts** on his row in the unit. That stage is the "turn it on
later" switch — the facts deck stays off until you move him up.

| Stage | Deck | What the card does |
|---|---|---|
| 1 | **Sharks** | The picture is the front. He says the name; you flip to check. No backs, nothing to read. 3 cards at a time. |
| 2 | **Shark Facts** | The name and the picture on the front; one short true fact on the back. 3 at a time. |

18 sharks, the same 18 in both decks, in this order (the most familiar first):

| # | Shark | Group | Fact (Stage 2) |
|---|---|---|---|
| 1 | Great White Shark | Famous Sharks | It has about 300 sharp teeth, and new ones keep growing in. It hunts seals. |
| 2 | Hammerhead Shark | Famous Sharks | Its wide, flat head is shaped like a hammer. The great hammerhead uses its head to pin down stingrays. |
| 3 | Tiger Shark | Famous Sharks | Young tiger sharks have dark stripes like a tiger. It eats almost anything — even tires and license plates! |
| 4 | Bull Shark | Famous Sharks | It can swim from the salty sea into freshwater rivers — one went 700 miles up the Mississippi River! |
| 5 | Mako Shark | Famous Sharks | The fastest shark in the sea! It can leap high out of the water. |
| 6 | Whale Shark | Giant Sharks | The biggest fish in the world — it can grow longer than a school bus! It eats tiny plankton. |
| 7 | Basking Shark | Giant Sharks | The second-biggest fish in the world. It has a giant mouth for catching tiny plankton. |
| 8 | Blue Shark | Open-Ocean & Reef Sharks | Its back is deep blue. It swims very far — from New England all the way to South America. |
| 9 | Lemon Shark | Open-Ocean & Reef Sharks | Its skin is yellowish, like a lemon. The color helps it hide over the sandy sea floor. |
| 10 | Thresher Shark | Open-Ocean & Reef Sharks | Its tail can be as long as its body! It whips its tail to stun the fish it eats. |
| 11 | Blacktip Reef Shark | Open-Ocean & Reef Sharks | The tips of its fins look dipped in black paint. It swims in shallow water near coral reefs. |
| 12 | Leopard Shark | Open-Ocean & Reef Sharks | It has dark spots like a leopard. It swims near the shore from Oregon down to Mexico. |
| 13 | Nurse Shark | Sea-Floor Sharks | It rests in the daytime and hunts at night on the sea floor, sucking up food like a vacuum. |
| 14 | Zebra Shark | Sea-Floor Sharks | Baby zebra sharks have stripes like a zebra, but grown-ups have spots! |
| 15 | Wobbegong | Sea-Floor Sharks | Its pattern looks like a carpet. It lies still on the sea floor and waits for fish to come close. |
| 16 | Angel Shark | Sea-Floor Sharks | It is flat like a pancake. It buries itself in the sand and waits to grab fish. |
| 17 | Goblin Shark | Deep & Cold Sharks | It lives deep in the ocean and has pink skin. Its jaws shoot forward to snatch food. |
| 18 | Greenland Shark | Deep & Cold Sharks | It swims very slowly in icy water and can live for hundreds of years — longer than any other animal with a backbone. |

The cookiecutter shark and the megamouth were left out: no clear, freely-licensed picture of a live one.

## How to load it — into the Burris app

It goes into the **Burris** database — Firebase project **`how-academy-burris`** (database
`how-academy-burris-default-rtdb`), the one named in `STEPS_lock_family_databases_2026-10-24.md`. **Not the Howe project.**
The Burris app's code (its copy synced from Howe main on 11/3) has everything this unit needs — staged enroll, the
Start Stage button, the notebook on/off, the 🖼 Pictures card — and `test_sharks_unit_draft.js` passes against the
Burris `index.html` too (33 of 33).

**How the snakes draft (`nc_snakes_unit_DRAFT.json`) was loaded isn't written down** in the repo or the notes (it's from
July 7, before the plan docs, and none of them say). The app has no "load a unit file" button, so the way in is the one
the repo's other setup docs use: **Import JSON in the Firebase console**.

⚠️ Import JSON **replaces everything at the spot you're on**. Do it on the new, empty `types_of_sharks` spot — **never on
`unitStudies` itself** (that would erase every unit).

1. Firebase console → project **`how-academy-burris`** → **Realtime Database** → **Data**. Open **`unitStudies`**.
2. Hover `unitStudies` → **+** → name **`types_of_sharks`**, value `x` → **Add**. (A placeholder, so the spot exists.)
3. Click **`types_of_sharks`** so it's the one open (the path at the top ends in `/unitStudies/types_of_sharks`).
4. **⋮** (top right) → **Import JSON** → choose `sharks_unit_DRAFT.json` → **Import**. The `x` is replaced by the unit.
5. In the **Burris app**: **Units** → **Types of Sharks 🦈** → enroll David at **Stage 1 · Sharks — picture & name**.

Then, optional but worth it: in the Burris app, **Settings → 🖼 Pictures**. The 18 photos load into the database as text
(twice — once per deck, ~1.7 MB). The Pictures card copies each different photo to Storage once and then switches the
links, so the database gets light again — the same move you made on the Howe app on 2026-10-18. (Not tried on the Burris
project: its Storage has to be set up and allow uploads for this to work. If it doesn't, the unit still works as loaded.)

**Notebook pages:** the record doesn't set `nbInsert`, so like the snakes unit it prints unit pages in his notebook
once he's enrolled. If his shark notebook is enough, switch the unit's notebook pages off in the Units tab.

## What I couldn't check

- It hasn't been loaded into the app or seen on a screen — the test runs the app's real functions (`_unitPortrait`,
  `_ustCards`, `_ustApply`) on the file, but not the Units tab or a drill.
- Import JSON's exact buttons are from the console as I know it; I didn't run it.
- I didn't sort the cards by how hard they are for a 3–4-year-old beyond "familiar first"; reorder in the Units tab if you like.

## Pictures and facts — credits

Every picture is from Wikimedia Commons, shrunk to 420 px the way the app shrinks a photo you add. Licences: 7 public
domain, 10 CC BY, 1 CC BY-SA (the lemon shark — the clearest photo there was). Each fact was checked against the
Wikipedia article linked beside it.

| Shark | Picture | By | Licence | Fact source |
|---|---|---|---|---|
| Great White Shark | [White shark.jpg](https://commons.wikimedia.org/wiki/File:White_shark.jpg) | Pterantula (Terry Goss) at en.wikipedia | CC BY 2.5 | [Great white shark](https://en.wikipedia.org/wiki/Great_white_shark) |
| Hammerhead Shark | [Scalloped hammerhead shark (Sphyrna lewini) Costa Rica (cropped).jpg](https://commons.wikimedia.org/wiki/File:Scalloped_hammerhead_shark_%28Sphyrna_lewini%29_Costa_Rica_%28cropped%29.jpg) | Kris-Mikael Krister | CC BY 2.0 | [Great hammerhead](https://en.wikipedia.org/wiki/Great_hammerhead) |
| Tiger Shark | [Tiger Shark Galeocerdo Cuvier (223179837).jpeg](https://commons.wikimedia.org/wiki/File:Tiger_Shark_Galeocerdo_Cuvier_%28223179837%29.jpeg) | Kris Mikael Krister | CC BY 3.0 | [Tiger shark](https://en.wikipedia.org/wiki/Tiger_shark) |
| Bull Shark | [Bull shark (Carcharhinus leucas).jpg](https://commons.wikimedia.org/wiki/File:Bull_shark_%28Carcharhinus_leucas%29.jpg) | João D'Andretta | CC BY 4.0 | [Bull shark](https://en.wikipedia.org/wiki/Bull_shark) |
| Mako Shark | [Shortfin mako (Isurus oxyrinchus).jpg](https://commons.wikimedia.org/wiki/File:Shortfin_mako_%28Isurus_oxyrinchus%29.jpg) | Fábio Olmos | CC BY 4.0 | [Shortfin mako shark](https://en.wikipedia.org/wiki/Shortfin_mako_shark) |
| Whale Shark | [Rhincodon typus fgbnms.jpg](https://commons.wikimedia.org/wiki/File:Rhincodon_typus_fgbnms.jpg) | FGBNMS/Eckert | Public domain | [Whale shark](https://en.wikipedia.org/wiki/Whale_shark) |
| Basking Shark | [Cetorhinus maximus by greg skomal.JPG](https://commons.wikimedia.org/wiki/File:Cetorhinus_maximus_by_greg_skomal.JPG) | Greg Skomal / NOAA Fisheries Service | Public domain | [Basking shark](https://en.wikipedia.org/wiki/Basking_shark) |
| Blue Shark | [Prionace glauca 1.jpg](https://commons.wikimedia.org/wiki/File:Prionace_glauca_1.jpg) | Mark Conlin/NMFS | Public domain | [Blue shark](https://en.wikipedia.org/wiki/Blue_shark) |
| Lemon Shark | [Lemonshark.JPG](https://commons.wikimedia.org/wiki/File:Lemonshark.JPG) | Albert Kok | CC BY-SA 3.0 | [Lemon shark](https://en.wikipedia.org/wiki/Lemon_shark) |
| Thresher Shark | [Pelagic thresher shark (Alopias pelagicus) (cropped).jpg](https://commons.wikimedia.org/wiki/File:Pelagic_thresher_shark_%28Alopias_pelagicus%29_%28cropped%29.jpg) | Pierre Pericard | CC BY 4.0 | [Thresher shark](https://en.wikipedia.org/wiki/Thresher_shark) |
| Blacktip Reef Shark | [Carcharhinus melanopterus mirihi.jpg](https://commons.wikimedia.org/wiki/File:Carcharhinus_melanopterus_mirihi.jpg) | https://www.whatsthatfish.com/profile/fishx6 | Public domain | [Blacktip reef shark](https://en.wikipedia.org/wiki/Blacktip_reef_shark) |
| Leopard Shark | [Triakis semifasciata monterey.jpg](https://commons.wikimedia.org/wiki/File:Triakis_semifasciata_monterey.jpg) | Martin Holst Friborg Pedersen from Copenhagen S, Denmark | CC BY 2.0 | [Leopard shark](https://en.wikipedia.org/wiki/Leopard_shark) |
| Nurse Shark | [Nurse shark.jpg](https://commons.wikimedia.org/wiki/File:Nurse_shark.jpg) | author not given | Public domain | [Nurse shark](https://en.wikipedia.org/wiki/Nurse_shark) |
| Zebra Shark | [Stegostoma fasciatum thailand.jpg](https://commons.wikimedia.org/wiki/File:Stegostoma_fasciatum_thailand.jpg) | Sigmund from Norway | CC BY 2.0 | [Zebra shark](https://en.wikipedia.org/wiki/Zebra_shark) |
| Wobbegong | [Orectolobus maculatus cod ground.jpg](https://commons.wikimedia.org/wiki/File:Orectolobus_maculatus_cod_ground.jpg) | Rick Stuart-Smith / Reef Life Survey | CC BY 4.0 | [Wobbegong](https://en.wikipedia.org/wiki/Wobbegong) |
| Angel Shark | [Squatina squatina tenerife.jpg](https://commons.wikimedia.org/wiki/File:Squatina_squatina_tenerife.jpg) | Philippe Guillaume | CC BY 2.0 | [Angelshark](https://en.wikipedia.org/wiki/Angelshark) |
| Goblin Shark | [Goblin shark (Mitsukurina owstoni).jpg](https://commons.wikimedia.org/wiki/File:Goblin_shark_%28Mitsukurina_owstoni%29.jpg) | Michigan State University/USFWS | Public domain | [Goblin shark](https://en.wikipedia.org/wiki/Goblin_shark) |
| Greenland Shark | [Somniosus microcephalus okeanos.jpg](https://commons.wikimedia.org/wiki/File:Somniosus_microcephalus_okeanos.jpg) | NOAA Okeanos Explorer Program | Public domain | [Greenland shark](https://en.wikipedia.org/wiki/Greenland_shark) |
