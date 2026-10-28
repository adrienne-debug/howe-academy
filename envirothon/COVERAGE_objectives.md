# NC Envirothon cards — coverage of the Learning Objectives and the 2026 Area 8 tests

Built 2026-10-27 for Lincoln's unit (`nc_envirothon_unit.json`). For each station:
- **(a)** the official MS Learning Objectives sheet, line by line. Each line is mapped to the card fronts that cover it, or to
  `no card — why`.
- **(b)** the 2026 Southern Piedmont (Area 8) middle-school test, walked question by question. Each question is given by number
  and a short topic only; **no question or answer is copied**. Each names the card(s) whose fact answers it, or says why there
  is none.

Where a tested fact was in the manual and had no card, the card was added from the manual, with its source. That is the only
way the tests steered the set.

Notes that apply everywhere:
- **Card fronts are quoted as built (after the fix passes).** When two stations shared a term card with the same meaning, the
  card was kept in only one station (the merge rule), and the kept card's `info` says "Also studied in …". So a front named
  here may live in a neighbouring station's Terms deck. `parts/merge_log.txt` lists every such move.
- **`core:true`** on a card in the JSON means it is named in an (a) or (b) section below. ID decks follow their own rule; see
  COUNTS.md.
- **Map/table-reading skill (practice, not cards).** The Soils test reads the Rowan County Soil Survey tables (crop yields,
  lawn ratings) and the texture triangle. Picture-ID questions (tracks, skulls, pelts, trees, fish) are practice with the
  specimens; the cards carry the ID facts each profile states in words.
- **CEI and the Appendix have no Learning Objectives sheet.** Their (a) sections list each article or section with its cards.
  The 2026 CEI test was on a different theme (Non-Point Source Pollution); the 2027 deck uses the 2027 packet only.
- **Test wording check.** 16 cards share a 7-word run with a 2026 test because the test reused the manual's own definition.
  Each of those cards' saved source quote contains the shared words, so the wording comes from the manual, not the test.
  Three card fronts that read like test questions were reworded (vernal pools, latent heat of fusion, half of the world's
  oxygen).

| Section | "no card" lines in (a) | "no card" lines in (b) |
|---|---|---|
| Stage 1 — Forestry | 1 | 0 |
| Stage 2 — Soils/Land Use | 2 | 5 |
| Stage 3 — Aquatic Ecology | 2 | 6 |
| Stage 4 — Wildlife (manual + 2025 Wild Notebook) | 1 | 3 |
| Stage 4 — Wildlife · ID (30 standard + 5 featured species profiles) | 0 | 4 |
| Stage 5 — Current Environmental Issues 2027 | 0 | 17 |
| Stage 0 — General concepts (MS Appendix) | 6 | 0 |

---

## Stage 1 — Forestry


Cards: Terms 346 · Facts 468 · ID 165 (979). Checker: `checked 979 cards, 0 problems`.
Fronts below are quoted exactly as they appear in `forestry.json`. The deck is shown as [T] Terms, [F] Facts, [ID].

#### (a) Learning Objectives, line by line (`text/ms_forestry_objectives.txt`)

##### Intro paragraphs (p.i)
- "Forestry is the second largest industry in North Carolina." → [F] What rank is forestry among North Carolina's industries? (src Forestry Objectives p.1; the manual itself does not say this)
- "...trees, which are second only to grass as the most common and widely distributed plants on earth." → [F] Trees are second only to what as the most common and widely distributed plants on earth? (manual p.3)
- The rest of the intro (ecosystem management, ecological services) → covered under the KC1 lines below.

##### Key Concept 1: Forests and Society
- "Understand the beneficial roles of forests." → see the next four lines.
- "Know the historical roles and importance of forests." → [F] What did trees provide Native Americans and early settlers? · For what four reasons did Native Americans and settlers use fire in the forest? · Who were the first people from outside North America to use the North American forest? · Who were possibly the first Europeans to see North America's untouched forests, and when? · What four naval stores did ships need? · For how many years were naval stores one of North Carolina's most valuable products? · Where and when was the first sawmill in the United States thought to be? · In what year did U.S. lumber production reach its peak? · Where did forestry as a discipline in the United States begin? · Who was hired to manage the forest on the Biltmore Estate? · What was the first American school of forestry, and when did it open? · Who was the first chief of the Forest Service? · What did the Weeks Law (1911) provide? … What did the National Forest Management Act (1976) require? (all 9 laws) · What is the U.S. Forest Service's double mandate? · [T] Naval stores · Tar · Pitch · Turpentine · Rosin · Dendrology · Forest stewardship · Ecosystem management
- "Know the importance of trees in urban areas and aspects of urban forestry." → [F] About how much cooler does a tree's shade make temperatures? · Up to how much of the sun's radiation can a tree with leaves block? · If trees were planted around every U.S. house, how much could homeowners save on heating and cooling? · How much can a belt of trees 98 feet wide and 49 feet tall reduce highway noise? · What can be diverted from streets and parking lots into greenbelt storage zones? · What do trees block in cities, from surfaces like concrete and glass? · What do trees do to property values? · [T] Greenbelt
- "Know the economic value of forests and the many products they provide." → [F] How many acres of forested land are in North Carolina? · In 2018, how much did forestry contribute to North Carolina's economy? · What percent of North Carolina's forest land is privately owned? · What is the greatest economic contribution of forests? · Worldwide, what is more than half (55%) of the timber cut each year used for? · Approximately what fraction of the timber cut is in the form of saw logs? · What fraction of the timber harvested is used as pulpwood? · Through chemistry, what products are made from wood? · What are the three main sources of today's paper fiber? · What valuable medicinal plant found in the mountains has a large export market? · [T] Saw log (saw timber) · Pulpwood · Pulp · Lumber · Plywood · Timber · [ID] Sassafras · parts valued in some areas · Sweet gum · product purchased in some areas
- "Explain the various ecological benefits of trees." → [F] What do the leaves and branches of trees do to falling rain? · What does baseflow do for streams? · How much soil erosion happens on forested land each year? · How much longer can forests slow snow melt than open areas? · What happens to an area's climate when a large forest is cleared? · When is the carbon stored in wood released as carbon dioxide? · Forests provide habitat for more wildlife species than what? · Which fish need forest shade because they cannot tolerate warm water? · What is North Carolina's number one water pollutant by volume? · How far can a row of trees 20 feet high reduce wind speed? · What provides the base of the food chain in streams? · [T] Baseflow · Duff · Porous soil · Detritus · Windbreak · Photosynthesis

##### Key Concept 2: Forest Ecology
- "Understand the structure, processes, reproduction, life cycle, identification, and pests and diseases of trees." → see the next five lines.
- "Know the parts of a tree and their functions." → [F] What are the three major parts of all trees? · What are the four primary functions of roots? · What is the major purpose of the trunk? · Which layer forms a tree's new annual rings each year? · [T] Bark · Outer bark · Inner bark (phloem) · Cambium · Sapwood (xylem) · Heartwood · Rays (medullary or pith rays) · Pith · Crown · Root hairs · Rootlets · Mesophyll · Stomata · Guard cells · Waxy cuticle · Vascular bundles · Respiration · Transpiration
- "Describe the life cycle of a tree." → [F] What are the stages in a tree's life cycle, in order? · What does a seedling compete with other plants for? · [T] Seedling · Sapling · Mature tree · Snags
- "Explain the reproduction of the two main types of trees." → [T] Gymnosperms · Angiosperms · Pollination · Fertilization · Zygote · Dioecious · Complete flowers · Pistil · Stamen · Anther · Sprouts · Suckers · Suckering · [F] Where does a conifer produce its male and female cones? · How many ovules develop on each female cone scale? · What do male cones produce? · What are the five ways seeds travel? · About how long does it take a pine to go from pollen to a fully developed seed?
- "Know how to identify trees, and be able to identify the trees listed for student identification." → [F] What is most helpful in identifying pines? · In what three patterns may leaves be arranged? · By what four features can deciduous trees be identified? · [ID] all 165 cards (98 of them from the tree tables on pp.70-73, via `text/ms_forestry_tables_transcribed.txt`)
- "Know the common pests and diseases and the steps foresters and landowners can take to control them." → KC3 "Threats to Forests" cards: [F] What are the most destructive of all forest insects? · What is the best way to prevent Ips beetle attacks? · What is the preferred control method for the turpentine beetle? · What is one of the most important ways to limit spongy moth damage? · How can red heart infestation be prevented? · Which trees with galls should be removed as soon as possible? · [T] Integrated pest management (IPM) and its five control methods
- "Understand the concept and processes of forest ecology." → see the next six lines.
- "Know that forests are ecosystems, and be able to identify the components of the ecosystem." → [T] Ecology · Forest ecology · Ecosystem · Biotic factors · Abiotic factors · Micro-ecosystems · [F] What three roles can organisms in the forest ecosystem have? · Name three examples of a simple ecosystem. · Name three examples of micro-ecosystems in a forest.
- "Describe the niches of organisms, the biotic factors within the forest ecosystem, and be able to give examples." → [T] Producers · Consumers · Herbivores · Carnivores · Decomposers · Symbiosis · Parasitism · Mutualism · Commensalism · Resource partitioning · Tolerance (in silviculture) · Hard mast · [F] What are the three types of symbiosis? · Mistletoe living on trees is an example of what relationship? · Lichens are a mutualistic relationship between which two organisms? · What kind of relationship do trees and mycorrhizae have? · Which tree is the manual's example of trees that release chemicals into the soil to keep other trees from growing too close? · Which woodpecker lives in mature longleaf pine forests with trees infected by red heart disease?
- "Identify the abiotic factors in the forest ecosystem and know their importance." → [F] What are the abiotic factors of the forest ecosystem? · Which abiotic factor is the most limiting on tree growth? · What three things about light affect photosynthesis? · How can acid rain harm forest trees? · What happens if tree roots are covered by water for a long time? · [T] Photoperiod · Acid precipitation · Limiting factors
- "Explain the processes of photosynthesis and nutrient cycling." → [T] Photosynthesis · Chloroplasts · Decomposers · [F] What gas is a by-product of photosynthesis? · In which layer of the leaf does most photosynthesis occur? · During the day, what gas enters the stomata for photosynthesis? · What six nutrients are commonly recognized as very important for life? · Where are nutrients stored in a tree until needed? · Besides carbon, what other essential nutrients are stored in trees? (The manual sends the full cycles to the MS Appendix, General Concepts station — not carded here.)
- "Know the importance of forest soils." → [T] Topsoil · Litter · Soil texture · Limiting layer · [F] Why are most forests today on relatively poor soils? · Which tree is the manual's example of a species that can fix nitrogen, adding it to the soil? · Why do sandy soils drain faster than clay soils? · What do mycorrhizae fungi in the soil convert to a usable form?
- "Know the importance of stream side buffers and why they are so important to water quality and to wildlife." → [T] Streamside management zone (SMZ) · Buffer strip · [F] Which wildlife-friendly harvest step is required by law? · What is key to reducing the ecological effect of clear-cutting? · Which fish need forest shade because they cannot tolerate warm water? · Why are hemlocks ecologically important along mountain streams?
- "Understand the developmental stages, structuring, and types of forests." → see the next four lines.
- "Recognize the specific developmental stages of a forest." → [F] What are the six developmental stages of an even-aged stand, in order? · At what developmental stage does a tree start to use more oxygen than it produces? · [T] Seedling stage · Sapling stage · Pole stage · Young timber stage · Mature timber stage · Over mature timber stage · Even-aged stand · Uneven-aged stand
- "Know crown classifications." → [T] Dominant (crown class) · Co-dominant (crown class) · Intermediate (crown class) · Overtopped (crown class) · Suppressed (tree) · Isolated (crown class) · Emergent tree · [F] What four factors are important in a tree's crown position?
- "Describe vertical stratification, and know its importance to wildlife." → [T] Vertical stratification · Forest floor · Understory · Leaf canopy (crown cover) · [F] Why is vertical stratification important to wildlife? · What are the three layers of the forest, from lowest to highest? · Which animals live on or in the ground or soil layer? · What is one important role of the understory?
- "Describe the two main forest types and their importance as ecosystems." → [F] What are the two main groups of forests? · What percent of North Carolina's forests are coniferous (softwood)? · What percent of North Carolina's forests are hardwood? · Which state has more species of deciduous (hardwood) trees than any other? · Which conifers are deciduous? · [T] Conifers · Evergreen · Deciduous trees · Mixed forest · Old growth forests
- "Understand forest development, stages, and succession." → see the next four lines.
- "Describe the kinds or stages of forests." → [F] What age range is a young forest (young forests and openings)? · What age range is a middle-aged forest? · What is the mature forest characterized by? · How long may mature forests remain?
- "Explain succession, or biotic change, and its various stages, the characteristics and organisms common to each stage." → [T] Succession · Early successional · Hard snags · Soft snags · Cavity trees (den trees) · [F] What can cause a young forest to form? · Why are young forests excellent places for birds to raise their broods? · What is an important component of a mature forest for wildlife? · Which North Carolina animal favors cavity trees for its seasonal dens?
- "Describe edges and know their importance." → [T] Edge effect · Ecotone · [F] What kind of habitat do piedmont stream forests provide, serving as cafeterias and highways for wildlife? · Why make the boundaries of a timber harvest an irregular shape?
- "Know the different types of forest ecosystems found in North Carolina and be able to explain how they differ." → [F] What are the common trees of mountain cove forests? · Above what elevation do spruce fir forests exist in North Carolina? · Which two trees make up most of the spruce fir forest? · Piedmont stream forests are home to about how many of NC's 200 endangered, threatened, or special concern species? · Where do bottomland hardwood forests grow? · What is the dominant tree of the Sandhills longleaf pine forest? · What is a major factor in where each type of forest occurs? · Which pines dominate the forests of southeastern North Carolina? · [T] Fire dependent ecosystem · Boreal forest (in North Carolina) · Cypress knees · Bottomlands

##### Key Concept 3: Conservation and Management of Forests
- "Understand silviculture practices." → see the next three lines.
- "Define silviculture and know silviculture practices." → [T] Silviculture · Improvement cut · Liberation cutting · Thinning · [F] What is the first step in silviculture? · What may be considered in a forest management plan? · What three treatments are used for clearing the forest floor? · What are the five silviculture practices that improve the genetics of a forest?
- "Know tree harvesting and regeneration methods." → [F] What are the five regeneration methods? · What is the least expensive method for harvesting trees? · What two ways can a clear-cut area be reforested? · What are the two methods of reforestation? · How many large trees per acre do foresters leave in seed tree cutting? · [T] Clear-cutting · Strip cutting · Whole tree harvesting · Selective cutting · Shelterwood cutting · Seed tree cutting · High grading (creaming) · Group selection · Single-tree selection · Reforestation · Even-aged management · Uneven-aged management
- "Describe forest management for various purposes, such as wildlife, and know forestry best management practices." → [F] What is the recommended first step for managing forest land? · What four steps should a landowner take to manage for a timber harvest? · How often should prescribed burns be done in stands suited for fire management? · What three major factors influence wildfires? · How wide should firebreaks be? · [T] Corridor · Best management practices (BMPs) · Water turnouts · Culvert · Broad-based drainage dips · Rolling dips · Water bars · Ladder fuels · Surface fire · Ground fire · Crown fire · Backfire · Pruning · Fuel reduction burning · Firebreaks

##### Key Concept 4 (objectives sheet prints "Forest Tree Measurement and Identification")
- "Know basic forest measurements and how to use instruments to get those measurements." → [T] Chain · Pacing · Diameter at breast height (DBH) · Diameter tape (d-tape) · Biltmore stick · Board foot · Cord of wood · Abney level · Clinometer · Increment borer · Wedge prism · Basal area · Cruising (timber cruise) · [F] How many chains equal one mile? · How long is a log in forestry? · At what distance does the Biltmore stick give accurate readings? · How do you find tree height in feet from a Biltmore stick log count? · What is the most common basal area factor (BAF) size for a prism? · Counting 5 trees with a BAF 10 prism gives what basal area per acre? · What is the most accurate way to determine tree age? · If rings are counted at DBH, how many years are added? (Actually using the instruments is a skill — practice, not cards.)
- "Know what site index means and know how to read a site index graph." → [T] Site index · [F] At what tree age is site index set in the eastern United States? · At what tree age is site index measured in the western United States? · What does a site index of 70 mean? (Reading a graph: no card — chart-reading skill, practice not cards.)
- "Display knowledge of the natural history of species in the designated set of tree species to know." → [ID] the non-"seed plant group" cards (e.g. Longleaf pine · why less susceptible to being blown down than most southern pines, Longleaf pine · yearly growth in the pole stage, Elm · fungal disease that kills it, Ash · insect that kills it, Persimmon · flowers). The tree tables add height/diameter and uses for the 14 tabled trees (e.g. Loblolly pine · growth rate, Red maple · main food for gray squirrels, Northern red oak · importance). The 10 trees not in the tables stay thin: see notes.
- "Display knowledge of the identifying features of species in the designated set of tree species to know." → [ID] the 24 "· seed plant group" cards · Eastern white pine · needles per bundle · Eastern white pine · needle length · and from the tables, for the 14 tabled trees: "· needles per bundle", "· needle length", "· cones", "· leaves", "· bark", "· fruit" / "· acorns" (e.g. Loblolly pine · needles per bundle, Longleaf pine · needle length, Sweetgum · leaves, Sweetgum · fruit, American sycamore · bark, White oak · acorns).

