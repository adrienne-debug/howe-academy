# 🦈 Types of Sharks — unit draft (version 2: 56 sharks)

A unit for David ("3D"), the Pre-K boy in the **Burris family (Melanie's app)**, asked for 2026-11-08: *"at this level, it
would be picture and name, but you can also go ahead and add information cards if you want to for the next level."* It is
a **file in the repo only** — this branch writes nothing to any Firebase. It is in the database shape the Units tab reads
(`unitStudies/types_of_sharks`). (The file itself has no family or kid names in it, so it would load the same way into any
family's app.)

**Version 2 (2026-11-10).** Version 1 had 18 sharks and was imported into a live database on 2026-11-10. Told it had 18 of
500+ species, Adrienne said: *"i want a bigger list for sure."* Version 2 keeps those 18 cards **exactly** as imported —
same names, order, groups, facts, pictures and credits, first in both decks — and appends **38 more**, for **56 sharks**.
Same `id` (`types_of_sharks`), same title, same two stages and deck settings; `version` is now `2`, and the one-line
description says "Fifty-six kinds" instead of "Eighteen kinds".

- **`sharks_unit_DRAFT.json`** — the unit record: **4,698,984 bytes (4.48 MB)**, almost all pictures (each photo is stored
  twice, once per deck, like v1). v1 was 1,796,421 bytes. Well under the Realtime Database's limits for one write.
- **`test_sharks_unit_draft.js`** — checks the file against the app's own code (`node test_sharks_unit_draft.js`, 43
  checks), including that the first 18 cards, their 36 pictures and 18 credits are byte-identical to v1 (read from the v1
  commit `b758651` in git).

## What's in it

**Two decks, set up as two stages** (the same way Letters Path and Math Fluency Path work). When you enroll him you
pick **Stage 1**; later, tap **➡ Start Stage 2: Shark facts** on his row in the unit. That stage is the "turn it on
later" switch — the facts deck stays off until you move him up.

| Stage | Deck | What the card does |
|---|---|---|
| 1 | **Sharks** | The picture is the front. He says the name; you flip to check. No backs, nothing to read. 3 cards at a time. |
| 2 | **Shark Facts** | The name and the picture on the front; one short true fact on the back. 3 at a time. |

56 sharks, the same 56 in both decks, in this order. 1–18 are v1, unchanged; 19–56 (🆕) are new, most familiar first. The
new ones go into the five v1 groups (no new group was needed): 15 Open-Ocean & Reef, 20 Sea-Floor, 3 Deep & Cold. Each new
fact is one sentence (v1's facts keep their words, some of which are two sentences).

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
| 19 | Sand Tiger Shark 🆕 | Open-Ocean & Reef Sharks | It is the only shark known to gulp air at the surface and hold it in its belly, so it can float without swimming. |
| 20 | Bonnethead Shark 🆕 | Open-Ocean & Reef Sharks | Its head is shaped like a shovel, and it was the first shark found to eat plants — it munches seagrass! |
| 21 | Sawshark 🆕 | Sea-Floor Sharks | Its long nose is edged with teeth like a saw, and two long whiskers hang from the middle of it. |
| 22 | Spiny Dogfish 🆕 | Open-Ocean & Reef Sharks | It has a sharp spine by each back fin, and it hunts in packs that can have thousands of sharks! |
| 23 | Blacktip Shark 🆕 | Open-Ocean & Reef Sharks | It can leap out of the water and spin around three or four times before it splashes back down! |
| 24 | Whitetip Reef Shark 🆕 | Open-Ocean & Reef Sharks | It can rest in a cave all day without swimming, then squeeze into holes in the reef to find food at night. |
| 25 | Oceanic Whitetip Shark 🆕 | Open-Ocean & Reef Sharks | Its long, rounded fins have white tips, and it roams the open ocean far from land. |
| 26 | Caribbean Reef Shark 🆕 | Open-Ocean & Reef Sharks | It can lie still on the sea floor or inside a cave, which is unusual for a shark that swims so much. |
| 27 | Gray Reef Shark 🆕 | Open-Ocean & Reef Sharks | When it feels bothered, it hunches its back and swims in a wiggly way to warn others to stay back. |
| 28 | Silky Shark 🆕 | Open-Ocean & Reef Sharks | It is named for its skin, which feels smooth like silk. |
| 29 | Sandbar Shark 🆕 | Open-Ocean & Reef Sharks | It has a very tall back fin, and lots of babies grow up in Chesapeake Bay. |
| 30 | Dusky Shark 🆕 | Open-Ocean & Reef Sharks | It grows very slowly and is not a grown-up until it is about 20 years old. |
| 31 | Silvertip Shark 🆕 | Open-Ocean & Reef Sharks | Every one of its fins has a bright white edge, which is how it got its name. |
| 32 | Galápagos Shark 🆕 | Open-Ocean & Reef Sharks | It is named after the Galápagos Islands, where the first one was found. |
| 33 | Sicklefin Lemon Shark 🆕 | Open-Ocean & Reef Sharks | Babies swim in water so shallow that their back fins stick up out of the water! |
| 34 | School Shark 🆕 | Open-Ocean & Reef Sharks | It travels very far — one swam from England all the way to Iceland! |
| 35 | Port Jackson Shark 🆕 | Sea-Floor Sharks | Dark stripes like a harness cross its eyes, and it loves to eat spiky sea urchins. |
| 36 | Horn Shark 🆕 | Sea-Floor Sharks | It has a spine like a little horn on each back fin, and it pushes itself along the bottom with its fins. |
| 37 | Swell Shark 🆕 | Sea-Floor Sharks | When it is scared, it swallows water and puffs up to about twice its size! |
| 38 | Epaulette Shark 🆕 | Sea-Floor Sharks | It often walks along the bottom on its fins instead of swimming! |
| 39 | Bamboo Shark 🆕 | Sea-Floor Sharks | Babies have dark stripes, and it can stay alive out of the water for up to 12 hours. |
| 40 | Tawny Nurse Shark 🆕 | Sea-Floor Sharks | In the daytime, two dozen or more of them may pile up together to rest inside a cave! |
| 41 | Tasselled Wobbegong 🆕 | Sea-Floor Sharks | A fringe of frilly flaps around its head looks like a shaggy beard and helps it hide on the reef. |
| 42 | Pajama Shark 🆕 | Sea-Floor Sharks | Its thick dark stripes look like striped pajamas, and it spends the day hiding in caves. |
| 43 | Leopard Catshark 🆕 | Sea-Floor Sharks | It has leopard-like spots and rests in caves by day, then hunts near the shore at night. |
| 44 | Small-Spotted Catshark 🆕 | Sea-Floor Sharks | Its eggs come in tough little cases with curly strings that hold on to seaweed. |
| 45 | Coral Catshark 🆕 | Sea-Floor Sharks | Its long, thin body can wiggle into small spaces in the reef, and it hunts at night. |
| 46 | Puffadder Shyshark 🆕 | Sea-Floor Sharks | When it is scared, it curls into a ring and covers its eyes with its tail! |
| 47 | Draughtsboard Shark 🆕 | Sea-Floor Sharks | Its blotchy pattern looks like a checkerboard, and when it is scared it puffs up with water or air! |
| 48 | Smooth Dogfish 🆕 | Sea-Floor Sharks | Instead of sharp teeth, it has rows of flat teeth for crushing crabs. |
| 49 | Banded Houndshark 🆕 | Sea-Floor Sharks | Young ones have dark bands and dots that fade as they grow up. |
| 50 | Necklace Carpetshark 🆕 | Sea-Floor Sharks | A wide black collar wraps around its neck like a necklace, and it has white spots. |
| 51 | Crested Bullhead Shark 🆕 | Sea-Floor Sharks | It has big ridges above its eyes, like bushy eyebrows. |
| 52 | Zebra Bullhead Shark 🆕 | Sea-Floor Sharks | It has stripes like a zebra, and it eats spiky sea urchins. |
| 53 | Blind Shark 🆕 | Sea-Floor Sharks | It is not really blind — it shuts its eyes when it is pulled out of the water! |
| 54 | Bluntnose Sixgill Shark 🆕 | Deep & Cold Sharks | Most sharks have five gill slits on each side, but this one has six! |
| 55 | Broadnose Sevengill Shark 🆕 | Deep & Cold Sharks | Most sharks have five gill slits on each side, but this one has seven! |
| 56 | Chain Catshark 🆕 | Deep & Cold Sharks | It has a pattern like a chain, and its skin glows in the dark deep sea. |

### Which sharks were looked for and left out (and why)

The rule, same as v1: a **clear, freely licensed photo of a LIVE shark** — public domain, CC0, CC BY or CC BY-SA, with
the author recorded. No museum specimens, preserved or stuffed sharks, sharks dead on a deck or a beach, sharks on a hook,
drawings, X-rays or maps; no CC-ND, no non-commercial-only, no fair use. Everything was searched on Wikimedia Commons
(which also carries the NOAA, USFWS and Flickr public-domain/CC photos).

| Shark | Why it's not in |
|---|---|
| Frilled shark | Every photo is a preserved or stuffed specimen, a drawing, or one blurry deep-sea video still with numbers across it. |
| Porbeagle | Only dead or hooked ones (on deck, on a line, a mounted model) and drawings. |
| Spinner shark | Only dead specimens on tables/beaches and drawings. |
| Salmon shark | Only caught ones (on deck, in nets) and food photos. |
| Bigeye thresher | Only dead or hooked ones; the plain Thresher Shark card (v1) covers threshers. |
| Winghead shark | Only preserved specimens, an X-ray and drawings. |
| Megamouth shark | Still none of a live one — preserved specimens, a dead one on a dock, 3-D renders. |
| Cookiecutter shark | Still none of a live one — dead specimens; the "live" photos are of the bite marks on dolphins. |
| Kitefin shark | Only dead ones in fish boxes, skin close-ups and a skull. |
| Velvet belly lanternshark | Only a just-caught one held in a hand out of the water and preserved specimens — not clearly alive. |
| Pacific sleeper shark | Only a hooked one at a boat's side and a dead one. |
| Prickly shark | One live deep-sea photo, but it shows only part of a dim shark with a letter "D" printed on it — not clear for a 4-year-old. |
| Bramble, crocodile, Pondicherry, gummy, Atlantic sharpnose, sharpnose sevengill sharks | Only drawings and dead specimens. |
| Great hammerhead, scalloped hammerhead | Good photos exist, but v1's **Hammerhead Shark** card already uses a scalloped hammerhead photo with a great-hammerhead fact; a second and third hammerhead would look the same to a Pre-K kid and fight with that card. |
| Japanese bullhead, whitespotted bamboo shark, smalltooth sand tiger, common smooth-hound | Licensed live photos exist, but each looks almost the same as a card already in the deck (Port Jackson/horn/crested bullhead, Bamboo Shark, Sand Tiger Shark, Smooth Dogfish). Easy to add later if you want them. |
| Hooded carpetshark, leopard epaulette shark | Hooded: only a specimen photo. Leopard epaulette: one photo, taken from a social-media post — skipped rather than chased. |

One swap made while building: the first Galápagos shark photo picked was by a photographer whose first name matches a
name the "no family names in the file" check looks for, so a public-domain NOAA photo of the same species is used instead.

## How to bring v2 in — **not** the way v1 went in

⚠️ v1 went in with **Import JSON on the `types_of_sharks` spot**. Doing that again with v2 would **replace everything at
that spot** — including anything the app has written there since (enrolling writes `unitStudies/types_of_sharks/enrolled/<kid>`
and `…/kidStage/<kid>`). If he has been enrolled, a whole-spot import would quietly un-enroll him. So v2 should go in as
**targeted writes of only the new parts**, leaving `enrolled` and `kidStage` alone:

- `decks/0/cards/18` … `decks/0/cards/55` and `decks/1/cards/18` … `decks/1/cards/55` (the 38 new cards in each deck)
- `visuals/Sharks_<name>` and `visuals/Shark Facts_<name>` for the 38 new names (76 pictures)
- `credits/18` … `credits/55`
- `desc` and `version`

Nothing else in the record changed (the test proves the first 18 cards, 36 pictures and 18 credits are identical to v1).
The hub does this import on Adrienne's word; this branch writes nothing.

**If he's already enrolled:** enrolling seeded his bank with the 18 v1 sharks. The 38 new ones won't appear for him just
because the unit record grows — they also have to reach his bank (`mastery/<kid>_custom_items`, entries like
`{cat:"Sharks", name:"Sand Tiger Shark"}`). The app's own `_ustApply` (what Enroll / Start Stage run) skips cards already in
his bank and adds only missing ones, so re-picking Stage 1 for him *looks* like it would top it up — **not tried on real
data**. If he isn't enrolled yet when v2 goes in, none of this matters: enrolling at Stage 1 puts all 56 in his bank.

Then, optional but worth it (same as v1): **Settings → 🖼 Pictures** copies each photo to Storage once and switches the
links, so the database gets light again.

## What I couldn't check

- It hasn't been loaded into the app or seen on a screen — the test runs the app's real functions (`_unitPortrait`,
  `_ustCards`, `_ustApply`) on the file, but not the Units tab or a drill.
- The re-pick-Stage-1 top-up for an already-enrolled kid (above) is read from the code, not run.
- Many reef sharks (blacktip, dusky, sandbar, silky, gray reef, Galápagos, silvertip, Caribbean reef) look alike in
  photos. They're there because they're real, common sharks, but a 4-year-old may need the grown-up's help on those — you
  could hold them back in the Units tab until the easy ones are known.
- Each new fact was checked against the Wikipedia article linked beside it (one first draft was wrong — the coral catshark
  does *not* walk on its fins — and was rewritten).

## Pictures and facts — credits

Every picture is from Wikimedia Commons, shrunk to 420 px (longest side) at JPEG quality 82, the way the app's
`mastCompressImg(f, 420, 0.82)` shrinks a photo you add. Five new photos were cropped to the shark first (sixgill,
small-spotted catshark, puffadder shyshark, tasselled wobbegong, and the zebra bullhead — to leave out an aquarium sign).
Licences, all 56: 20 public domain, 2 CC0, 21 CC BY (2.0–4.0), 13 CC BY-SA (2.0–4.0).

| # | Shark | Picture | By | Licence | Fact source |
|---|---|---|---|---|---|
| 1 | Great White Shark | [White shark.jpg](https://commons.wikimedia.org/wiki/File:White_shark.jpg) | Pterantula (Terry Goss) at en.wikipedia | CC BY 2.5 | [Great white shark](https://en.wikipedia.org/wiki/Great_white_shark) |
| 2 | Hammerhead Shark | [Scalloped hammerhead shark (Sphyrna lewini) Costa Rica (cropped).jpg](https://commons.wikimedia.org/wiki/File:Scalloped_hammerhead_shark_%28Sphyrna_lewini%29_Costa_Rica_%28cropped%29.jpg) | Kris-Mikael Krister | CC BY 2.0 | [Great hammerhead](https://en.wikipedia.org/wiki/Great_hammerhead) |
| 3 | Tiger Shark | [Tiger Shark Galeocerdo Cuvier (223179837).jpeg](https://commons.wikimedia.org/wiki/File:Tiger_Shark_Galeocerdo_Cuvier_%28223179837%29.jpeg) | Kris Mikael Krister | CC BY 3.0 | [Tiger shark](https://en.wikipedia.org/wiki/Tiger_shark) |
| 4 | Bull Shark | [Bull shark (Carcharhinus leucas).jpg](https://commons.wikimedia.org/wiki/File:Bull_shark_%28Carcharhinus_leucas%29.jpg) | João D'Andretta | CC BY 4.0 | [Bull shark](https://en.wikipedia.org/wiki/Bull_shark) |
| 5 | Mako Shark | [Shortfin mako (Isurus oxyrinchus).jpg](https://commons.wikimedia.org/wiki/File:Shortfin_mako_%28Isurus_oxyrinchus%29.jpg) | Fábio Olmos | CC BY 4.0 | [Shortfin mako shark](https://en.wikipedia.org/wiki/Shortfin_mako_shark) |
| 6 | Whale Shark | [Rhincodon typus fgbnms.jpg](https://commons.wikimedia.org/wiki/File:Rhincodon_typus_fgbnms.jpg) | FGBNMS/Eckert | Public domain | [Whale shark](https://en.wikipedia.org/wiki/Whale_shark) |
| 7 | Basking Shark | [Cetorhinus maximus by greg skomal.JPG](https://commons.wikimedia.org/wiki/File:Cetorhinus_maximus_by_greg_skomal.JPG) | Greg Skomal / NOAA Fisheries Service | Public domain | [Basking shark](https://en.wikipedia.org/wiki/Basking_shark) |
| 8 | Blue Shark | [Prionace glauca 1.jpg](https://commons.wikimedia.org/wiki/File:Prionace_glauca_1.jpg) | Mark Conlin/NMFS | Public domain | [Blue shark](https://en.wikipedia.org/wiki/Blue_shark) |
| 9 | Lemon Shark | [Lemonshark.JPG](https://commons.wikimedia.org/wiki/File:Lemonshark.JPG) | Albert Kok | CC BY-SA 3.0 | [Lemon shark](https://en.wikipedia.org/wiki/Lemon_shark) |
| 10 | Thresher Shark | [Pelagic thresher shark (Alopias pelagicus) (cropped).jpg](https://commons.wikimedia.org/wiki/File:Pelagic_thresher_shark_%28Alopias_pelagicus%29_%28cropped%29.jpg) | Pierre Pericard | CC BY 4.0 | [Thresher shark](https://en.wikipedia.org/wiki/Thresher_shark) |
| 11 | Blacktip Reef Shark | [Carcharhinus melanopterus mirihi.jpg](https://commons.wikimedia.org/wiki/File:Carcharhinus_melanopterus_mirihi.jpg) | https://www.whatsthatfish.com/profile/fishx6 | Public domain | [Blacktip reef shark](https://en.wikipedia.org/wiki/Blacktip_reef_shark) |
| 12 | Leopard Shark | [Triakis semifasciata monterey.jpg](https://commons.wikimedia.org/wiki/File:Triakis_semifasciata_monterey.jpg) | Martin Holst Friborg Pedersen from Copenhagen S, Denmark | CC BY 2.0 | [Leopard shark](https://en.wikipedia.org/wiki/Leopard_shark) |
| 13 | Nurse Shark | [Nurse shark.jpg](https://commons.wikimedia.org/wiki/File:Nurse_shark.jpg) | author not given | Public domain | [Nurse shark](https://en.wikipedia.org/wiki/Nurse_shark) |
| 14 | Zebra Shark | [Stegostoma fasciatum thailand.jpg](https://commons.wikimedia.org/wiki/File:Stegostoma_fasciatum_thailand.jpg) | Sigmund from Norway | CC BY 2.0 | [Zebra shark](https://en.wikipedia.org/wiki/Zebra_shark) |
| 15 | Wobbegong | [Orectolobus maculatus cod ground.jpg](https://commons.wikimedia.org/wiki/File:Orectolobus_maculatus_cod_ground.jpg) | Rick Stuart-Smith / Reef Life Survey | CC BY 4.0 | [Wobbegong](https://en.wikipedia.org/wiki/Wobbegong) |
| 16 | Angel Shark | [Squatina squatina tenerife.jpg](https://commons.wikimedia.org/wiki/File:Squatina_squatina_tenerife.jpg) | Philippe Guillaume | CC BY 2.0 | [Angelshark](https://en.wikipedia.org/wiki/Angelshark) |
| 17 | Goblin Shark | [Goblin shark (Mitsukurina owstoni).jpg](https://commons.wikimedia.org/wiki/File:Goblin_shark_%28Mitsukurina_owstoni%29.jpg) | Michigan State University/USFWS | Public domain | [Goblin shark](https://en.wikipedia.org/wiki/Goblin_shark) |
| 18 | Greenland Shark | [Somniosus microcephalus okeanos.jpg](https://commons.wikimedia.org/wiki/File:Somniosus_microcephalus_okeanos.jpg) | NOAA Okeanos Explorer Program | Public domain | [Greenland shark](https://en.wikipedia.org/wiki/Greenland_shark) |
| 19 | Sand Tiger Shark | [Sand tiger shark (Carcharias taurus).jpg](https://commons.wikimedia.org/wiki/File:Sand_tiger_shark_%28Carcharias_taurus%29.jpg) | Bryce Watts-Parker | CC BY 4.0 | [Sand tiger shark](https://en.wikipedia.org/wiki/Sand_tiger_shark) |
| 20 | Bonnethead Shark | [Sphyrna tiburo SI2.jpg](https://commons.wikimedia.org/wiki/File:Sphyrna_tiburo_SI2.jpg) | D Ross Robertson | Public domain | [Bonnethead](https://en.wikipedia.org/wiki/Bonnethead) |
| 21 | Sawshark | [Pristiophorus japonicus ioworld.jpg](https://commons.wikimedia.org/wiki/File:Pristiophorus_japonicus_ioworld.jpg) | タウナギ | CC0 | [Sawshark](https://en.wikipedia.org/wiki/Sawshark) |
| 22 | Spiny Dogfish | [Squalus acanthias stellwagen.jpg](https://commons.wikimedia.org/wiki/File:Squalus_acanthias_stellwagen.jpg) | Doug Costa, NOAA/SBNMS | Public domain | [Spiny dogfish](https://en.wikipedia.org/wiki/Spiny_dogfish) |
| 23 | Blacktip Shark | [Carcharhinus limbatus - Caraibische zwartpunthaai.jpg](https://commons.wikimedia.org/wiki/File:Carcharhinus_limbatus_-_Caraibische_zwartpunthaai.jpg) | Albert Kok at Dutch Wikipedia | Public domain | [Blacktip shark](https://en.wikipedia.org/wiki/Blacktip_shark) |
| 24 | Whitetip Reef Shark | [Triaenodon obesus moc.jpg](https://commons.wikimedia.org/wiki/File:Triaenodon_obesus_moc.jpg) | NOAA | Public domain | [Whitetip reef shark](https://en.wikipedia.org/wiki/Whitetip_reef_shark) |
| 25 | Oceanic Whitetip Shark | [Oceanic Whitetip Shark (Carcharhinus longimanus) at Elphinstone Reef, Egypt.jpg](https://commons.wikimedia.org/wiki/File:Oceanic_Whitetip_Shark_%28Carcharhinus_longimanus%29_at_Elphinstone_Reef,_Egypt.jpg) | Polygonia c-album | CC BY-SA 4.0 | [Oceanic whitetip shark](https://en.wikipedia.org/wiki/Oceanic_whitetip_shark) |
| 26 | Caribbean Reef Shark | [Caribbean reef shark.jpg](https://commons.wikimedia.org/wiki/File:Caribbean_reef_shark.jpg) | Albert kok | CC BY-SA 3.0 | [Caribbean reef shark](https://en.wikipedia.org/wiki/Caribbean_reef_shark) |
| 27 | Gray Reef Shark | [Carcharhinus amblyrhynchos wake.jpg](https://commons.wikimedia.org/wiki/File:Carcharhinus_amblyrhynchos_wake.jpg) | CRED/PIFSC, NOAA | Public domain | [Grey reef shark](https://en.wikipedia.org/wiki/Grey_reef_shark) |
| 28 | Silky Shark | [Carcharhinus falciformis off Cuba.jpg](https://commons.wikimedia.org/wiki/File:Carcharhinus_falciformis_off_Cuba.jpg) | Alex Chernikh | CC BY 2.5 | [Silky shark](https://en.wikipedia.org/wiki/Silky_shark) |
| 29 | Sandbar Shark | [Carcharhinus plumbeus georgia.jpg](https://commons.wikimedia.org/wiki/File:Carcharhinus_plumbeus_georgia.jpg) | Brian Gratwicke | CC BY 2.0 | [Sandbar shark](https://en.wikipedia.org/wiki/Sandbar_shark) |
| 30 | Dusky Shark | [Carcharhinus obscurus in UShaka Sea World 1083.jpg](https://commons.wikimedia.org/wiki/File:Carcharhinus_obscurus_in_UShaka_Sea_World_1083.jpg) | Amada44 | CC BY 3.0 | [Dusky shark](https://en.wikipedia.org/wiki/Dusky_shark) |
| 31 | Silvertip Shark | [Silvertip shark.jpg](https://commons.wikimedia.org/wiki/File:Silvertip_shark.jpg) | Albert kok | CC BY-SA 3.0 | [Silvertip shark](https://en.wikipedia.org/wiki/Silvertip_shark) |
| 32 | Galápagos Shark | [Carcharinus galapagensis 1.jpg](https://commons.wikimedia.org/wiki/File:Carcharinus_galapagensis_1.jpg) | Dr. Dwayne Meadows, NOAA/NMFS/OPR | Public domain | [Galapagos shark](https://en.wikipedia.org/wiki/Galapagos_shark) |
| 33 | Sicklefin Lemon Shark | [Negaprion acutidens 584624095.jpg](https://commons.wikimedia.org/wiki/File:Negaprion_acutidens_584624095.jpg) | Jay Brasher | CC BY 4.0 | [Sicklefin lemon shark](https://en.wikipedia.org/wiki/Sicklefin_lemon_shark) |
| 34 | School Shark | [Galeorhinus galeus SI3.jpg](https://commons.wikimedia.org/wiki/File:Galeorhinus_galeus_SI3.jpg) | D Ross Robertson | Public domain | [School shark](https://en.wikipedia.org/wiki/School_shark) |
| 35 | Port Jackson Shark | [Port-jackson-shark-heterodontus-portusjacksoni-417888-large.jpg](https://commons.wikimedia.org/wiki/File:Port-jackson-shark-heterodontus-portusjacksoni-417888-large.jpg) | Mark Norman, Museums Victoria | CC BY 4.0 | [Port Jackson shark](https://en.wikipedia.org/wiki/Port_Jackson_shark) |
| 36 | Horn Shark | [Heterodontus francisci SI3.jpg](https://commons.wikimedia.org/wiki/File:Heterodontus_francisci_SI3.jpg) | D Ross Robertson | Public domain | [Horn shark](https://en.wikipedia.org/wiki/Horn_shark) |
| 37 | Swell Shark | [Cephaloscyllium ventriosum SI.jpg](https://commons.wikimedia.org/wiki/File:Cephaloscyllium_ventriosum_SI.jpg) | D Ross Robertson | Public domain | [Swellshark](https://en.wikipedia.org/wiki/Swellshark) |
| 38 | Epaulette Shark | [Hemiscyllium ocellatum north direction.jpg](https://commons.wikimedia.org/wiki/File:Hemiscyllium_ocellatum_north_direction.jpg) | Anne Hoggett / Lizard Island Research Station | CC BY 4.0 | [Epaulette shark](https://en.wikipedia.org/wiki/Epaulette_shark) |
| 39 | Bamboo Shark | [Brownbanded bambooshark (Chiloscyllium punctatum).jpg](https://commons.wikimedia.org/wiki/File:Brownbanded_bambooshark_%28Chiloscyllium_punctatum%29.jpg) | Rickard Zerpe | CC BY 2.0 | [Brownbanded bamboo shark](https://en.wikipedia.org/wiki/Brownbanded_bamboo_shark) |
| 40 | Tawny Nurse Shark | [Nebrius ferrugineus.jpg](https://commons.wikimedia.org/wiki/File:Nebrius_ferrugineus.jpg) | David Burdick | Public domain | [Tawny nurse shark](https://en.wikipedia.org/wiki/Tawny_nurse_shark) |
| 41 | Tasselled Wobbegong | [Eucrossorhinus dasypogon (cropped).jpg](https://commons.wikimedia.org/wiki/File:Eucrossorhinus_dasypogon_%28cropped%29.jpg) | Leonard Low from Australia | CC BY 2.0 | [Tasselled wobbegong](https://en.wikipedia.org/wiki/Tasselled_wobbegong) |
| 42 | Pajama Shark | [Poroderma africanum.jpg](https://commons.wikimedia.org/wiki/File:Poroderma_africanum.jpg) | Guido Zsilavecz | CC BY-SA 3.0 | [Pyjama shark](https://en.wikipedia.org/wiki/Pyjama_shark) |
| 43 | Leopard Catshark | [Leopard catshark at A-frame DSC04076.JPG](https://commons.wikimedia.org/wiki/File:Leopard_catshark_at_A-frame_DSC04076.JPG) | Peter Southwood | CC BY-SA 3.0 | [Leopard catshark](https://en.wikipedia.org/wiki/Leopard_catshark) |
| 44 | Small-Spotted Catshark | [Scyliorhinus canicula (Small-spotted catshark or dogfish), Ecomare, Texel, the Netherlands.JPG](https://commons.wikimedia.org/wiki/File:Scyliorhinus_canicula_%28Small-spotted_catshark_or_dogfish%29,_Ecomare,_Texel,_the_Netherlands.JPG) | Bj.schoenmakers | CC0 | [Small-spotted catshark](https://en.wikipedia.org/wiki/Small-spotted_catshark) |
| 45 | Coral Catshark | [Gaya Catshark.jpg](https://commons.wikimedia.org/wiki/File:Gaya_Catshark.jpg) | Kong | CC BY-SA 2.0 | [Coral catshark](https://en.wikipedia.org/wiki/Coral_catshark) |
| 46 | Puffadder Shyshark | [Scyliorhinidae Haploblepharus edwardsii 1.jpg](https://commons.wikimedia.org/wiki/File:Scyliorhinidae_Haploblepharus_edwardsii_1.jpg) | NasserHalaweh | CC BY-SA 4.0 | [Puffadder shyshark](https://en.wikipedia.org/wiki/Puffadder_shyshark) |
| 47 | Draughtsboard Shark | [Carpetshark.jpg](https://commons.wikimedia.org/wiki/File:Carpetshark.jpg) | Py1jtp | CC BY-SA 3.0 | [Draughtsboard shark](https://en.wikipedia.org/wiki/Draughtsboard_shark) |
| 48 | Smooth Dogfish | [Mustelus canis SI.jpg](https://commons.wikimedia.org/wiki/File:Mustelus_canis_SI.jpg) | D Ross Robertson | Public domain | [Smooth dogfish](https://en.wikipedia.org/wiki/Smooth_dogfish) |
| 49 | Banded Houndshark | [Triakis scyllium himeji.jpg](https://commons.wikimedia.org/wiki/File:Triakis_scyllium_himeji.jpg) | OpenCage Systems | CC BY-SA 2.5 | [Banded houndshark](https://en.wikipedia.org/wiki/Banded_houndshark) |
| 50 | Necklace Carpetshark | [Parascyllium variolatum port phillip bay.jpg](https://commons.wikimedia.org/wiki/File:Parascyllium_variolatum_port_phillip_bay.jpg) | Rick Stuart-Smith / Reef Life Survey | CC BY 4.0 | [Necklace carpetshark](https://en.wikipedia.org/wiki/Necklace_carpetshark) |
| 51 | Crested Bullhead Shark | [Heterodontus galeatus callala creek.jpg](https://commons.wikimedia.org/wiki/File:Heterodontus_galeatus_callala_creek.jpg) | Ian Shaw / Reef Life Survey | CC BY 3.0 | [Crested bullhead shark](https://en.wikipedia.org/wiki/Crested_bullhead_shark) |
| 52 | Zebra Bullhead Shark | [Zebra bullhead shark Beijing Aquarium 17 Sep 2010.jpg](https://commons.wikimedia.org/wiki/File:Zebra_bullhead_shark_Beijing_Aquarium_17_Sep_2010.jpg) | Jason Quinn | CC BY-SA 3.0 | [Zebra bullhead shark](https://en.wikipedia.org/wiki/Zebra_bullhead_shark) |
| 53 | Blind Shark | [Blind Shark-Brachaelurus waddi (24718776135).jpg](https://commons.wikimedia.org/wiki/File:Blind_Shark-Brachaelurus_waddi_%2824718776135%29.jpg) | Sylke Rohrlach from Sydney | CC BY-SA 2.0 | [Blind shark](https://en.wikipedia.org/wiki/Blind_shark) |
| 54 | Bluntnose Sixgill Shark | [Hexanchus griseus santa rosa.jpg](https://commons.wikimedia.org/wiki/File:Hexanchus_griseus_santa_rosa.jpg) | NOAA Ocean Explorer from USA | CC BY-SA 2.0 | [Bluntnose sixgill shark](https://en.wikipedia.org/wiki/Bluntnose_sixgill_shark) |
| 55 | Broadnose Sevengill Shark | [Notorynchus cepedianus SI4.jpg](https://commons.wikimedia.org/wiki/File:Notorynchus_cepedianus_SI4.jpg) | D Ross Robertson | Public domain | [Broadnose sevengill shark](https://en.wikipedia.org/wiki/Broadnose_sevengill_shark) |
| 56 | Chain Catshark | [Scyliorhinus retifer okeanos.jpg](https://commons.wikimedia.org/wiki/File:Scyliorhinus_retifer_okeanos.jpg) | NOAA Okeanos Explorer Program | Public domain | [Chain catshark](https://en.wikipedia.org/wiki/Chain_catshark) |