#### (b) Test check — 2026 Area 8 MS Forestry test

1. Photosynthesis inputs → [T] Photosynthesis (manual p.11 names carbon dioxide, water, sunlight); [F] What gas is a by-product of photosynthesis?
2. Mycorrhizae relationship type → [F] What kind of relationship do trees and mycorrhizae have?
3. Insect with D-shaped holes → [F] What shape is the hole an adult emerald ash borer makes leaving the bark? · How do emerald ash borer larvae kill the ash tree?
4. 1933 conservation program name → [F] What was the Emergency Conservation Work Program (1933) later known as?
5. Even-aged management practices → [F] In even-aged management, how many tree species are grown in most cases? · What successional stage does even-aged forest farming keep the stand in? · [T] Even-aged management
6. Benefit of clear-cutting → [F] Which animals does clear-cutting help?
7. Wildfire behavior factors → [F] What three major factors influence wildfires?
8. Sapwood vs heartwood → [T] Sapwood (xylem) · Heartwood
9. Broad-leaf hardwoods losing leaves → [T] Deciduous trees
10. Forest stage 0-10 years → [F] What age range is a young forest (young forests and openings)? · What can cause a young forest to form?
11. Mature-forest feature for wildlife → [F] What is an important component of a mature forest for wildlife? · [T] Snags
12. How trees reduce erosion → [F] What do the leaves and branches of trees do to falling rain? · What slows water running off the forest floor so it soaks in? · What on the forest floor acts like a sponge to reduce stormwater runoff?
13. Greenbelt benefits → [T] Greenbelt · [F] What can be diverted from streets and parking lots into greenbelt storage zones?
14. Cone trees vs flowering trees → [T] Gymnosperms · Angiosperms
15. Spruce-fir forest threats → [F] What is slowly destroying the spruce fir forest? · Which insect is killing the fir trees weakened by air pollution?
16. Tree ID (picture) → [ID] Eastern white pine · needles per bundle · Eastern white pine · needle length · Eastern white pine · needle color and feel · Eastern white pine · cones · Eastern white pine · bark (the picture ID itself is a practice skill)
17. Tree ID (picture) → [ID] American Beech · seed plant group · Beech nuts · hard or soft mast · Beech · wet soil (beech is not in the tree tables, so no leaf or bark description exists in the sources)
18. Tree ID (picture) → [ID] American sycamore · leaves · American sycamore · bark · American sycamore · fruit · Sycamore · spongy moth
19. Instrument ID (picture) → [T] Increment borer
20. Instrument ID (picture) → [T] Diameter tape (d-tape)

Every tested fact that the MS text sources state has a card. Picture ID (16-20) is a recognition skill: practice, not cards.


---

## Stage 2 — Soils/Land Use


Decks: `Soils and Land Use · Terms` (T), `Soils and Land Use · Facts` (F), `Soils and Land Use · ID` (ID).
Card fronts are quoted exactly. "…" after a front means "and the related cards listed beside it".

#### (a) Learning Objectives (`text/ms_soils_objectives.txt`), line by line

**p.1**

1. "Know the definition of soil and the composition of average soil."
   - T: Soil · Coarse fraction (coarse fragments) · Fine fraction · Organic matter (soil) · Inorganic
   - F: About how much of an average soil sample is inorganic material? · What inorganic materials make up an average soil? · About how much of an average soil sample is pore space? · How much of an average soil sample is organic matter? · The solid, inorganic portion of soil is composed primarily of what? · Into what three particle size fractions is the fine fraction broken down?
2. "- Understand the importance of pore space."
   - T: Pores · Macropores · Micropores
   - F: What two things fill the pore spaces in soil? · Pore spaces are important to the life of which two groups? · In which soils can air and water move rapidly? · How fast do air and water move through fine textured soils with lots of clay?
3. "- Know what comprises the organic matter of soil."
   - T: Organic matter (soil) · Humus · Biomass
   - F: What are the five reasons organic matter is important in soil? · What controls the amount of soil organic matter?
4. "☺Know the importance of soils and be able to give examples."
   - F: Soils are the medium that physically supports what? · Besides supporting plants, what do soils store and exchange for plant growth? · Soils are recycling factories of what? · What two things do soils provide wildlife?
5. "- Know soil's role in:"  — heading line; covered by lines 6–10.
6. "Nutrient cycles"
   - T: Macronutrients · Micronutrients · Nitrogen cycle · Nitrogen fixation · Nitrified · Carbon cycle
   - F: What three roles do soils play for plant nutrients? · What is the major source of nitrogen input to soils? · Which three greenhouse gases are soils linked to in biogeochemical cycles?
7. "The water cycle and purification and storage of water"
   - T: Hydrological cycle · Infiltration · Gravitational water · Capillary water · Available water capacity (AWC)
   - F: Soils are a key link and buffer system in which world cycle? · Besides filtering pollutants, what do soils do with water and waste? · What does soil determine about precipitation? · When rain strikes the soil surface, what three things can happen to it?
8. "Plant growth"
   - F: Soils are the medium that physically supports what? · For agriculture, how deep must the rooting zone be? · What pH do most agricultural and ornamental plants prefer?
   - T: Root restrictive layers · Field capacity · Wilting point
9. "Habitat for soil dwelling organisms"
   - F: How many organisms can one teaspoon of soil contain? · What six organisms are named as soil flora and fauna? · What are the five reasons organic matter is important in soil?
10. "Construction decisions"
    - F: Soil serves as the foundation material for construction projects and what other material? · Before any building is built, why is the soil examined? · On what soils should houses with basements or septic systems be built? · What can shrinking and swelling damage?
11. "- Know how we use soils"
    - F: What six kinds of projects do soil scientists evaluate sites for? · Soil serves as the foundation material for construction projects and what other material? · Soils are the medium that physically supports what?
12. "☺ Understand the soil ecosystem."
    - T: Soil ecosystem · Biotic · Abiotic · Ecosystem · Community · Food chain · Food web
13. "- Recognize types of organisms that dwell in the soil."
    - F: What six organisms are named as soil flora and fauna? · Which two small soil organisms does the Soils Manual name as examples that enrich soil by breaking down organic matter? · What do parasitic nematodes feed on?
    - T: Bacteria · Fungi · Flora · Fauna · Microorganism
14. "- Know some services provided by soil organisms."
    - F: When microorganisms decompose litter, which four nutrients do they make available? · What do microorganisms change fresh organic matter into? · What do animals do to the soil as they dig?
    - T: Decomposers · Transformers
15. "- Understand the roles of various soil organisms."
    - F: In an ecosystem, what roles do plants, animals, and microbes play? · What are the two main kinds of decomposers? · What pattern do food chains generally follow?
    - T: Producers · Consumers · Decomposers · Transformers · Autotrophs · Heterotrophs · Herbivore · Carnivore
16. "☺ Understand the soil's role in the cycling of essential nutrients and water."
    - T: Nitrogen cycle · Nitrogen fixation · Leaching · Permeability · Infiltration rate
    - F: How do ecosystems maintain themselves? · Microbial decomposition releases nitrogen from organic compounds in what form? · How can nitrate be lost from the soil system? · What cycling counters nutrient loss from leaching? · Water that keeps moving downward through the soil eventually recharges what?
17. "☺ Recognize basic soil forming factors and the role of each."
    - F: What are the five soil forming factors (ClORPT)? · The soil forming factors are often abbreviated as what? · Do the soil forming factors act independently?
    - T: Soil genesis
18. "- Know the origin of parent material."
    - T: Parent materials · Residual soils · Residuum
    - F: From what was most of the mineral matter in soil ultimately derived? · By what four agents can parent material be transported and deposited? · What makes minerals and rocks important to soil? · What are the six mineral groups of prime importance in soil development? · Into what three groups are rocks classified? (+ igneous/sedimentary/metamorphic cards)
19. "- Recognize the processes that act on parent material."
    - F: What are the four major processes that change parent material into soil?
    - T: Additions (soil forming process) · Losses (soil forming process) · Translocations · Transformations (soil forming process) · Eluviation · Illuviation · Leaching
20. "- Recognize the general categories of parent material."
    - F: What are the six general categories of parent material?
    - T: Residual soils · Peat · Muck · Alluvium · Marine deposits · Colluvium · Eolian deposits · Glacial drift · Glacial outwash · Glacial till · Lacustrine deposits · Delta · Alluvial fans · Loess · Volcanic ash
21. "- Define weathering."
    - T: Weathering · Physical (mechanical) weathering · Chemical and biological weathering
    - F: What five natural forces cause physical weathering? · What three things influence the rate of chemical weathering? · Why do North Carolina soils have a high amount of chemical weathering?
22. "- Know the definition of topography, and know what topography influences."
    - T: Topography (relief)
    - F: What three soil features does topography influence? · What are the five landscape positions on a slope? · Why do soils on steep slopes tend to be drier? · Why may the topsoil layer be thin on steep slopes? · Which steep slopes are cooler, moister, and higher in organic matter?
23. "- Recognize the importance of the biota."
    - F: What are the two important categories of vegetation in soil formation? · What kind of O horizon do areas long in forest often have? · Why do grasslands usually lack an O horizon? · What do animals do to the soil as they dig? · Which two small soil organisms does the Soils Manual name as examples that enrich soil by breaking down organic matter?

**p.2**

24. "- Know why organic matter is important to soil."
    - F: What are the five reasons organic matter is important in soil? · Which nutrient especially does organic matter provide for soil organisms?
    - T: Tilth · Surface crusting
25. "- Define humus, and know its importance."
    - T: Humus · Raw humus
    - F: What gives most topsoil a darker color than the subsoil? · What do microorganisms change fresh organic matter into?
26. "☺ Identify parts of a soil profile."
    - T: Soil profile · Soil horizons · Horizon suffix (subordinate designation)
    - ID: O horizon · … A horizon · … E horizon · … B horizon · … C horizon · … R horizon · … Horizon suffix t/w/g/r · … Bt horizon · in NC · Btg horizon · meaning (31 ID cards)
    - F: What are the six master horizons that may be found in soils? · How many master horizons may older, well-developed soils have? · How many master horizons may younger, less developed soils have?
27. "☺Recognize basic soil properties."
    - F: What are the ten important physical properties of soil? · What is one important chemical property of soil?
    - T: Munsell Soil Color Chart · Hue · Value (soil color) · Chroma · Redoximorphic features · Soil consistence · Shrink-swell potential · Soil compaction · Bulk density · the seven drainage-class terms · the depth-class terms
28. "- Know the soil particles and relative sizes."
    - T: Sand · Silt · Clay · Coarse fraction (coarse fragments) · Fine fraction
    - F: Who classifies soil particles into categories by the size of their diameter? · Which soil particle gives a soil its plasticity?
29. "- Know how to use a textural triangle and how to texture soils."
    - T: Texture triangle · Soil texture
    - F: How do field soil scientists frequently estimate soil texture? · How many texture classes are named on the soil texture triangle? · In order of increasing fine particles, which basic textural class comes first? / … comes last?
    - ID: Sand texture class · makeup · Silt texture class · makeup · Sand, loamy sand, sandy loam · may be further divided by
    - Texturing by feel (manual p.31 flowchart, added by the lead 2026-10-27): F: Texture by feel: approximately how much soil do you place in your palm to start? · … when is the moistened soil at the proper consistency? · … weak / medium / strong ribbon length · … the nine ribbon + gritty/smooth/neither outcomes · … ball but no ribbon (loamy sand) · … no ball (sand).
    - Reading the triangle itself from percentages: no card — skill (practice with the triangle, not cards).
30. "- Recognize the importance of and factors affecting soil structure."
    - T: Soil structure · Aggregates (soil) · the seven structure-type terms · Grade (soil structure) · Strong structure · Moderate structure · Weak structure · Structureless
    - F: Which four soil qualities are, to some degree, dependent on structure? · What two practices often improve soil productivity by stabilizing structure? · What two things can degrade soil structure? · How can soil structure be improved? · What greatly influences soil erodibility?
31. "- Recognize the role impact of soil pH."
    - T: Reaction class · pH · Acid · Alkaline · Acid rain (acid deposition)
    - F: What pH is neutral? · What is the natural soil pH range in North Carolina? · What pH do most agricultural and ornamental plants prefer? · Above what pH is soil too alkaline for most plants? · Below what pH is soil too acid for most plants? · What soil amendment is used most often to raise soil pH? · How does applying lime help increase organic matter content?
32. "☺Know how to use written soil survey report data and maps to locate specified information, including soil characteristics, drainage and potential use of the soil."
    - T: Soil survey · Web Soil Survey (WSS) · SSURGO · Annual Soils Refresh · Area of Interest (AOI) · Map unit · Map unit symbol · Soil Data Explorer · the four map-unit-type terms · Hydrologic soil group · Land capability classes · Capability subclass · Prime farmland
    - F: Which soil survey table gives bedrock depth, water tables, and flooding? · Which soil survey table gives shrink-swell, available water capacity, permeability, and soil reaction? · Where in a soil survey is a soil's drainage class found? · Where in a soil survey can you see which horizons are typically found in a soil? · Where are a survey area's prime farmland soils listed? · the Web Soil Survey Guide facts (sub-tabs, AOI, ratings)
    - ID: the 37 land capability class / subclass cards
    - Actually reading tables and maps for a given soil: no card — map/table-reading skill (practice, not cards).
33. "☺ Identify various types of erosion, factors affecting the rate of erosion, and the problems of sedimentation."
    - T: Erosion · Sheet erosion · Rill erosion · Gully erosion · Rill · Gully · Land slippage (mass movement) · Streambank erosion · Sedimentation · Sediment
    - F: What are the three types of erosion by moving water? · Of sheet, rill, and gully erosion, which is least visible? · Name the four things that control how fast soil erodes. · Which soil structures give a rapid rate of water infiltration? (+ moderate/poor) · What does a ten percent slope mean? · By volume, what is the top pollutant of our waterways? · What costly problems does sedimentation cause? · What four things decide the impact of deposited sediment?
34. "☺Identify Best Management Practices (conservation practices) for the control of erosion."
    - T: Best Management Practices (BMPs) · Animal waste management · Conservation tillage · Contour farming · Cover crops · Crop residue management · Crop rotation · Diversion · Field border · Filter strips (buffer strips) · Grass waterway · Integrated pest management (IPM) · Riparian buffer · Sod-based rotation · Soil testing · Strip-cropping · Terrace · Water control structure · Windbreaks
    - F: the BMP facts on pp.59–67 (e.g. Under conservation tillage, at least how much of the surface should stay covered? · How much can strip-cropping reduce erosion on three to eight percent slopes?)
35. "☺Recognize the impact of human actions on soil."
    - T: Urbanization · Salinization · Soil health · Impervious surfaces
    - F: Why does soil degradation usually occur? · How much can construction sites erode per acre per year? · How much does agricultural land erode per acre per year? · What do intensive farms without proper conservation practices tend to do to soil quality? · What made the Great Plains vulnerable to wind erosion during the Dust Bowl? · What are the three basic principles for building soil health? · Is the amount of US prime farmland increasing or declining?

#### (b) Test check — 2026 Southern Piedmont (Area 8) MS Soils test

| Q | topic | card(s) |
|---|---|---|
| 1 | definition of erosion | T: Erosion |
| 2 | five soil forming factors | F: What are the five soil forming factors (ClORPT)? |
| 3 | movement of air and water | T: Permeability |
| 4 | top pollutant of NC waterways | F: By volume, what is the top pollutant of our waterways? |
| 5 | factors in erosion rate | F: Name the four things that control how fast soil erodes. |
| 6 | wind erosion / Dust Bowl | F: Where does most wind erosion occur? · What was the most famous case of wind erosion in the United States? |
| 7 | wheat yield, Rowan table | no card — map/table-reading skill (practice, not cards) |
| 8 | lawn rating, Rowan table | no card — map/table-reading skill (practice, not cards) |
| 9 | acreage of a map unit, Rowan table | no card — map/table-reading skill (practice, not cards) |
| 10 | texture from triangle percentages | no card — map/table-reading skill (practice, not cards): reading the texture triangle |
| 11 | natural layers of soil | T: Soil horizons |
| 12 | water entry rate at surface | T: Infiltration rate |
| 13 | ingredient that raises pH | F: What soil amendment is used most often to raise soil pH? |
| 14 | mapping soils of an area | T: Soil survey |
| 15 | most fertile layer, topsoil | ID: A horizon · common name · A horizon · fertility |
| 16 | vegetation next to streams | T: Riparian buffer |
| 17 | vegetated channel off a field | T: Grass waterway |
| 18 | least visible erosion type | F: Of sheet, rill, and gully erosion, which is least visible? |
| 19 | particles grouped into aggregates | T: Soil structure |
| 20 | organic share of average soil | F: How much of an average soil sample is organic matter? |

Every tested fact that is in the MS sources already had a card; no card was added because of the test.
Fronts that read close to a test question (Q4, Q5, Q13, Q18, Q20) were reworded so that no test wording is copied.


---

## Stage 3 — Aquatic Ecology


Card counts: Terms 364, Facts 487, ID 321 (1,172 cards). Fronts named below are exact card fronts. "T:" means the Terms deck, "F:" the Facts deck, "ID:" the ID deck.

#### (a) Learning Objectives, line by line (`text/ms_aquatics_objectives.txt`)

**"☺ Know the importance and availability of water."**
- T: Hydrosphere; Potable. F: What percent of Earth's surface is covered by water?; What percent of the human body is water by volume?; What world population do Earth's water resources need to support by 2050 (2017 UN report)?; Where were the earliest known permanent settlements located?

**"- Know the distribution of water, how much is available for use, and where it is located."**
- F: What share of Earth's water by volume is in the oceans, seas, salt lakes, and salty groundwater?; What percent of Earth's total water is freshwater?; Where is nearly all of Earth's freshwater locked up?; In eastern NC, wetlands provide food and cover for which large animal population?

**"- Understand how nature cycles water to continually provide a supply of freshwater."**
- T: Hydrologic (hydrological) cycle; Evaporation; Precipitation; Infiltration; Runoff. F: Under normal conditions, what provides most of the flow in a stream?; After heavy rainfall, where may most of a stream's flowing water come from?; What is groundwater recharged from?
- The manual sends the water-cycle detail to the MS Appendix (General Concepts station). That part is not covered here.

**"- Define surface water and groundwater, and know the terminology associated with each."**
- T: Runoff; Shallow groundwater; Watershed; River basin; Topography; Groundwater; Aquifer; Permeable; Impermeable; Pores (in an aquifer); Fractures (in an aquifer); Zone of saturation; Water table; Recharge area. F: What is another name for watersheds?; How many major river basins does North Carolina have?; Which five NC river basins flow westward into the Ohio and Tennessee Rivers?; What can a groundwater discharge area be?; Which two materials usually restrict the flow of ground water?; Which three conditions result in less infiltration and more surface runoff?

**"- Know the structure of water and the unique properties that make it important to life."**
- T: Polar molecule; Hydrogen bond; Surface tension; Capillary action; Specific heat capacity; Latent heat capacity; Density; Viscosity; Universal solvent. F: What atoms make up a water molecule?; Which common liquid has the highest surface tension?; Latent heat of fusion is the heat for which change of phase?; At what temperature is water most dense?; Why does ice float?; How many times denser than air is liquid water?; At what temperature does water boil?; Under normal conditions, how much less oxygen does water hold than the same volume of air?

**"☺ Be able to identify various components of aquatic ecosystems."**
- T: Ecosystem; Aquatic habitat; Biotic; Abiotic. F: What is the base of the aquatic food chain?

**"- Know what an ecosystem, community, and habitats are."**
- T: Ecosystem; Community; Habitat; Aquatic habitat; Arrangement (habitat); Edge habitat. F: Why do freshwater ecosystems suit so many types of animals and plants?

**"- Describe the various niches of organisms."**
- T: Niche; Producers; Consumers; Decomposers; Detritus. F: What three roles can an organism's niche be?; What are the producers in aquatic environments?; Why is detritus an important food source in aquatic environments?

**"- Define food chain and food web and understand the difference between the two terms."**
- T: Food chain; Food web; Energy flow. F: What powers aquatic food chains, food webs, and energy pyramids?

**"- Know how energy flows through an aquatic ecosystem and explain a pyramid of numbers."**
- T: Energy flow; Food chain. F: What powers aquatic food chains, food webs, and energy pyramids?
- No card for the pyramid of numbers. The manual says only "explained in detail in the Appendix" (p.13), and the pyramid itself is an image on p.14 with no text.

**"- Explain the biotic interactions, or relationships, that can occur between aquatic organisms."**
- T: Competition; Symbiosis; Mutualism; Commensalism; Parasitism; Parasite; Predator; Prey; Keystone species; Gator holes; Exotic species. F: What are the three kinds of biotic relationships in an ecosystem?; What are the three types of symbiosis?; What is the manual's example of commensalism?; What is the manual's example of parasitism?; Name one example of mutualism from the manual.; What three examples of exotic species does the manual give?; Which two keystone species does the Aquatics Manual name: one that creates ponds and one that digs out depressions?

**"- Understand how organisms, in aquatic ecosystems, are affected by abiotic factors."**
- F: Which four environmental factors determine the organisms present in an aquatic depth layer?; What special structures help aquatic organisms get dissolved oxygen?; Is the need for oxygen a bigger challenge for aquatic life or for life on land?; Do fast flowing mountain streams generally contain more or less dissolved oxygen?; What pH do freshwater bodies usually have?

**"- Know how oxygen and mineral nutrients are recycled in aquatic ecosystems."**
- T: Decomposers; Dissolved oxygen (DO); Respiration; Photosynthesis. F: Where does oxygen enter aquatic ecosystems from?; Dissolved oxygen in water varies due to which four factors?; Where does carbon dioxide enter aquatic ecosystems from?; In what form is some dissolved CO2 stored in sediments, minerals, skeletons and shells?; Which nutrient is generally most limiting in freshwater ecosystems?; Which nutrient is generally most limiting in saltwater ecosystems?

**"- Understand the range of tolerance of aquatic species, and know some conditions that impact aquatic life."**
- T: Range of tolerance; Thermal shock; Thermal pollution. F: Which fish can live with lower levels of oxygen better than trout?; What happens to the oxygen level when warm water from a power plant enters a water body?; What can change the pH level of water?; Below what pH do trout and aquatic insects begin dying in streams?

**"- Identify the factors that determine the carrying capacity of aquatic ecosystems and how each limits aquatic productivity and life."**
- T: Carrying capacity; Limiting factors. F: Carrying capacity in aquatic ecosystems usually varies by what two closely related things?; Why does winter have the most limitations on carrying capacity?; Dissolved oxygen available to animal life decreases with what?
- The manual's five-bullet list of limiting factors (p.16) is too long for one card. Its oxygen bullet is carded, and its sunlight, nutrient and temperature bullets are carded through the p.18–21 facts.

**"- Explain eutrophication and man's impact on this process."**
- T: Eutrophication; Cultural eutrophication; Algal bloom; Eutrophic lake; Eutrophic (mature) pond. F: When algae from a bloom die, what uses up most of the oxygen in the water?; Which human wastes can wash into surface waters and accelerate eutrophication?; Which two things add high levels of nutrients to rivers and streams?

**"- Identify North Carolina species endangered or threatened and practices, which contribute to their being at risk."**
- T: Endangered; Threatened; North Carolina Special Concern Species; Indicator species. F: How many fish species are listed in NC (2017 Protected Wildlife Species plan)?; What is the one listed aquatic mammal in NC?; Which two extremely rare species live in NC's mountain bogs?; Which salamander of vernal pools is one of our rarest?; Which federally threatened animal lives in the Watauga basin's mountain bogs?; Which endangered mussel lives in smaller, slow-flowing streams of the Watauga basin?; What is the number one water pollutant in North Carolina?. ID: Brook trout · range decline since 1900; Brook trout · primary cause of population demise; American shad · causes of decline.

**"☺ Know the main types of aquatic organisms."**
- T: Plankton; Nekton; Benthos; Phytoplankton; Zooplankton; Macroinvertebrates; Amphibians; Fish.

**"- Identify the various classification of organisms based upon their habitat and movement."**
- F: What are the three groups of aquatic life based on where they live and how they move?; Name four kinds of nekton.; What examples of benthos does the Aquatics Manual give?; Name two very tiny animals that live their entire lives as zooplankton.

**"- Understand the classification, structure, and reproduction of fish."**
- T: Agnatha; Chondrichthyes; Osteichthyes; Cyclostomic mouth; Placoid scales; Spiracles (cartilaginous fish); Head (fish body region); Trunk (fish body region); Tail (fish body region); Operculum; Otoliths; Barbels; Adipose fin; Scales; Annuli; Lateral line; Swim bladder; Neutral buoyancy; Myomeres; Statocysts; Spawning; Milt; Redd; Fry; Metamorphosis (fish). F: Fish are classified in which phylum and subphylum?; What six features do all chordates have for all or part of their life?; What are the four main types of fish scales?; Which fish fins are paired?; How many spawning methods do fish have?; What are the three developmental stages of fish?

**"- Be able to identify aquatic organisms: plant life, fish, amphibians, reptiles, birds, and mammals."**
- ID: all 5 standard fish, the 4 standard plants, and all 29 macroinvertebrate taxa on the guide. F: Name four emergent plants.; Name three floating aquatic plants.; Name three submergent plants.; Name three free-floating plants.; Which salamander is found only in North Carolina?; Name four aquatic mammals found along streams and rivers.
- The ID itself is picture recognition, which is practice rather than cards. The cards cover the ID essentials each profile or sheet states in words.

**"☺ Be able to describe and identify aquatic ecosystems."**
- T: Aquatic life zones; Lentic; Lotic; Pond; Lake; Estuary; Wetland (U.S. Fish and Wildlife Service definition).

**"- Know the classifications of marine ecosystems based on salinity and the ecosystems of each group."**
- T: Salinity; Brackish water; Marine (wetland system); Estuarine (wetland system). F: What are the two major types of aquatic life zones?; The grouping of aquatic life zones is based on what?; What is the average amount of dissolved salts in seawater?; What is the average amount of dissolved salts in river water?; What salinity do Marine wetland habitats exceed?

**"- Understand the various zones within different aquatic environments (depth zones, light zones, vegetative zones)."**
- T: Photic (euphotic) zone; Aphotic zone; Benthic zone; Disphotic zone; Pelagic zone; Abyssal zone; Littoral zone; Limnetic zone; Profundal zone; Emergent plants; Floating aquatic plants; Submergent plants; Free-floating plants. F: About how far below the surface does sunlight penetrate (the photic zone)?; What are the three ocean zones based on sunlight?; How deep does the ocean's euphotic zone go, on average?

**"- Compare and contrast the availability of oxygen and carbon dioxide at different levels of aquatic environments."**
- T: Epilimnion; Hypolimnion. F: Why do dissolved oxygen and carbon dioxide vary differently with depth?; Are profundal zone waters rich or poor in oxygen?

**"- Be able to explain thermal stratification and overturn."**
- T: Thermal stratification; Thermocline; Epilimnion; Metalimnion; Hypolimnion; Overturn (turnover); Fall turnover; Spring turnover. F: Why does thermal stratification occur?; What two things does lake overturn carry?; How long does fall turnover continue?; In which direction do ponds and lakes freeze?

**"- Know the threats to aquatic ecosystems and practices to prevent their pollution."**
- T: Best Management Practices (BMPs); Streamside management zones (SMZs); Riparian buffer. F: What is the greatest threat to upland streams?; Name three human actions that cause wetland loss.; Name three natural threats to wetlands.; Dams block the migration of which fish to spawning grounds?; What is the most important guide for fertilizer use?

**"- Know and be able to describe the various freshwater ecosystems."**
- T: Pond; Lake; Upland streams; Lowland streams; Riffles; Pools (in a stream); Splash pools; Immature river; Mature river; Blackwater rivers.

**"~ Know the various types of wetlands, the definition of a wetland, indicators of wetland areas, wetland soils, and how wetlands are beneficial."**
- T: Wetland (U.S. Fish and Wildlife Service definition); Hydrology (wetland factor); Hydric soils; Reduced soils; Mottled soils; Anaerobic; Hydrophytic vegetation; Marine/Estuarine/Lacustrine/Riverine/Palustrine (wetland system); Swamp; Shrub swamp; Freshwater marsh; Salt marsh; Wet meadows; Bog; Pocosin; Carolina bays; Vernal pools; Southern bottomland forest. F: What are the 3 "H's" used to identify a wetland?; What are the five major wetland systems?; What do wetlands do for groundwater?; What do wetlands do with pollutants?; What do wetlands do with excess water during flooding?; Wetlands are sanctuaries for what?; About how many acres of North Carolina are wetland?

**"~ Understand how a lake or pond ages and the succession of these water bodies."**
- T: Succession; Climax community; Pioneer species; Trophic state (of a lake); Oligotrophic lake; Mesotrophic lake; Eutrophic lake. F: Is there such a thing as a permanent pond?; What does a young pond have?; What does a pond's type of climax community depend on?; How many major trophic stages do scientists use to classify lakes?

**"~ Know the structure of a river and factors that impact its velocity."**
- T: Head (source) of a stream; Headwaters; Mouth (of a river); Stream order; First-order stream; Second-order stream; Third-order stream; Scarp; Thalweg; Meanders; Oxbow lake; Gradient; Discharge; Bankfull flow; Geomorphology. F: What are the three factors that impact the velocity of a stream or river?; Which have greater velocity: mountain headwater streams or rivers?; Where does moving water flow most rapidly in a straight channel?; Which bank of a meander curve does the water cut away?

**"~ Be able to identify the organisms common to each of the freshwater ecosystems and their adaptations to life in these habitats."**
- F: Name two adaptations that reduce resistance to swift currents.; How do net-winged midge larvae hold on in waterfalls?; How does the water strider stay on the water surface?; How are the whirligig beetle's eyes adapted?; How do Donacia larvae get their oxygen?; Which two animals have elevated nostrils for breathing while mostly submerged?; Which three trout species live in NC mountain streams?. T: Casings (caddisfly); Holdfast cells; Diatoms; Diving bubble.

**"~ Describe the threats to freshwater ecosystems."**
- F: What is the greatest threat to upland streams?; Which NC river's pollution by a Canton paper mill became a legal battle with Tennessee?; Which power plants use river water to control heat, causing thermal pollution?; How much of the United States' wetlands have been lost in the last 200+ years?

**"- Identify and describe the various brackish and saltwater ecosystems, and know their importance."**
- T: Estuary; Salt wedge; Salt marsh; Spartina grass; Kelp. F: What are estuaries known as?; Which are the most productive ecosystems on earth?; Name three young fish that spend their early life in estuaries.; About how much of the world's oxygen does phytoplankton produce?; How many named oceans are there?

**"☺ Identify the types of water pollution, know their sources and their impact, and know methods to prevent pollution, including BMP's."**
- T: Point source pollution; Non-point source pollution; Pesticide pollution; Biomagnification; Bioaccumulation; Integrated pest management (IPM); Best Management Practices (BMPs); Fish kill. F: Giardia is an example of which pollutant category?; Mercury, zinc, arsenic, lead, and cadmium belong to which pollutant category?; What is the source of acid deposition?; What is the main source of impairment of North Carolina's water bodies?; What is the most effective measure for controlling pesticide pollution?; Name four soil conservation practices that control sediment pollution.

**"- Know various methods for testing water quality."**
- T: Biotic index; Secchi disc; Velocity (of a stream); Discharge; Alkalinity. F: Which three chemical tests show whether excess nutrients are present?; What does a turbidity test examine?; How do you get the Biotic Index Value?; What biotic index value rates as Excellent?; To find a stream's discharge, what three measurements are multiplied?

**"- Identify equipment and macroinvertebrates used for sampling and determining water quality."**
- T: Price AA flow meter; Secchi disc. F: The Marsh McBirney meter is based on which law?; Which effect does the Acoustic Doppler Current Profiler (ADCP) use?; What cheap tool can citizen scientists use to measure surface velocity?; Why do macroinvertebrates make good bio-indicators?. ID: "<taxon> · pollution tolerance group" for all 29 taxa.
- Sampling nets and other gear are not described in the MS sources, so they have no cards.

**"- Understand legislation that relates to aquatic environments."**
- F: What was the first major U.S. law to address water pollution?; After the 1972 amendments, what did the Federal Water Pollution Control Act become known as?; What were the two main goals of the Clean Water Act?; What is the Marine Protection, Research, and Sanctuaries Act (1972) known as?; In what year was the Safe Drinking Water Act passed?; Name the six Criteria Air Pollutants.; In what year was the Endangered Species Act passed?; Which two agencies administer the Endangered Species Act?

#### (b) Test check: 2026 Area 8 MS Aquatics test (20 questions, numbered in order)

1. Latent heat of fusion → F: Latent heat of fusion is the heat for which change of phase?
2. Wetlands definition agreement → F: Is there one definition of wetlands that all scientists and agencies agree upon?
3. Why vernal pools matter → F: Vernal pools are important breeding grounds for which animals?
4. Condition giving less infiltration → F: Which three conditions result in less infiltration and more surface runoff?
5. Standing vs flowing water names → T: Lentic; T: Lotic
6. Ocean CO2 chemistry change → F: How is increasing atmospheric carbon dioxide changing ocean water?
7. Half the world's oxygen → F: About how much of the world's oxygen does phytoplankton produce?
8. Water molecule after precipitation → no Aquatics card; the water-cycle steps are carded in the General Concepts decks (MS Appendix p.2), e.g. General Concepts · Terms "Water cycle", "Infiltration". T: Hydrologic (hydrological) cycle, Infiltration, Runoff and Evaporation give the vocabulary.
9. Fixing unstable streams → T: Stream restoration
10. Solution lakes → T: Solution lakes; F: In which state are solution lakes particularly common?
11. Tar-Pamlico River importance → no card. The fact is not in the MS sources (it comes from the Tar-Pamlico basin pamphlet, which is not this year's featured basin).
12. Sampling equipment pictured → no card. The fact is not in the MS sources (the plankton net is not described in the manual).
13. Identify macroinvertebrate (picture) → no card; this is a picture-ID skill (practice, not cards). Supporting ID cards: Dobsonfly larva (hellgrammite) · jaws; Dobsonfly larva (hellgrammite) · gills; Fishfly larva · how it differs from the hellgrammite.
14. Its pollution grouping → ID: Dobsonfly larva (hellgrammite) · pollution tolerance group (and the same card for every taxon)
15. Biotic index from a sample → F: In the biotic index, what number is Group 1 multiplied by?; …Group 2…; …Group 3…; How do you get the Biotic Index Value?; What biotic index range rates as Fair?. Doing the calculation is a table-reading skill (practice, not cards).
16. Identify fish (picture) → no card; picture ID (practice, not cards). Supporting ID cards: American shad · side spots / belly / cheek patch.
17. Identify fish (picture) → no card; picture ID (practice, not cards). Supporting ID cards: Largemouth bass · upper jaw / dorsal fin.
18. Which is not a sunfish → ID: American shad · family; Bluegill · family; Crappie · family; Largemouth bass · family
19. Identify aquatic plant (picture) → no card. Water lily is not one of the 4 standard plants and no water lily sheet is in the sources. The manual only lists it (F: Name three floating aquatic plants.).
20. True statement about duckweed → ID: Common duckweed · what scientists are studying it for. The wrong options match ID: Hydrilla · impact on the environment; Lizard's tail · food value to wildlife; Hydrilla · where it is native.


---

## Stage 4 — Wildlife (manual + 2025 Wild Notebook)


Part file: `parts/wildlife.json` — decks `Wildlife · Terms` (286) and `Wildlife · Facts` (352).
Species-profile cards are the separate `wildlife_id` part (`Wildlife · ID`).

#### (a) MS Wildlife Learning Objectives, line by line

**☺ "Understand the basics of wildlife ecology."** (heading — covered by the lines below)

- "Know the parts of the environment and the dependence of living organisms on nonliving portions (water, temperature, soils, mineral nutrients, and sunlight) of the ecosystem."
  → Terms: Wildlife; Biotic factors; Abiotic factors; Ecology; Environment; Precipitation; Ecosystem; Biosphere; Aquatic. Facts: What do biotic factors depend upon for growth?
- "Understand the organization of life and the relationships among organisms."
  → Terms: Cell; Tissue; Organism; Species; Population; Community; Ecosystem; Biosphere; Interaction. Facts: In the organization of life, what are the levels from cell up to biosphere, in order?
- "Identify the source of energy for all life, the processes for producing energy, and the flow of energy through an ecosystem. Describe food webs, food chains, and energy pyramids."
  → Terms: Producers; Food chain; Energy flow; Food web; Trophic levels; Consumers; Primary/Secondary/Tertiary consumers; Respiration; Phytoplankton. Facts: In a food chain, energy flows through which organisms, in order?; What is at the base of any food chain or food web?; What do food webs display?; About what percent of energy is transferred to the next trophic level?; At all trophic levels, energy is lost through what process?; What diagram displays the energy passed from one trophic level to the next?
- "Know the essential mineral nutrients and gases for life and the importance of their cycling through the ecosystem."
  → Terms: Decomposers; Bacteria; Detritivores; Detritus; Organic matter; Fungi. Facts: Which insects does the manual give as an example of detritivores?; What food source do fallen leaves provide for aquatic invertebrates?
  The MS Wildlife Manual names no specific mineral nutrients or gas cycles — no further card (fact not in the MS Wildlife sources).
- "Describe the various niches of wildlife and give examples of organisms in each niche."
  → Terms: Niche; Herbivores; Omnivores; Carnivores; Detritivores; Decomposers; Scavengers; Generalist; Specialists; Resource partitioning. Facts: What is a common example of a scavenger?; The variety of species found in a habitat is related to the number of what?; The beaks and feet of birds are designed to fit what?; mammal-teeth facts (herbivores / omnivores / carnivores).
- "Identify the feeding relationships and interactions among wildlife and state examples of organisms for each."
  → Terms: Predator; Prey; Scavengers; Carrion; Symbiosis; Mutualism; Commensalism; Parasitism; Host; Parasite; Competition; Interspecific competition; Intraspecific competition; Resource partitioning. Facts: What is the most common feeding relationship?; What is the most common living relationship among organisms?; What are the three types of symbiosis?; In the bee and flower mutualism, what does each one get?; In the commensalism example of birds following herds of herbivores, what do the birds get?; Is the host of a parasite usually killed?; Which parasites on mammals and birds does the Wildlife Manual give as examples?
- "Understand the importance of habitat for wildlife. Identify what a habitat must provide, and define each of the components of a habitat"
  → Terms: Habitat; Forage; Forb; Browse; Mast; Soft mast; Hard mast; Cover; Brood; Home range; Territory; Arrangement (habitat). Facts: What are the five essential elements a habitat must provide?; Wildlife food sources from plants are often classified as which four types?; Where can wildlife get water besides streams, rivers, and lakes?; What two things do wildlife require cover for?; Cover is often classified into which five kinds?; What do wildlife need space for?; Which habitat element often determines what organisms can live in a habitat?
- "Explain the carrying capacity of an ecosystem, the factors that affect carrying capacity, and its importance to wildlife populations."
  → Terms: Carrying capacity (biological); Limiting factors; Cultural carrying capacity. Facts: What happens to the plants when animal numbers become too large for the habitat?; A decrease in a habitat's carrying capacity results in what?; As resources drop in an overpopulated habitat, animals die of which three things?; Which animal does the manual use as an example of reaching cultural carrying capacity quickly?

**☺ "Understand the importance of habitat, the various types of habitat, and the species associated with particular habitats."** (heading)

- "Describe how suitable habitat varies for some species during different stages of their life, different seasons, different times of the day, or during reproduction."
  → Facts: Which species depend on wetland areas for all or part of their life cycle?; Which life stages do many insects and amphibians spend in wetlands?; What does migration allow birds to find throughout the year?; Why are fields one of the first places snow melts in spring?; Terms: Life cycle; Migration; Nocturnal; Diurnal; Crepuscular.
- "Identify the habitat requirements of different species: large animals, generalists, and specialists."
  → Terms: Generalist; Specialists. Facts: Which animals are notably affected by habitat loss and fragmentation because they need large ranges?
  (The manual's line "Specialists are also affected by habitat destruction or fragmentation" is covered by the Specialists term; not carded twice.)
- "Describe important habitat areas and the wildlife dependent upon them (ecotones, wetlands, fields or meadows, riparian areas, forest clearings, beaver ponds, and snags and downed logs."
  → Terms: Ecotone; Edge effect; Edge habitat; Wetland; Marsh; Swamp; Riparian areas; Field; Greenway; Snag; Downed log; Cavity nesters; Forest floor. Facts: Where is biodiversity greater: at the margins of two communities or at the center of either?; Which has more different species, a deciduous forest or a meadow?; riparian facts (three things they give wildlife; how vegetation prevents pollution; shading keeps water cooler; fallen leaves → detritus); field facts (snow melt; succession order); What are two natural causes of forest clearings?; Which two human practices can cause forest clearings?; What do snags and downed logs provide areas for?; How old is a mature forest?; Which two cavity nesters does the manual name as using snags?; Which salamander lays its eggs in a jelly-like mass beneath moist, decaying logs?
  "Ecotones" → Terms: Ecotone (Glossary p.10; the manual itself never uses the word). "Beaver ponds": no section in the MS Wildlife Manual — only the Glossary's keystone-species example mentions one (in the Keystone species card's info); beaver natural history → Wildlife · ID: Beaver (profile).
- "Explain techniques and practices applied to create and preserve habitats."
  → Terms: Food plots (wildlife openings); Buffer strips; Riparian buffer; Filter strips; Corridors; Field borders; Streamside Management Zones (SMZ); Selective cutting; Seed tree cut; Seed tree; Habitat restoration (ecological restoration); Conservation landscaping; Forest stewardship; Stewardship. Facts: When harvesting trees, what kind of cuts increase the amount of edge?; What can be planted to connect large forested areas as travel lanes for wildlife?; Which three forestry practices does the manual say benefit wildlife?; Replanting clear-cut pine or conifer forests provides what kind of habitat?; CRP / CREP / WHIP / WRP / FSP acronym facts; Which department offers CRP, CREP, WHIP, WRP, and FSP?; Which professionals does habitat restoration often bring together?; In urban areas, what have become valuable wildlife corridors?; What two road structures give wildlife safe corridors?
- "Describe succession, its importance to wildlife species, and the animals, which benefit from each stage of succession."
  → Terms: Succession; Primary succession; Secondary succession; Early successional; Shrub; Tree; Deciduous; Coniferous; Conifer. Facts: In a grassy field, what is the order of plant succession?; Replanting clear-cut pine or conifer forests provides what kind of habitat?
  The manual names no animals per succession stage — no card for that part (not in the MS sources).
- "Define fire-maintained ecosystem. Describe a native fire-maintained ecosystem and the wildlife adapted to the system. Identify practices used to manage fire-dependent ecosystems (prescribed burns)."
  → Terms: Prescribed burn; Wildfire. Facts: Which forests of eastern North Carolina have been kept in one stage of succession by fire?; What is the usual natural source of the fires that maintain longleaf pine forests?; Why did Native Americans start fires in longleaf pine forests?; Which four species does the manual name as adapted to the longleaf pine forest?; What is another name for a prescribed burn?; What two things are prescribed burns used to do for longleaf forests?; Which two fire-dependent ecosystems in North Carolina does the manual name?; Ecosystems that are fire dependent must have what to be maintained?; Besides keeping fire-dependent forests healthy, how do prescribed burns add diversity to a habitat?

**☺ "Understand what the term "wildlife" includes, the identifying characteristics of various species, representative members of the species, the roles of various species, and the interaction of society and various species."** (heading)

- "Describe how insects are both "pests" and beneficial to man and wildlife."
  → Terms: Insect pests; Pest; Integrated Pest Management (IPM); Polyculture; Monoculture; Hormone; Insecticide; Pesticide; Beneficial insects; Pollinator. Facts: Which three insect pests does the Wildlife Manual give as examples?; In which kind of system is IPM particularly useful?; What are the four kinds of IPM tools?; Which predators are used as biological controls of insect pests?; In IPM, when should chemical insecticides be used?; Which mechanical (physical) controls are used in IPM?; What are the most important food crop pollinators?; Which three insect pollinators are widely recognized?; What often harms pollinating insects and other helpful species?; Insects serve as prey for which four groups of animals?; Which insects does the manual give as an example of detritivores?
- "Define keystone, indicator, game, and non-game species and give examples of each."
  → Terms: Game species; Big game; Furbearers; Non-game species; Consumptive use; Non-consumptive use; Bioindicators; Macroinvertebrates; Umbrella species; Flagship species. Facts: Which three big game species does the Wildlife Manual name?; Which three furbearers does the Wildlife Manual name?; Why can amphibians be at risk from water pollution?
  → Terms: Keystone species (Glossary p.16; the manual itself never uses the word).
- "Recognize the identifying characteristics, roles, types, habitats, adaptation, interactions, threats to, and representative species of fish, amphibians, reptiles, birds, and mammals."
  → Terms: Invertebrates; Exoskeleton; Vertebrates; Arthropods; Fish; Scale; Amphibians; Ectotherms; Tympanic membrane (tympanum); Nictitating membrane; Porous; Herpetologist; Reptiles; Terrestrial; Birds; Endothermic; Passerine birds; Raptors (birds of prey); Talons; Crop; Gizzard; Ornithologists; Mammals; Pelage; Pheromones; Echolocation; Vestigial structure; Plantigrade; Digitigrade; Unguligrade; Fossorial; Entomologists; (Wild Notebook) Anadromous; Scutes; Barbels; Ultrasounds; Tail autotomy. Facts: the vertebrate-group, arthropod, insect, fish, amphibian, reptile, snake (38 species / 6 venomous / which are protected), bird (flight adaptations, groups, ducks, feet, beaks, gizzard grit), mammal (hair, glands, teeth, senses, eyes, locomotion examples) facts on Wildlife Manual pp.11-23; Wild Notebook facts on Atlantic sturgeon (p.1), bats (p.3) and NC lizards (p.4).
- "Describe the reproductive processes and behaviors of the vertebrate animals."
  → Terms: Metamorphosis; Nymph; External fertilization; Fertilization; Oviparous; Ovoviviparous; Viviparous; Sexually dimorphic; Sexually monomorphic; Dewlap; Monogamous; Brood parasitism; Brood parasites; Monotremes; Marsupials; Placentals; Placenta; Gestation period; Spawn. Facts: stages of complete / incomplete metamorphosis; What is the larval stage of frogs and toads called?; Why must amphibian eggs be in water or very moist areas?; What type of fertilization do amphibians generally use?; Which amphibians will often guard their eggs?; What type of fertilization do all reptiles use?; What adaptation allowed reptiles to live their entire lives on land?; What is extremely important in the timing of reptile reproduction?; How do all birds reproduce?; Are the majority of bird species monogamous?; Which bird is a common brood parasite?; Brood parasitism appears among which three animal groups?; Mammals are classified into which three groups?; What are the only two monotreme species living today?; What is the only marsupial in North America?; Why is live birth an advantage for mammal mothers?; Atlantic sturgeon maturity ages (Wild Notebook p.1).
- "Identify some types of animal adaptations –physical and behavioral –and provide examples of each."
  → Terms: Adaptation; Natural selection; Countershading; Mimicry; Camouflage; Poisonous; Venomous; Immunity (adaptation); Warning coloration; Thermoregulation; Hibernation; Aestivation; Arboreal; Tail autotomy. Facts: Adaptations are of which three kinds?; example facts for countershading (gray squirrel), mimicry (Scarlet King Snake), immunity (Virginia opossum), warning coloration (Striped Skunk, Monarch), hibernation (little brown bat), arboreal (green anoles, Virginia Opossums); For thermoregulation, birds, mammals, and reptiles use what, respectively?; Wild Notebook p.6 food-caching facts (squirrels, chipmunks, caching birds).
- "Describe the migratory pattern of animals including types of migration and activities associated with migration."
  → Terms: Migration; Migratory; Neotropical migrants; Flyway; Anadromous. Facts: Is migration a physical or a behavioral adaptation?; What does migration allow birds to find throughout the year?; In what year were the four U.S. waterfowl flyways established?; What are the four U.S. waterfowl flyways?
- "Identify the activity patterns and cycles of animals –circadian rhythms, activity and sleep, reproductive, and tidal."
  → Terms: Nocturnal; Diurnal; Crepuscular; Circadian rhythms; Tidal (lunar) cycles. Facts: Which species are tied to tidal (lunar) cycles?; Reproductive cycles of most animals are influenced by which two things?; What are three typical annual cycles in many animals?
- "Describe the types of animals signs used to identify species, and recognize species by characteristic signs."
  → Terms: Tracks; Scat; Food remnants; Pellets; (Wild Notebook) Rub (deer); Scrape (deer); Licking branch; Velvet (antlers); Buck; Doe. Facts: Which animals can also be identified by their songs and calls?; Tooth marks or gnaw patterns identify which animals?; Pits or tree borings identify which animals?; raccoons / crayfish shells; Burrows, dens, nests, and lodges; Why do male deer rub their antlers on trees?; NCWRC Species Profiles; range and habitat; What four things should you note when identifying tracks?; What should you note when identifying scat?; river otter scat; Wild Notebook p.5 deer-gland and tail facts.
  Recognizing a particular species' track/scat/skull/pelt → Wildlife · ID (wildlife_id part).
- "Display knowledge of the natural history of species in the designated set of wildlife profiles."
  → Wildlife · ID (wildlife_id part)

**☺ "Understand the concepts and practices of wildlife management and conservation."** (heading)

- "Define and identify representative endangered and threatened species, and describe what makes some species more vulnerable."
  → Terms: Endangered species; Threatened species; Species of special concern; Extinction; Extirpated; Umbrella species. Facts: In what year was the Endangered Species Act passed?; Which two agencies oversee the Endangered Species Act?; Which endangered species in NC does the manual list?; Which threatened species in NC does the manual list?; Which agencies can classify a species as threatened or endangered?; Which three NC species of special concern does the manual name?; What four reasons does the manual give for species becoming threatened or endangered?; Which two birds does the Wildlife Manual name as examples of species that went extinct in the U.S. due to over-harvesting?; NC endangered / special-concern venomous snakes; Which agency listed the Atlantic sturgeon as Endangered, and when? (Wild Notebook p.1).
- "Identify the agencies responsible for wildlife management and conservation."
  → Facts: Which three federal agencies does the Wildlife Manual name as examples that share responsibility for wildlife management?; Which agency manages fish and wildlife species in North Carolina?; Which two agencies oversee the Endangered Species Act?; Which agencies can classify a species as threatened or endangered?; Which department offers CRP, CREP, WHIP, WRP, and FSP?; At how many hatcheries does the NC Wildlife Resources Commission grow aquatic species? (Wild Notebook p.2).
- "Describe the role of hunters in wildlife management and conservation."
  → Terms: Market hunting; Sustained yield. Facts: Which three activities are important population management tools?; Is the proportion of people who hunt rising or declining?; Which 1937 act funds wildlife study, habitat restoration, and hunter education?; What excise tax on hunting equipment does the Pittman-Robertson Act enforce?; Which 1951 act provides funds for fisheries restoration and management?; What provides the majority of state funds for fish and game management?; Which 1934 act uses duck stamps to fund wetland management?; What must every hunter in North Carolina take?
- "Describe the principles of wildlife management and recognize the difference between conservation and preservation."
  → Terms: Wildlife management; Conservation; Preservation; Biota; Naturalist; Natural resources. Facts: North American Model facts (model name; Public Trust Doctrine of 1842; why it formed; seven principles; principles 1, 3, 4, 6); captive cervid industry; historic vs today's management focus; Who coined the term "conservation," and when?; National Forest / National Park examples; Habitat management most often uses conservation or preservation?; NCWRC principles (biological data; management of man; conservation not preservation).
- "Identify how wildlife management laws protect wildlife."
  → Terms: Take (MBTA). Facts: Which 1900 law fights the trade and sale of illegally taken wildlife?; What was the first large-scale federal wildlife protection law in the United States?; The Migratory Bird Treaty Act of 1918 was created to stop over-harvest of birds for what?; Under the MBTA, what is illegal to take?; What does CITES stand for?; What kind of agreement is CITES?; Hunting with what is no longer allowed over water?; Why did all alligator hunting become illegal?; In what year were Atlantic sturgeon protected from fishing harvest? (Wild Notebook p.1).
- "Describe various wildlife management tools and the benefits of each."
  → Terms: Direct manipulation; Indirect manipulation; Immigration; Emigration; Mortality; Natality; Age structure; Presence; Abundance; Density; Blind; Remote camera stations; Radio telemetry; Cover boards; Nesting boxes; Mist nets; Sherman live traps; Mark-recapture study; Sustained yield; Prescribed burn; Aquaculture. Facts: three kinds of reasons populations are managed; overabundance effects; four things that influence population numbers; why manipulation is controversial; which tools give presence data / are best for movement / best for density; three reintroduced NC species; wildlife-disease facts (rabies, ticks, hemorrhagic disease, CWD, chytrid, ranaviruses, bird feeders, White-nose Syndrome) and their management steps; Wild Notebook p.1 fishway / acoustic telemetry and p.2 hatchery facts.

#### (b) Test check — 2026 Area 8 (Southern Piedmont) MS Wildlife test

1. Duck species from field marks (speculum/flight) → Wildlife · ID: Mallard Duck (profile). (Key cites a Wild Notebook page 12 not in our 2025 Wild Notebook file; the Mallard profile describes the speculum.)
2. Most serious threat to birds → Facts: "What is the most serious threat to birds today?"
3. Three types of symbiosis → Facts: "What are the three types of symbiosis?"; Terms: Mutualism, Commensalism, Parasitism.
4. Trait that helps survival → Terms: "Adaptation".
5. 1900 law on illegal wildlife trade → Facts: "Which 1900 law fights the trade and sale of illegally taken wildlife?"
6. Direct population management example → Terms: "Direct manipulation" (and "Indirect manipulation").
7. Why some mammals have vestigial eyes → Facts: "Which mammals have vestigial eyes?"; Terms: "Vestigial structure".
8. Northern bobwhite survival feature → no card — fact not in the MS sources (no bobwhite profile among the 30 standard + 5 featured species).
9. Beaver decline after trees removed (habitat element) → Facts: "What are the five essential elements a habitat must provide?", "What two things do wildlife require cover for?"; Terms: "Cover". (The beaver/tree link itself is a reasoning step, not a stated fact; beaver diet/lodge → Wildlife · ID: Beaver (profile).)
10. Draining wetland and mink → Wildlife · ID: Mink (profile).
11. Protecting seepage salamanders → no card — fact not in the MS sources (no seepage salamander profile on disk). Related manual cards: "Riparian buffer", "Streamside Management Zones (SMZ)".
12. Species diversity at habitat edges → Facts: "The variety of species found in a habitat is related to the number of what?", "Where is biodiversity greater: at the margins of two communities or at the center of either?"; Terms: "Edge effect", "Edge habitat".
13. Population over carrying capacity → Facts: "What happens to the plants when animal numbers become too large for the habitat?", "A decrease in a habitat's carrying capacity results in what?"; Terms: "Carrying capacity (biological)".
14. Wetlands and amphibians → Facts: "Which life stages do many insects and amphibians spend in wetlands?", "Why must amphibian eggs be in water or very moist areas?"
15. Why echolocation is useful → Terms: "Echolocation"; Facts: "Mammals use echolocation for which three things?", "Which three kinds of mammals does the manual say use echolocation?"
16. ID: pelt → Wildlife · ID: Red Fox (profile).
17. ID: owl mount → no card — fact not in the MS sources (Great Horned Owl is not one of the 30 standard or 5 featured profiles).
18. ID: skull → Wildlife · ID: Coyote (profile).
19. ID: skull → Wildlife · ID: Beaver (profile).
20. ID: track → Wildlife · ID: White-Tailed Deer (profile).


---

## Stage 4 — Wildlife · ID (30 standard + 5 featured species profiles)


Deck `Wildlife · ID` (flip), stage 4, station Wildlife, group "Wildlife Classification, Adaptations, and Identification" (concept 2).
574 cards for 35 animals. Sources: the 30 NCWRC profiles `text/wild_<Animal>.txt` and 5 featured profiles `text/featured_<Animal>.txt`.

The club teacher's sheet asks for Description · Habitats and Habits · Classification (class only) · Food, plus ID essentials (track, scat, pelt, skull, picture, preserved specimen). Every animal has a `· class`, `· food` and habitat card; the rest is what each profile states. "Picture" and "preserved specimen" are visual-ID skills (practice, not cards) — the description cards are what they rest on.

#### (a) Animals — card fronts and what the profile lacked

##### 30 standard species (wild_00_list.txt order)

**1. American Bullfrog** (14 cards) — class; tadpole food; adult food; habitat; size; skin; distinguishing mark; call; jump; breeding season; clutch size; eggs hatch; tadpole to adult; winter
- Fronts are `American Bullfrog · <attribute>` for each attribute above.
- Profile lacked: track, scat, skull not described; daily activity only as "sing solo, anytime day or night" (calling, not activity) — no active-when card; eggs are laid as a film on the pond (no nest/den).

**2. Barred Owl** (14 cards) — class; food; habitat; name comes from; ear tufts; eye color; nickname; active when; larger sex; size; nest site; clutch size; eggs hatch; broods per year
- Fronts are `Barred Owl · <attribute>` for each attribute above.
- Profile lacked: track, pellets/scat, skull not described.

**3. Beaver** (20 cards) — class; diet type; food; habitat; size rank; adult weight; length; fur color; teeth; tail; tail uses; hind feet; told from a muskrat by; home; active when; busy season; territory sign; colony; young; nickname
- Fronts are `Beaver · <attribute>` for each attribute above.
- Profile lacked: track, scat, skull not described (hind feet and the four incisors are described — carded as feet/teeth).

**4. Black Bear** (16 cards) — class; diet type; food; habitat; color; toes and claws; senses it relies on most; top speed; length; adult weight; denning months; den sites; mating season; cub weight at birth; cubs stay with mother; hind track length
- Fronts are `Black Bear · <attribute>` for each attribute above.
- Profile lacked: scat and skull not described; active-when (day/night) not stated; front-track size not labeled (only the hind-track drawing has "9 inches").

**5. Bobcat** (19 cards) — class; diet type; food; habitat; name comes from; tail color; fur; underside; shoulder height; weight (N.C.); paws; ear tufts; active when; dens; breeding season; litter; social habit; wild cats in N.C.; teeth
- Fronts are `Bobcat · <attribute>` for each attribute above.
- Profile lacked: track drawing absent; scat and skull not described (paws and canine teeth carded).

**6. Canada Goose** (17 cards) — class; diet type; food; N.C. nesting habitat; head and neck; bill, legs and feet; tail mark; call and nickname; N.C. adult size; male name; young; average clutch; incubation; nesting season (southern); mates; track size; migrants in N.C.
- Fronts are `Canada Goose · <attribute>` for each attribute above.
- Profile lacked: active-when not stated; scat not described; skull n/a. Track only as a drawing labeled "3 inches".

**7. Copperhead** (20 cards) — class; food; habitat; name comes from; body pattern; ground color; head; pupils; heat sensory pit; dorsal scales; fangs; venom type; hunting style; active when; winter; young; young's tail tip; newborn length; adult size; status in N.C.
- Fronts are `Copperhead · <attribute>` for each attribute above.
- Profile lacked: tracks/scat/skull n/a (snake); no nest (live young).

**8. Coyote** (17 cards) — class; diet type; food; habitat; told from a red wolf by; tail; color; toes; feet compared to a dog; size; den; territory marking; mating season; litter; name meaning; top scat food (Fort Bragg study); top scat food (Albemarle Peninsula study)
- Fronts are `Coyote · <attribute>` for each attribute above.
- Profile lacked: skull not described; scat only as diet-study results; no track drawing (toe count and "dew claw does not appear in tracks" carded); active-when not stated.

**9. Eastern Box Turtle** (18 cards) — class; food; habitat; hot, dry weather refuge; name comes from; carapace; plastron hinge; hind feet; male eye color; male plastron; size; N.C. state symbol; active when (summer); winter; nesting months; clutch average; egg sex set by; hatchling length
- Fronts are `Eastern Box Turtle · <attribute>` for each attribute above.
- Profile lacked: track and scat not described.

**10. Eastern Cottontail** (16 cards) — class; food; habitat; how to recognize; told from the marsh rabbit by; told from the Appalachian cottontail by; young's forehead mark; size; active when; first line of defense; winter food; male and female names; breeding season; litter size (N.C.); nest; gestation
- Fronts are `Eastern Cottontail · <attribute>` for each attribute above.
- Profile lacked: track and scat not described; skull only as the way to tell it from the Appalachian cottontail (carded).

**11. Eastern Gray Squirrel** (13 cards) — class; food; habitat; color; active when; N.C. state symbol; shelter; fall habit; size; litters per year; litter size; mating times; calls
- Fronts are `Eastern Gray Squirrel · <attribute>` for each attribute above.
- Profile lacked: track, scat, skull not described.

**12. Eastern Wild Turkey** (15 cards) — class; diet type; food; habitat; male plumage; spurs; beard; male head color; roost; nest; main senses for safety; speed; weight; male and female names; young names
- Fronts are `Eastern Wild Turkey · <attribute>` for each attribute above.
- Profile lacked: track and scat not described; active-when only as "roosting in trees at night" (carded as roost).

**13. Gray Fox** (16 cards) — class; food; habitat; climbing; coloration; rusty color; tracks; why its track is distinct; weight; length; active when; den; mating season; litter; voice; height
- Fronts are `Gray Fox · <attribute>` for each attribute above.
- Profile lacked: scat and skull not described.

**14. Groundhog** (16 cards) — class; diet type; food; habitat; burrow site; nicknames; family rank; fur; feet; tail; size; active when; hibernation; alarm call; litter size; mating season
- Fronts are `Groundhog · <attribute>` for each attribute above.
- Profile lacked: track, scat, skull not described.

**15. Mallard Duck** (14 cards) — class; diet type; food; habitat; duck type; drake markings; hen markings; wing color; voice; flight speed; clutch size; incubation; brood can fly at; mating season
- Fronts are `Mallard Duck · <attribute>` for each attribute above.
- Profile lacked: active-when not stated; nest materials not described; track/scat not described.

**16. Marbled Salamander** (16 cards) — class; food; habitat; name comes from; body color; male bands vs. female bands; length; family; N.C. state symbol; active when; breeding; nest site; clutch size; egg care; larvae development; larvae color
- Fronts are `Marbled Salamander · <attribute>` for each attribute above.
- Profile lacked: tracks/scat/skull n/a.

**17. Mink** (16 cards) — class; food; habitat; what controls its numbers; nickname; body; feet; fur; tail; when threatened; active when; dens; size; breeding season; litter; social habit
- Fronts are `Mink · <attribute>` for each attribute above.
- Profile lacked: track (feet are described), scat, skull not described.

**18. Mourning Dove** (17 cards) — class; food; share of diet that is seeds; nesting habitat; favorite nest trees; name comes from; tail; adult male marks; legs and feet; flight; calls; nesting season; eggs; first food of young; young; nest; family
- Fronts are `Mourning Dove · <attribute>` for each attribute above.
- Profile lacked: active-when only as feeding/nesting by day and watering late afternoon (not carded); track/scat not described.

**19. Muskrat** (15 cards) — class; food; habitat; feeding sign; tail; hind feet; color; size; looks like; active when; homes; breeding season; litter; told from a nutria by; swimming view vs. beaver
- Fronts are `Muskrat · <attribute>` for each attribute above.
- Profile lacked: track (hind feet described), scat, skull not described.

**20. Raccoon** (13 cards) — class; food; habitat; how to recognize; special sense; “washing” food; dens; winter; weight; size; breeding season; litter; cubs open their eyes
- Fronts are `Raccoon · <attribute>` for each attribute above.
- Profile lacked: active-when not stated plainly (only a "nocturnal raid" aside and daytime sightings note); track, scat, skull not described.

**21. Rat Snake** (17 cards) — class; food; habitat; name comes from; venom; adult color (mountains and Piedmont); adult color (southeastern Coastal Plain); body shape; juvenile pattern; length; how it kills; climbing; when approached; active when; sign in buildings; clutch; egg site
- Fronts are `Rat Snake · <attribute>` for each attribute above.
- Profile lacked: tracks/scat/skull n/a.

**22. Red Fox** (15 cards) — class; food; habitat; name comes from; ears and legs; tail; told from a gray fox by; weight; size; territory marking; active when; female name; mating month (N.C.); litter; den
- Fronts are `Red Fox · <attribute>` for each attribute above.
- Profile lacked: track, scat, skull not described.

**23. Red-Tailed Hawk** (16 cards) — class; food; habitat; woods vs. fields; tail; belly band; bill; larger sex; size; hunting; common perches; active when; nest; nesting habitat; clutch; young in nest
- Fronts are `Red-Tailed Hawk · <attribute>` for each attribute above.
- Profile lacked: track, pellets/scat not described.

**24. River Otter** (15 cards) — class; food; habitat; family; tail; feet; fur; eyes and ears; whiskers; sign; dens; active when; size; young; breeding season
- Fronts are `River Otter · <attribute>` for each attribute above.
- Profile lacked: track (feet described), scat (only "scent mounds"), skull not described.

**25. Southern Flying Squirrel** (19 cards) — class; diet type; food; habitat; size rank; weight; length; patagium; fur; told from the Carolina northern flying squirrel by; eyes; active when; voice; glide; landing; nest lining; winter roosting; breeding times; litter
- Fronts are `Southern Flying Squirrel · <attribute>` for each attribute above.
- Profile lacked: track, scat, skull not described.

**26. Spring Peeper** (15 cards) — class; food; habitat; back marking; ground color; toes; males' throats; call; length; breeding sites; breeding season; active when; eggs; tadpole to frog; prey it can see
- Fronts are `Spring Peeper · <attribute>` for each attribute above.
- Profile lacked: tracks/scat/skull n/a; no nest.

**27. Striped Skunk** (18 cards) — class; diet type; food; habitat; stripes; tail; front claws; size; weight; defense; family; den; active when; winter; feeding sign; foraging senses; breeding season; litter
- Fronts are `Striped Skunk · <attribute>` for each attribute above.
- Profile lacked: track (front claws only), scat, skull not described.

**28. Virginia Opossum** (18 cards) — class; diet type; food; habitat; what makes it unique in the U.S.; tail; ears and nose; hind foot first digit; number of teeth; fur; size; active when; winter; gestation; successful litter; young weaned at; “playing possum”; snake venom
- Fronts are `Virginia Opossum · <attribute>` for each attribute above.
- Profile lacked: track (feet described) and scat not described; skull only as "50 teeth" (carded).

**29. White-Tailed Deer** (21 cards) — class; food; habitat; coat; face markings; tail; hooves; dew claw; antlers or horns; average mature buck's points; antler size depends on; antler drop and regrowth; main sense for protection; top speed; feeds when; rut (breeding season); buck signs; weight; fawns; how age is told; “hider” species
- Fronts are `White-Tailed Deer · <attribute>` for each attribute above.
- Profile lacked: scat not described; skull only as antlers vs. horns and age-by-teeth (carded); track as hoof/dew-claw description (carded).

**30. Wood Duck** (15 cards) — class; food; habitat; nest site; drake head; drake face; drake eyes and bill; drake breast; hen markings; body adaptations; clutch; incubation; N.C. hatching peak; broods per season; size
- Fronts are `Wood Duck · <attribute>` for each attribute above.
- Profile lacked: active-when not stated; track/scat not described.

##### 5 featured 2026-27 profiles

**1. Bald Eagle** (16 cards) — class; food; main food; habitat; name comes from; adult coloring; juvenile coloring; years to adult plumage; wings when soaring; size; larger sex; nest; N.C. nesting begins; eggs; nestlings fledge in; scientific name meaning
- Fronts are `Bald Eagle · <attribute>` for each attribute above.
- Profile lacked: active-when not stated (only thermals in late morning/midday); track, pellets/scat not described.

**2. Corn Snake** (16 cards) — class; food; habitat; name comes from; other name; back pattern; belly; head mark; body shape; active when; daytime hiding; how it kills; winter; length; clutch; venom
- Fronts are `Corn Snake · <attribute>` for each attribute above.
- Profile lacked: tracks/scat/skull n/a.

**3. Southern Leopard Frog** (18 cards) — class; food; habitat; name comes from; back color; dorsolateral folds; eardrum mark; told from the pickerel frog by; call; vocal sacs; salt tolerance; active when; size; breeding season; eggs; eggs hatch in; tadpole to frog; status in the Coastal Plain
- Fronts are `Southern Leopard Frog · <attribute>` for each attribute above.
- Profile lacked: tracks/scat/skull n/a; no nest (egg mass carded).

**4. Carolina Northern Flying Squirrel** (17 cards) — class; food; ground food; habitat; preferred trees; forages vs. dens; fur; belly hairs; tail; size vs. southern flying squirrel; glide; federal status; active when; nest; favorite den sites; litter; size
- Fronts are `Carolina Northern Flying Squirrel · <attribute>` for each attribute above.
- Profile lacked: track, scat, skull not described; breeding season given only as litter months (not carded).

**5. Eastern Chipmunk** (16 cards) — class; food; habitat; N.C. range; stripes; tail; length (description); forepaws; most distinguishing feature; other name; burrow; active when; call; winter; litters; weight
- Fronts are `Eastern Chipmunk · <attribute>` for each attribute above.
- Profile lacked: track, scat, skull not described.

#### (b) Test check — 2026 Area 8 (Southern Piedmont) MS Wildlife test

Questions referred to by number and topic only.

| Q | Topic | Card(s) |
|---|---|---|
| 1 | Duck species from flock/wing clue | Partly `Mallard Duck · wing color` (violet-blue on each wing). The flight/sound clue is not in the Mallard profile — key cites Wild Notebook p.12 → manual (wildlife part) |
| 2 | Most serious threat to birds | → manual (wildlife part) |
| 3 | Three symbiotic relationships | → manual (wildlife part) |
| 4 | Adaptation definition | → manual (wildlife part) |
| 5 | 1900 wildlife-trade law | → manual (wildlife part) |
| 6 | Direct population management | → manual (wildlife part) |
| 7 | Vestigial eyes | → manual (wildlife part) |
| 8 | Northern bobwhite survival feature | no card — bobwhite is not one of the 35; its profile is not in the sources → manual (wildlife part) |
| 9 | Beaver decline after tree removal (habitat element) | → manual (wildlife part) (key cites Manual p.4). Related profile facts: `Beaver · diet type`, `Beaver · home` |
| 10 | Draining wetland → mink | `Mink · habitat`, `Mink · what controls its numbers` |
| 11 | Protecting seepage salamanders | no card — seepage salamander is not one of the 35 → manual (wildlife part) |
| 12 | Diversity at habitat edges | → manual (wildlife part) |
| 13 | Exceeding carrying capacity | → manual (wildlife part) |
| 14 | Wetlands and amphibians | → manual (wildlife part) |
| 15 | Echolocation | → manual (wildlife part) |
| 16 | ID: red fox pelt | `Red Fox · name comes from`, `Red Fox · ears and legs`, `Red Fox · tail`, `Red Fox · told from a gray fox by` |
| 17 | ID: great horned owl mount | no card — not one of the 35; the Barred Owl profile only compares sizes, no description of the great horned owl |
| 18 | ID: coyote skull | no card — the Coyote profile does not describe the skull (nearest: `Coyote · told from a red wolf by`, long slender snout). Skull ID is a specimen skill |
| 19 | ID: beaver skull | `Beaver · teeth` (four large yellow incisors) |
| 20 | ID: white-tailed deer print | `White-Tailed Deer · hooves`, `White-Tailed Deer · dew claw` |


---

## Stage 5 — Current Environmental Issues 2027


No Learning Objectives sheet exists for CEI. Coverage = the 2027 MS CEI packet's 11 linked articles, each with its card fronts and what was not used. Deck: `Current Issue · 2027` (one deck, flash).

#### (a) Articles → card fronts

##### 01 Is it Legit? (News Literacy Project) — Evaluating Information Sources  (17 cards, `text/cei_01_is_it_legit.txt`)
- What are the five steps for vetting a news source (Is It Legit)? — Is It Legit p.1
- Which three news aggregators does the guide name as examples for checking whether a source has been vetted? — Is It Legit p.1
- Which ethical standards do reputable news organizations aspire to? — Is It Legit p.1
- In what form are a news source's standards often made public? — Is It Legit p.1
- Which professional journalism code is commonly shared across the industry? — Is It Legit p.1
- Besides reporting practices, what should quality news sources be transparent about? — Is It Legit p.1
- What do credible news sources do about mistakes? — Is It Legit p.1
- Bylines — Is It Legit p.1
- Bylines are a sign of which two qualities? — Is It Legit p.1
- What are the six trust busters that signal a news source to avoid? — Is It Legit p.1
- False or untrue content — Is It Legit p.1
- Clickbait tactics — Is It Legit p.1
- Lack of balance — Is It Legit p.1
- State-run or state-sponsored propaganda — Is It Legit p.1
- Dangerous, offensive and malicious content — Is It Legit p.1
- Which three tools does Is It Legit name for a reverse image search? — Is It Legit p.1
- Who created the Is It Legit infographic? — Is It Legit p.1

Not carded:
- Step 1 and Step 5 checklist questions ("Do you see original reporting?", grammar/spelling errors, compare with other newsrooms) — advice questions, not definitions or checkable facts.
- Tips: Wikipedia as a starting place; "About" pages can mislead; don't trust a sleek web design — advice, not facts.
- Manipulated images or videos — the sheet gives no definition beyond the reverse-image-search tip (carded as the tool list); named in the six trust-busters card.
- QR code / "Test your source savvy!" prompt — not content.

##### 02 Soil Health — NRCS — Soil Health (NCF Topic)  (36 cards, `text/cei_02_nrcs_soil_health.txt`)
- Soil health — NRCS Soil Health p.1
- What are the five essential functions soil performs (NRCS)? — NRCS Soil Health p.1-2
- Which soil function controls where rain, snowmelt, and irrigation water goes? — NRCS Soil Health p.1
- What in soil is responsible for filtering, buffering, degrading, immobilizing, and detoxifying materials? — NRCS Soil Health p.2
- Which three nutrients does NRCS name as stored, transformed, and cycled in the soil? — NRCS Soil Health p.2
- Besides plant roots, what do soils support and protect (NRCS)? — NRCS Soil Health p.2
- What are the four NRCS principles to manage soil for health? — NRCS Soil Health p.3
- Which three farming practices does NRCS name in soil health systems that increase organic matter? — NRCS Soil Health p.3
- What four results can Soil Health Management Systems lead to (NRCS)? — NRCS Soil Health p.3
- Why are fully functioning, healthy soils less susceptible to runoff and erosion? — NRCS Soil Health p.3
- Healthy soils provide a buffer for what (NRCS)? — NRCS Soil Health p.3
- Rhizosphere — NRCS Soil Health p.3
- Why is the rhizosphere the most active part of the soil ecosystem? — NRCS Soil Health p.3
- What provides the easiest source of food for soil microbes (NRCS)? — NRCS Soil Health p.3
- Healthy soil is dependent upon how well what is fed? — NRCS Soil Health p.3
- What four things feed the members of the soil food web (NRCS)? — NRCS Soil Health p.3
- What can tillage destroy (NRCS)? — NRCS Soil Health p.3
- What does tillage, especially during warmer months, do to water infiltration and runoff? — NRCS Soil Health p.3
- What are the four benefits of reduced till/no-till (NRCS)? — NRCS Soil Health p.3-4
- Besides tillage, what two things can disturb soil (NRCS)? — NRCS Soil Health p.4
- Which grazing system lets pasture plants rest and regrow instead of continuous grazing? — NRCS Soil Health p.4
- How can soil cover be maximized (NRCS)? — NRCS Soil Health p.4
- When are cover crops typically planted (NRCS)? — NRCS Soil Health p.4
- What cover crops does NRCS give as examples? — NRCS Soil Health p.4
- What can planting several cover crop species together in a mixture do? — NRCS Soil Health p.4
- What are the four benefits of planting cover crops between cash crop seasons (NRCS)? — NRCS Soil Health p.5
- Which deep-rooted crop creates natural water passages in soil? — NRCS Soil Health p.5
- Which cover crops serve as natural fertilizers (NRCS)? — NRCS Soil Health p.5
- What do grass cover crops do (NRCS)? — NRCS Soil Health p.5
- Which excess nutrient do cover crops trap, keeping it from leaching into groundwater or running off? — NRCS Soil Health p.5
- Which two programs offer financial assistance to start using cover crops (NRCS)? — NRCS Soil Health p.5
- Biodiversity — NRCS Soil Health p.5
- How many of the soil health management principles contribute to biodiversity (NRCS)? — NRCS Soil Health p.5
- Biodiversity helps prevent disease and pest problems associated with what? — NRCS Soil Health p.5
- What does diversity above ground improve (NRCS)? — NRCS Soil Health p.5
- What does NRCS call ultimately the key to the success of any agricultural system? — NRCS Soil Health p.5

Not carded:
- The packet PDF holds only pages 1–5 of the 11-page web print (footer "5/11"); pages 6–11 are not in the packet, so nothing from them.
- Opening line "Soil is not an inert growing medium …" — description, no single checkable answer.
- Benefit details under no-till (saving money, wildlife habitat sentences) and "NRCS can help support you …" — promotional/advice; the four benefit names are carded.
- "Soil Health Management Systems allow farmers to enjoy profits …" — general claim, not a distinct checkable fact.

##### 03 Soil Health — Noble Research Institute — Soil Health (NCF Topic)  (25 cards, `text/cei_03_noble_soil_health.txt`)
- Healthy soil drives which three things on a ranch (Noble)? — Noble Soil Health p.1
- What are the three benefits of healthy soil Noble lists? — Noble Soil Health p.3
- What are Noble's six soil health principles, in order? — Noble Soil Health p.3-9
- Know your context: what does your individual situation include (Noble)? — Noble Soil Health p.4
- Cover the soil: soil health cannot be built if the soil is what? — Noble Soil Health p.5
- What minimizes bare ground and builds soil organic matter (Noble)? — Noble Soil Health p.5
- What does mechanical soil disturbance, such as tillage, do (Noble)? — Noble Soil Health p.6
- Increasing plant diversity creates an enabling environment for what (Noble)? — Noble Soil Health p.7
- Why are actively growing living plant roots encouraged (Noble)? — Noble Soil Health p.8
- Which region evolved under the presence of animals and grazing pressure (Noble)? — Noble Soil Health p.9
- What are the four basic ecosystem processes that show visual signs of healthy soil (Noble)? — Noble Soil Health p.10
- Microbes — Noble Soil Health p.10
- What is a strong predictor of microbial activity (Noble)? — Noble Soil Health p.11
- Fields with a variety of grasses, legumes and broadleaf plants have higher levels of what? — Noble Soil Health p.11
- Which simple field test is one of the most reliable indicators of soil health (Noble)? — Noble Soil Health p.11
- Fast infiltration rates can be linked to what (Noble)? — Noble Soil Health p.11
- Which organisms does Noble name as the key players in healthy soil? — Noble Soil Health p.12
- What five things is soil biology essential to (Noble)? — Noble Soil Health p.12
- What does proper adaptive grazing do for soil and plant health (Noble)? — Noble Soil Health p.12
- What does AMP grazing stand for? — Noble Soil Health p.13
- What often-overlooked tool builds soil health by feeding hay in the field (Noble)? — Noble Soil Health p.13
- What are Noble's four first steps to building soil health? — Noble Soil Health p.14-16
- What are the two most popular biological soil tests (Noble)? — Noble Soil Health p.15
- What is Noble's five-year soil health research project called? — Noble Soil Health p.17
- The 3M project connects researchers and producers in how many states? — Noble Soil Health p.17

Not carded:
- "Achieving soil health is more about measuring improvement …" and the rancher-mindset paragraphs — opinion/advice.
- Signs of healthy soil in a pasture (canopy cover, earthworm activity, dung decomposition …) — an example list, not a defined set; the four ecosystem processes are carded.
- Bale-grazing how-to, "Open your mind" app tips, Noble's commitment, newsletter, footer address — advice/promotional.
- 3M project's three goals — long policy-style sentences; the project name and five states are carded.
- p.15 repeats the biological-test paragraph (duplicated in the PDF) — carded once.

##### 04 Organic matter serves important role in soil health — Noble — Soil Health (NCF Topic)  (28 cards, `text/cei_04_noble_organic_matter.txt`)
- Organic matter serves as a reservoir of what in the soil (Noble)? — Noble Organic Matter p.1
- Organic material — Noble Organic Matter p.3
- Organic matter — Noble Organic Matter p.3
- Humus — Noble Organic Matter p.3
- How much of organic material can disappear quickly because of decomposition? — Noble Organic Matter p.3
- About what percent of stable organic matter mineralizes yearly? — Noble Organic Matter p.3
- Which practice often makes conditions favorable for faster organic matter decomposition? — Noble Organic Matter p.3
- Approximately how much does an acre of soil measured to 6.67 inches deep weigh? — Noble Organic Matter p.3
- About how much does 1 percent organic matter in an acre of soil weigh? — Noble Organic Matter p.3
- How many pounds of organic material does it take to make 1 pound of organic matter? — Noble Organic Matter p.3
- How much organic material must be added to raise stable organic matter by 1 percent? — Noble Organic Matter p.3
- In the Upper Great Plains mixed prairie study, what were the shoot yield and root yield per acre? — Noble Organic Matter p.3
- What two reasons does Noble give for forest soils usually having low organic matter? — Noble Organic Matter p.3
- How do native organic matter levels in prairie soils compare with forest soils? — Noble Organic Matter p.3
- What are the four benefits of organic matter (Noble)? — Noble Organic Matter p.3-4
- Each 1 percent of soil organic matter releases how much nitrogen per year? — Noble Organic Matter p.3
- Each 1 percent of soil organic matter releases how much P2O5 per year? — Noble Organic Matter p.3
- Each 1 percent of soil organic matter releases how much sulfur per year? — Noble Organic Matter p.4
- Why do summer crops benefit more from organic matter mineralization than winter crops? — Noble Organic Matter p.4
- Organic matter can absorb and hold up to how much of its weight in water? — Noble Organic Matter p.4
- Compared with clay, what is the advantage of water held by organic matter? — Noble Organic Matter p.4
- A 1 percent increase in soil organic matter can add how much plant-available water per acre? — Noble Organic Matter p.4
- Permeability — Noble Organic Matter p.4
- Raising soil organic matter from 1 to 3 percent can reduce erosion by how much? — Noble Organic Matter p.4
- What are four ways to maintain or improve soil organic matter (Noble)? — Noble Organic Matter p.4-5
- How does tillage speed up the decomposition of organic matter? — Noble Organic Matter p.4
- In which soil layer is most soil organic matter found? — Noble Organic Matter p.4
- Cover crops build organic matter best when combined with what? — Noble Organic Matter p.5

Not carded:
- p.2 is blank (image page).
- "Of all the components of soil, organic matter is probably the most important and most misunderstood" — opinion.
- Erosion prevention sentence about the universal soil loss equation — the 20–33 percent figure is carded; the equation itself is not defined.
- Proper fertilization → root growth bullet — carded only as one of the four ways; no separate number.
- References list and author bio — not content.

##### 05 Hurricane Helene ravaged farmers' topsoil (Grist) — Soil Health (NCF Topic)  (49 cards, `text/cei_05_helene_topsoil.txt`)
- How big is Will Runion's cattle and hay farm in northeast Tennessee? — Helene Topsoil p.1
- Which river flooded Will Runion's farm during Hurricane Helene? — Helene Topsoil p.1
- On what date did Helene's flooding hit Will Runion's farm? — Helene Topsoil p.1-2
- How wide did the Nolichucky River swell during Helene? — Helene Topsoil p.2
- How deep were the two football-field-size holes the flood gouged in Runion's hay pastures? — Helene Topsoil p.2
- Other sections of Runion's farm were buried in up to how much sand or silt? — Helene Topsoil p.2
- How much rain did Helene drop on southern Appalachia? — Helene Topsoil p.3
- Which six states had historic flooding and landslides from Helene? — Helene Topsoil p.3-4
- Why do many mountain growers farm flood-prone bottomland? — Helene Topsoil p.4
- What was Helene's estimated damage to North Carolina's agriculture sector? — Helene Topsoil p.4
- What were Tennessee's estimated agricultural losses from Helene? — Helene Topsoil p.4
- One study found Helene's rainfall was how much heavier due to man-made climate change? — Helene Topsoil p.5
- NSF research: over the next 50 years, how will 100-year storms change? — Helene Topsoil p.5
- How long can soil take to form (Helene article)? — Helene Topsoil p.5
- Which three nutrients does the Helene article name for nourishing crops? — Helene Topsoil p.5
- No-till — Helene Topsoil p.5
- Topsoil — Helene Topsoil p.5
- Topsoil tends to make up less than how much of the entire soil profile? — Helene Topsoil p.5
- How long can topsoil take to develop (Helene article)? — Helene Topsoil p.6
- What does sand lack that soil needs (Helene article)? — Helene Topsoil p.6
- What did Runion add to his soils to control pH? — Helene Topsoil p.6
- About how much state and federal aid did Runion receive after Helene? — Helene Topsoil p.7
- How many cattle are in Runion's herd? — Helene Topsoil p.7
- In a normal year, about what share of Runion's farm income came from hay sales? — Helene Topsoil p.7
- How many experiments and test plots did soil specialist Forbes Walker set up on Runion's farm? — Helene Topsoil p.7
- Which five soil amendments is Walker testing? — Helene Topsoil p.7
- Walker's amendment trials test the growth of which two crops? — Helene Topsoil p.7
- Biochar — Helene Topsoil p.7
- Triple 19 — Helene Topsoil p.7
- In 2021, atmospheric rivers caused devastating floods where? — Helene Topsoil p.8
- Since 1980, how many U.S. flooding events caused over $1 billion in damages each? — Helene Topsoil p.9
- One study found nearly how many flash floods in the contiguous U.S. from 1996 to 2017? — Helene Topsoil p.9
- What two causes are predicted to raise flooding frequency and strength? — Helene Topsoil p.9
- Why does climate change lead to stronger rain events (Helene article)? — Helene Topsoil p.9
- Weather whiplash — Helene Topsoil p.9
- In 2011, which river flooded thousands of acres of Upper Midwest farmland? — Helene Topsoil p.9
- After the 2011 Missouri River flood, fields were covered with how much sand? — Helene Topsoil p.9
- After the 2011 flood, which two levels did John Wilson find low in flooded soils? — Helene Topsoil p.9
- How many farms does North Carolina have, per its strategic plan for agriculture? — Helene Topsoil p.10
- A coastal North Carolina study found what in the soil after a storm? — Helene Topsoil p.10
- What is coastal flooding driving into farmland soil? — Helene Topsoil p.10
- On which river is Nicole DelCogliano's farm near Asheville? — Helene Topsoil p.11
- Which cover crop did DelCogliano sow after Helene, to protect soil from erosion? — Helene Topsoil p.11
- Farmers should expect at least how many years of cover cropping before seeing results (Blaedow)? — Helene Topsoil p.12
- Which two amendments provide nitrogen and phosphorus, respectively? — Helene Topsoil p.12
- Unlike sand, which flood deposit carries nutrients and creates a positive growing environment? — Helene Topsoil p.13
- Of the 220 acres that were underwater, about how many did Runion prepare to plant? — Helene Topsoil p.13
- In Walker's preliminary results, grasses grew better in plots with which amendment? — Helene Topsoil p.14
- What can wood chips do as they break down in the soil? — Helene Topsoil p.14

Not carded:
- Personal story details (fiancée, campground office house, music venue plans, sink at the farmers market, square bales) and every quote of feelings ("looked just like a lake", "We're dirt farmers", "The clock has been reset") — opinion/story, not checkable facts.
- Runion's "four- to five-year" recovery estimate — his guess, not a fact.
- Crop-planting acreage details for DelCogliano (6 acres → 4 acres, crops two weeks late) — story detail; skipped as low value. Can be added if wanted.
- Repeat floods in central California, Mississippi River 2019, upper Midwest 2024, Texas 2025 — named events without a single checkable number each; weather whiplash (Texas 2025 example) carded as a term.
- NC farm income split (8,000 farms > $100,000; 23,400 < $10,000; ~40% positive net income) — only the 42,500 total carded, to keep one answer per front; more could be added.
- Federal funding cuts sentence — political statement, skipped.

##### 06 Look for These Soil Health Indicators in the Field — Noble — Soil Health (NCF Topic)  (33 cards, `text/cei_06_noble_indicators.txt`)
- Which event of the 1930s changed our perception of how we view soil? — Noble Soil Indicators p.2
- Who wrote A Sand County Almanac (1949)? — Noble Soil Indicators p.2
- What three tools do you need to use Noble's soil health indicators in the field? — Noble Soil Indicators p.3
- What are Noble's seven soil health indicators, in order? — Noble Soil Indicators p.4-10
- What is bare soil a sign of (Noble)? — Noble Soil Indicators p.4
- What is the simplest way to evaluate soil cover? — Noble Soil Indicators p.4
- What is the best way for soil to be covered (Noble)? — Noble Soil Indicators p.4
- In general, what does darker soil color mean? — Noble Soil Indicators p.5
- Where in the soil profile is soil typically darkest? — Noble Soil Indicators p.5
- Who first standardized the soil color system? — Noble Soil Indicators p.5
- What are the three components of the Munsell soil color system? — Noble Soil Indicators p.5
- Soil structure — Noble Soil Indicators p.6
- Pore space — Noble Soil Indicators p.6
- Soil aggregates — Noble Soil Indicators p.6
- What does more pore space allow? — Noble Soil Indicators p.6
- Aggregate stability — Noble Soil Indicators p.6
- What is a primary driver of aggregate stability? — Noble Soil Indicators p.6
- Soil texture — Noble Soil Indicators p.6
- Why is it more difficult for sandy soils to build soil structure? — Noble Soil Indicators p.7
- What three things do earthworm burrows do for the soil? — Noble Soil Indicators p.7
- Castings — Noble Soil Indicators p.7
- Earthworm castings contain significant amounts of which three nutrients? — Noble Soil Indicators p.7
- Dung beetles are found on every continent except which one? — Noble Soil Indicators p.7
- Plow pan — Noble Soil Indicators p.8
- "J" rooting — Noble Soil Indicators p.8
- Geosmin — Noble Soil Indicators p.9
- In what year did American scientists isolate the primary odor of soil (geosmin)? — Noble Soil Indicators p.9
- The name geosmin comes from which two Greek words? — Noble Soil Indicators p.9
- What does a rotten egg or sulfur smell in soil often signal? — Noble Soil Indicators p.9
- Soil can be eroded by which two forces? — Noble Soil Indicators p.10
- Signs of wind erosion can often be seen by looking for what (Noble)? — Noble Soil Indicators p.10
- Signs of water erosion can be seen by looking for what (Noble)? — Noble Soil Indicators p.10
- How many Tier 1 indicators of soil health does the Soil Health Institute endorse? — Noble Soil Indicators p.11-12

Not carded:
- Soil health definition on p.1 is the same as NRCS p.1 — carded once (NRCS).
- Aldo Leopold quotes — quotations/opinion; only the author/book fact is carded.
- Munsell history (industry use, USDA adoption, Munsell Soil Color Book) — partly carded (who standardized it, three components).
- Reduced iron and manganese dark color note; cation/clay aggregation sentence; organic adhesives — details without a clean single answer.
- The 19 Tier 1 indicators list — too long for one card back; the count (19) and the organization are carded.
- Author bios (Jeff Goodwin, Jim Johnson) — not content.

##### 07 Polluted Flowers Smell Less Sweet to Pollinators (NYT) — Air Quality  (21 cards, `text/cei_07_nyt_pollinators.txt`)
- Which flower and which pollinators did the air pollution scent study focus on? — NYT Pollinators p.1
- Which compounds, which can be abundant in nighttime urban air, severely degrade the pale evening primrose's scent? — NYT Pollinators p.1
- In which journal did researchers report the primrose and hawk moth study? — NYT Pollinators p.1
- What two effects on plants could the sensory pollution have (NYT)? — NYT Pollinators p.1
- Which atmospheric chemist at the University of Washington was an author of the primrose study? — NYT Pollinators p.1
- Who was the lead author of the primrose and hawk moth study? — NYT Pollinators p.2
- When do the pale evening primrose's flowers open? — NYT Pollinators p.3
- How many distinct chemical components did scientists find in the primrose scent? — NYT Pollinators p.3
- Hawk moths were especially sensitive to which group of scent compounds? — NYT Pollinators p.3
- What do monoterpenes also give conifers? — NYT Pollinators p.3-4
- Which two pollutants did researchers add to the simulated primrose scent? — NYT Pollinators p.4
- Ozone and nitrate radicals can form when pollutants from what enter the atmosphere? — NYT Pollinators p.4
- Which pollutant forms in the presence of sunlight and is abundant during the day? — NYT Pollinators p.4
- Which pollutant is degraded by sunlight and more dominant at night? — NYT Pollinators p.4
- Adding ozone dropped two key monoterpenes by roughly how much? — NYT Pollinators p.4
- Nitrate radicals reduced the key moth attractants by as much as how much? — NYT Pollinators p.4
- In the wind tunnel, how much did tobacco hawk moth flower visits drop with nitrate-degraded scent? — NYT Pollinators p.5
- In the wind tunnel, what did white-lined sphinx moths do with nitrate-degraded scent? — NYT Pollinators p.5
- What effect did adding ozone alone have on the moths' behavior? — NYT Pollinators p.5
- In the wild, how many fewer hawk moth visits did pollution-degraded flowers get in a night? — NYT Pollinators p.5
- In many cities, pollution has reduced scent-detection distances by how much since the preindustrial age? — NYT Pollinators p.5

Not carded:
- Opinion quotes ("They're as good as a dog …", "almost completely gone", "profound role") — skipped.
- Jeff Riffell (co-leader, sensory neurobiologist) — named; not carded to keep the people cards to the author and lead author. Can be added.
- Article date (Feb. 8, 2024) and reporter (Emily Anthes) — byline metadata, not carded.

##### 08 DOI announces new U.S. Wildland Fire Service (NACo) — Forest Management / Fire  (15 cards, `text/cei_08_naco_wildland_fire.txt`)
- On what date did DOI announce the official establishment of the U.S. Wildland Fire Service? — NACo Wildland Fire p.2
- Which federal department created the U.S. Wildland Fire Service (USWFS)? — NACo Wildland Fire p.2
- Who is the U.S. Wildland Fire Service's first Fire Chief? — NACo Wildland Fire p.2
- Which fire agency did Brian Fennessy previously head? — NACo Wildland Fire p.2
- Which agency oversees most wildfire operations at the federal level? — NACo Wildland Fire p.2
- On what date did DOI and USDA announce joint wildfire directives, including creating the USWFS? — NACo Wildland Fire p.3
- Which executive order did President Trump sign on June 12 about wildfire? — NACo Wildland Fire p.3
- The U.S. Forest Service (USFS) is under which department? — NACo Wildland Fire p.3
- Who is the Secretary of Agriculture named in the NACo article? — NACo Wildland Fire p.3
- Who is the Interior Secretary named in the NACo article? — NACo Wildland Fire p.3
- Under Rollins's order, the Forest Service fire leadership reports to whom? — NACo Wildland Fire p.3
- By what date were DOI land management agencies to create a consolidation plan? — NACo Wildland Fire p.4
- Wildland fire prediction and research entities are consolidated into what? — NACo Wildland Fire p.4
- Which two agencies are designated the two major federal wildland firefighting agencies? — NACo Wildland Fire p.4
- Who are the frontline emergency service providers in wildfire response on federal lands (NACo)? — NACo Wildland Fire p.4

Not carded:
- The DOI appropriations-bill sentence and "Impact on counties" opinion paragraphs — policy commentary.
- The list of five collaboration efforts — only the Fire Intelligence Center item has a single checkable answer; the others are general.
- Article authors (Zeke Lee, Andrew Nober) — byline metadata.
- Years: the article gives "January 12", "September 15", "June 12", "Oct. 31" without years (dateline is Jan 13, 2026), so the cards give the dates as printed.

##### 09 Wildlife on Public Lands: 7 Species (NCWF) — Wildlife Management  (38 cards, `text/cei_09_ncwf_public_lands.txt`)
- How much public land does North Carolina have? — NCWF Public Lands p.2
- What are the seven species in NCWF's Wildlife on Public Lands article? — NCWF Public Lands p.2-4
- What is the world's most endangered wild canid? — NCWF Public Lands p.2
- Red wolf · scientific name — NCWF Public Lands p.2
- In what year was the red wolf declared extinct in the wild? — NCWF Public Lands p.2
- Red wolves were reintroduced to which national wildlife refuge? — NCWF Public Lands p.2
- Which refuge, established in the early 1990s, was added to the red wolf reintroduction? — NCWF Public Lands p.2
- Prey for the Pack works with landowners on which peninsula? — NCWF Public Lands p.2
- Prey for the Pack landowners can receive up to what financial cost-share? — NCWF Public Lands p.2
- Cerulean warbler · scientific name — NCWF Public Lands p.2
- Cerulean warbler · habitat — NCWF Public Lands p.2
- Which two national forests does NCWF name as providing some of the last remaining continuous forest cover for breeding cerulean warblers? — NCWF Public Lands p.2
- Cerulean warblers are highly sensitive to which two threats? — NCWF Public Lands p.2
- Which 16,000-acre portion of Pisgah National Forest is being monitored for cerulean warblers? — NCWF Public Lands p.3
- Eastern black rail · scientific name — NCWF Public Lands p.3
- Eastern black rail · federal status — NCWF Public Lands p.3
- Eastern black rail · habitat — NCWF Public Lands p.3
- By how much is the eastern black rail population declining each year? — NCWF Public Lands p.3
- How large a block of shallow water and hummocks is being created for black rails at Pocosin Lakes? — NCWF Public Lands p.3
- What ditch system is being installed in the Pungo Unit for black rail habitat? — NCWF Public Lands p.3
- Loggerhead sea turtle · scientific name — NCWF Public Lands p.3
- Loggerhead sea turtle · federal status — NCWF Public Lands p.3
- Which three public coastal areas does NCWF name for loggerhead nesting? — NCWF Public Lands p.3
- Which four threats does NCWF name as examples that loggerheads are highly vulnerable to during nesting season? — NCWF Public Lands p.3
- Saint Francis satyr · scientific name — NCWF Public Lands p.3
- Saint Francis satyr · federal status — NCWF Public Lands p.3
- The Saint Francis satyr's entire known population exists almost exclusively on which U.S. Army installation? — NCWF Public Lands p.3
- Saint Francis satyr · habitat — NCWF Public Lands p.3-4
- Which military land practice has helped preserve the Saint Francis satyr's habitat? — NCWF Public Lands p.4
- Eastern hellbender · scientific name — NCWF Public Lands p.4
- Eastern hellbender · what kind of animal — NCWF Public Lands p.4
- Eastern hellbender · habitat — NCWF Public Lands p.4
- Eastern hellbenders are extremely vulnerable to which three threats? — NCWF Public Lands p.4
- The U.S. Fish and Wildlife Service has proposed listing the eastern hellbender as what? — NCWF Public Lands p.4
- The WRC works with which partner to propagate eastern hellbenders at fish hatcheries? — NCWF Public Lands p.4
- Hickory Nut Gorge green salamander · scientific name — NCWF Public Lands p.4
- Hickory Nut Gorge green salamander · how it breathes — NCWF Public Lands p.4
- Which two protected areas does NCWF name in Hickory Nut Gorge green salamander habitat? — NCWF Public Lands p.4

Not carded:
- General public-trust / habitat-connectivity paragraph — description, no checkable answer.
- Wildlife crossings near ARNWR, loggerhead proposed conservation efforts list, hickory nut gorge conservation-efforts list — long lists of actions; skipped.
- Cerulean warbler status "species of concern" — not carded separately (kept front count down); can be added.
- Hellbender status after Hurricane Helene "still unclear" — not a checkable fact.

##### 10 How Louisiana built a coastal vegetation restoration model (NASCA) — Wildlife Management  (16 cards, `text/cei_10_nasca_louisiana.txt`)
- Since what year has Louisiana's Coastal Vegetative Planting Program run? — NASCA Louisiana p.1
- What is Louisiana's Coastal Vegetative Planting Program designed to do? — NASCA Louisiana p.1
- About how much coastal wetland has Louisiana lost during the past century? — NASCA Louisiana p.1
- Louisiana's program supports up to how many linear miles of vegetative planting each year? — NASCA Louisiana p.2
- Which three problems were reshaping Louisiana's coast? — NASCA Louisiana p.2
- What three things can living vegetation do on a shoreline (NASCA)? — NASCA Louisiana p.3
- When did Louisiana formalize its coastal vegetative planting partnership? — NASCA Louisiana p.3
- In Louisiana's program, which agency provides funding? — NASCA Louisiana p.3
- In Louisiana's program, which agency supplies technical support? — NASCA Louisiana p.3
- In Louisiana's program, who administers the program? — NASCA Louisiana p.3
- In Louisiana's program, who works directly with landowners? — NASCA Louisiana p.3
- Which four factors help decide whether shoreline planting is appropriate (NASCA)? — NASCA Louisiana p.4
- Which NRCS center developed native stock for Louisiana's coastal plantings? — NASCA Louisiana p.4
- What sometimes worked better than containerized plants in Louisiana's plantings? — NASCA Louisiana p.4
- Which two field practices were refined as Louisiana's planting results accumulated? — NASCA Louisiana p.5
- About how many linear miles has the Louisiana Coastal Vegetation Program planted coastwide to date? — NASCA Louisiana p.5

Not carded:
- All quotes from Joey Breaux, Greg Grandy, Tim Allen ("band-aid", "stop the bleeding", "It's just beauty") — opinion.
- "Only one cultivar suitable at the time" — quote-only, skipped.
- Transferability-to-other-states paragraphs — general claims.

##### 11 Silent Killers – 10 Pollutants (NCWF) — Wildlife Management  (33 cards, `text/cei_11_ncwf_silent_killers.txt`)
- Toxic substance (toxin) — NCWF Silent Killers p.2
- Pollutant — NCWF Silent Killers p.2
- Toxins and pollutants: which statement does NCWF give about how they relate? — NCWF Silent Killers p.2
- Bioaccumulation — NCWF Silent Killers p.2
- Biomagnification — NCWF Silent Killers p.2
- Biomagnification played a major role in the harmful effects of which chemical on fish-eating birds of prey? — NCWF Silent Killers p.2
- Where are higher concentrations of lead mined for human use generally found? — NCWF Silent Killers p.2
- What are the three naturally occurring toxic elements NCWF names? — NCWF Silent Killers p.2-3
- Which four products does NCWF name as examples that lead remains present in? — NCWF Silent Killers p.2
- Which natural and human activities release mercury (NCWF)? — NCWF Silent Killers p.3
- What is the ultimate result of chronic mercury toxicosis in wildlife? — NCWF Silent Killers p.3
- Overuse of nitrogen and phosphorus comes primarily from which three sources? — NCWF Silent Killers p.3
- Eutrophication — NCWF Silent Killers p.3
- Dead zones — NCWF Silent Killers p.3
- Synthetic pollutants — NCWF Silent Killers p.3
- What are the seven synthetic/human-made pollutants NCWF names? — NCWF Silent Killers p.3-5
- What do plastic bottles shed as they degrade? — NCWF Silent Killers p.3
- What materials does litter often consist of (NCWF)? — NCWF Silent Killers p.3
- Endocrine-disrupting chemicals (EDCs) — NCWF Silent Killers p.4
- Which three natural hormones can endocrine disruptors mimic, block, or interfere with? — NCWF Silent Killers p.4
- Which three types of pesticides impair the foraging and health of pollinators? — NCWF Silent Killers p.4
- What are herbicides used for? — NCWF Silent Killers p.4
- How do pharmaceuticals often enter the environment? — NCWF Silent Killers p.4
- Synthetic estrogens may be linked to what in fish? — NCWF Silent Killers p.4
- Which drugs can disrupt feeding behaviors in aquatic animals? — NCWF Silent Killers p.4
- PFAS (forever chemicals) — NCWF Silent Killers p.5
- Which four kinds of products does NCWF say contain PFAS? — NCWF Silent Killers p.5
- Which three industrial chemicals does NCWF name as highly toxic? — NCWF Silent Killers p.5
- What does PCB stand for? — NCWF Silent Killers p.5
- Agricultural sludge (biosolids) — NCWF Silent Killers p.5
- What kind of bacteria can sludge introduce, threatening wildlife and human health? — NCWF Silent Killers p.5
- Instead of flushing pharmaceuticals, what should you use? — NCWF Silent Killers p.5
- What kind of ammunition and fishing tackle does NCWF advise, to protect birds and aquatic life? — NCWF Silent Killers p.5

Not carded:
- Intro paragraphs about pollution being impossible to ignore — opinion.
- Lead toxicosis effects list, mercury effects list, PCB/dioxin effect lists — long lists of symptoms; the end result of mercury toxicosis is carded.
- Dabbling duck (bioaccumulation) and osprey (biomagnification) examples — examples inside the definitions; not carded separately.
- Herbicide EDC paragraph, litter harms paragraph — general.
- Prevention list: only the two items with a single answer (drug take-back, lead-free ammunition/tackle) carded.
- References list — not content.

#### (b) Test check — 2026 Southern Piedmont (Area 8) MS CEI test

The 2026 test is on 2026's theme (Non-Point Source Pollution articles). Only "Is It Legit" is in both packets. Questions referred to by number + topic only.

1. Senate bill after Helene (prescribed fire act) — no card — 2026 topic, not in the 2027 packet
2. Groups sensitive to air pollution (AQI article) — no card — 2026 topic, not in the 2027 packet
3. Practices to avoid waterbody pollution ("After the Storm") — no card — 2026 topic, not in the 2027 packet
4. Landscape architects' stormwater strategies (video) — no card — 2026 topic, not in the 2027 packet
5. Bioretention example (video) — no card — 2026 topic, not in the 2027 packet
6. Most effective wildfire management (prescribed fire act) — no card — 2026 topic, not in the 2027 packet. (The 2027 NACo article covers the new U.S. Wildland Fire Service, not prescribed fire effectiveness.)
7. Footprint Project disaster help (solar microgrids) — no card — 2026 topic, not in the 2027 packet
8. Meaning of "baiting"/clickbait (Is It Legit) — card: Clickbait tactics
9. Signs of credible news sources (Is It Legit) — card: What do credible news sources do about mistakes? · In what form are a news source's standards often made public? · Which ethical standards do reputable news organizations aspire to? · State-run or state-sponsored propaganda · Lack of balance
10. AQI color for hazardous (AQI article) — no card — 2026 topic, not in the 2027 packet
11. Haze pollutant also called PM2.5 (AQI article) — no card — 2026 topic, not in the 2027 packet
12. Which pollutants settle in days (AQI article) — no card — 2026 topic, not in the 2027 packet
13. Name of pre-hurricane rain events (Helene rainfall article) — no card — fact not in the 2027 packet (the 2027 Helene article is about topsoil and does not name these rain events)
14. Laurel wilt description (NC Forest Service) — no card — 2026 topic, not in the 2027 packet
15. Blue Ridge Parkway Helene damage count (briefing video) — no card — 2026 topic, not in the 2027 packet
16. Engineered slope system (briefing video) — no card — 2026 topic, not in the 2027 packet
17. Falls Lake eutrophication cause (Safeguarding Water) — no card — 2026 topic, not in the 2027 packet. (Eutrophication itself is carded from NCWF Silent Killers: Eutrophication.)
18. Proper stormwater management practices ("After the Storm") — no card — 2026 topic, not in the 2027 packet
19. Falls Lake cost-effective practices (Safeguarding Water) — no card — 2026 topic, not in the 2027 packet
20. Climate change and Helene's rainfall (Helene rainfall article) — card: One study found Helene's rainfall was how much heavier due to man-made climate change? (the 2027 Helene Topsoil article p.5 states the 10 percent figure)


---

## Stage 0 — General concepts (MS Appendix)


The Appendix has no Learning Objectives sheet and no 2026 Area 8 test, so this lists each Appendix section (its own heading, in order) with the card fronts made from it. Glossary-sourced term cards are marked (Glossary p.N); every other card cites the Appendix page.

#### 1. The Biosphere
**General Concepts · Terms**
- Biosphere — MS Appendix p.1
- Ecosystem (Glossary p.9)
- Organism (Glossary p.20)
- Atmosphere — MS Appendix p.1
- Gas (Glossary p.13)
- Hydrosphere — MS Appendix p.1
- Freshwater (Glossary p.12)
- Saltwater (Glossary p.25)
- Glacier (Glossary p.13)
- Lithosphere — MS Appendix p.1
- Rock (Glossary p.24)
- Soil (Glossary p.27)
- Food chain (Glossary p.12)
- Biogeochemical cycles — MS Appendix p.1
- Interaction (Glossary p.16)
**General Concepts · Facts**
- What three parts of the earth does every organism depend on? — MS Appendix p.1
- What does the atmosphere provide for animals, and what does it provide for plants? — MS Appendix p.1
- Besides providing gases, what two things does the atmosphere play an important role in? — MS Appendix p.1
- What must all life on earth have to survive? — MS Appendix p.1
- What is the base of the food chain on land? — MS Appendix p.1
- What four things do plants depend on soil for? — MS Appendix p.1
- Figures: p.1 figure (Atmosphere / Hydrosphere / Lithosphere around Biosphere) is an image — its labels repeat the text; no extra cards.

#### 2. The Water Cycle
**General Concepts · Terms**
- Water cycle — MS Appendix p.2
- Evaporation — MS Appendix p.2
- Transpiration — MS Appendix p.2
- Evapotranspiration — MS Appendix p.2
- Condensation — MS Appendix p.2
- Precipitation — MS Appendix p.2
- Infiltration — MS Appendix p.2
- Groundwater (Glossary p.14)
- Percolation — MS Appendix p.2
- Porous (Glossary p.22)
- Surface runoff — MS Appendix p.2
- Sublimation — MS Appendix p.2
- Deposition (water cycle) — MS Appendix p.2
- Mineral (Glossary p.18)
- Organic matter (Glossary p.20)
- Environment (Glossary p.10)
**General Concepts · Facts**
- What is another name for the water cycle? — MS Appendix p.2
- What does the water cycle continually renew? — MS Appendix p.2
- From what four places does water leave by evaporation? — MS Appendix p.2
- As water vapor rises in the atmosphere, what happens to the temperature? — MS Appendix p.2
- In what four forms can precipitation fall? — MS Appendix p.2
- Where does sublimation occur more? — MS Appendix p.2
- What are two examples of deposition in the water cycle? — MS Appendix p.2
- What does the water cycle carry into freshwater bodies such as streams and lakes? — MS Appendix p.2
- When water evaporates, what stays behind? — MS Appendix p.2
- Is water that precipitates from the atmosphere freshwater or saltwater? — MS Appendix p.2
- What three states does water keep changing between in the water cycle? — MS Appendix p.2
- How long may groundwater stay in the ground? — MS Appendix p.2
- How old are the ice cores scientists have measured from glaciers? — MS Appendix p.2
- What is the source of energy that powers the water cycle? — MS Appendix p.2
- Which desert does the Appendix name as a dry place where the water cycle still takes place? — MS Appendix p.2
- Figures: The USGS water cycle diagram (printed on p.1 under "The Water Cycle": e.g. Snowmelt runoff, Streamflow, Seepage, Spring, Fog drip, Dew, Groundwater storage, Volcanic steam) is an image — no cards from its labels.

#### 3. Photosynthesis and Respiration
**General Concepts · Terms**
- Photosynthesis — MS Appendix p.3
- Algae (Glossary p.1)
- Respiration — MS Appendix p.3
**General Concepts · Facts**
- What two processes give organisms the food and energy necessary for life? — MS Appendix p.3
- Which three kinds of organisms use the sun's light energy to make food? — MS Appendix p.3
- How are photosynthesis and respiration related to each other? — MS Appendix p.3
- Figures: p.3 photosynthesis/respiration diagram (chloroplast, mitochondrion) and the PHOTOSYNTHESIS equation graphic (CO2 + H2O, light, C6H12O6 + O2) are images — no cards.

#### 4. Oxygen-Carbon Dioxide Cycle
**General Concepts · Terms**
- Oxygen-carbon dioxide cycle — MS Appendix p.4
- Pore spaces (Glossary p.22)
- Decomposer — MS Appendix p.4
**General Concepts · Facts**
- In photosynthesis, which gas do plants use and which gas do they produce? — MS Appendix p.4
- In respiration, which gas do organisms use and which gas do they give off? — MS Appendix p.4
- Where do plants get the oxygen they need? — MS Appendix p.4
- How does oxygen from the atmosphere get into the soil? — MS Appendix p.4
- Figures: p.4 cow/plant oxygen-carbon dioxide figure is an image — its labels repeat the text; no extra cards.

#### 5. The Carbon Cycle
**General Concepts · Terms**
- Carbon cycle — MS Appendix p.4
**General Concepts · Facts**
- Living things need carbon for what two things? — MS Appendix p.4
- What two components can the carbon cycle be divided into? — MS Appendix p.4
- On what timescale does the geological carbon cycle operate? — MS Appendix p.4
- On what timescale does the biological carbon cycle operate? — MS Appendix p.4
- Figures: p.4 carbon cycle diagram (e.g. Deforestation, Burning fossil fuels, Diffusion, Compaction) is an image — no cards.

#### 6. The Nitrogen Cycle
**General Concepts · Terms**
- Nitrogen-fixing bacteria — MS Appendix p.5
- Bacteria (Glossary p.3)
- Legume — MS Appendix p.5
- Aquatic (Glossary p.2)
- Decomposition — MS Appendix p.5
- Inorganic — MS Appendix p.5
**General Concepts · Facts**
- What percent of our atmosphere is nitrogen? — MS Appendix p.5
- Can most organisms use nitrogen straight from the atmosphere? — MS Appendix p.5
- Where do plants get the nitrogen they need? — MS Appendix p.5
- How do organisms other than plants get the nitrogen they need? — MS Appendix p.5
- What three ways can nitrogen be fixed to or fall on the soil naturally? — MS Appendix p.5
- Which three plants does the Appendix give as examples of legumes? — MS Appendix p.5
- What are important nitrogen-fixing bacteria in aquatic environments? — MS Appendix p.5
- Nitrogen also enters the soil when decomposers break down what two things? — MS Appendix p.5
- What adds nitrogen to soil and water artificially? — MS Appendix p.5
- Figures: p.5 nitrogen cycle diagram (Nitrogen fixation, Ammonification, Nitrification, Assimilation, Denitrification, Ammonia NH3, Nitrates NO3) is an image — no cards.

#### 7. Energy in Ecosystems
**General Concepts · Terms**
- Energy — MS Appendix p.6
- Biological work — MS Appendix p.6
- Tissue (Glossary p.30)
**General Concepts · Facts**
- What is the only form of energy that continuously enters earth's ecosphere? — MS Appendix p.6
- What powers the weather and the atmosphere's circulation? — MS Appendix p.6
- What two things about an area play a role in breaking down rocks to form soil? — MS Appendix p.6
- Where do animals get their nutrients? — MS Appendix p.6
- Can energy be created or destroyed? — MS Appendix p.6
- When energy changes form, how is some of it lost? — MS Appendix p.6
- Do animals that eat plants get all the energy the plants got from their food? — MS Appendix p.6
- Figures: p.6 energy figure (producers, consumers, decomposers, inorganic nutrient pool, heat) is an image — no cards.

#### 8. Taxonomy
**General Concepts · Terms**
- Taxonomy — MS Appendix p.6
- Species (Glossary p.28)
**General Concepts · Facts**
- In taxonomy, what fundamental characteristic does the Appendix give as where grouping begins? — MS Appendix p.6
- In taxonomy, what happens to the groups as characteristics become more specific? — MS Appendix p.6
- Taxonomic classifications are typically based on what two things? — MS Appendix p.6
- What two names is each species given? — MS Appendix p.6
- What naming system does a scientific name use? — MS Appendix p.6
- What scientific name does the Appendix give as its example of binomial nomenclature? — MS Appendix p.6
- Figures: p.6 taxonomy figure (ranks Species, Genus, Family, Order, Class, Phylum, Kingdom, Domain; black bear example Ursus americanus, Ursus, Ursidae, Carnivora, Mammalia, Chordata, Animalia, Eukarya) is an image — NO card: the ranks are not in the text layer, so no quote can be checked. See general_notes.md.

#### Test check
No 2026 Area 8 test exists for the Appendix (it is not its own station); the station agents' test checks cover any Appendix facts that their tests ask.
