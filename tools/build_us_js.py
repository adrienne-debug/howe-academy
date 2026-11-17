#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_us_js.py — builds the United States Path's data and pictures (PLAN_us_unit_2026-11-16.md §3, §6 and §9 slice 1
USDATA; her approval 2026-11-17: "great on the us", "buil the us").

Writes three lazy files beside index.html:
    us.js          the unit's 10 stages, 11 decks and 370 cards (names, backs, families, order), what picture each card
                   gets, the battle-pin coordinates, every picture's credit, and the map from the 2025 USCIS civics
                   questions to the cards that teach them — plus a small runtime (tools/us_runtime.js) that draws the
                   flag, holiday, civics and amendment pictures and, with geo.js loaded, the 13-colony maps and battle pins.
    us_pics_1.js   the photos for Stages 1–4 (symbols, the five presidents every kid knows, famous Americans, the
                   government buildings and the Constitution) as small JPEG data URIs.
    us_pics_2.js   the photos for Stages 5–9 (presidents, founders, history scenes, documents).

The photos come from Wikimedia Commons files whose licence is Public domain, CC0 or CC BY (never BY-SA), each kept
with its author, licence and file page for the credit line (plan §6.1). Faces are never invented (§6.2): a person with
no authentic likeness gets a drawn badge.

    python3 tools/build_us_js.py --resolve            # once: look up every photo's licence + URL → tools/us_pics.json
    python3 tools/build_us_js.py --cache <folder>     # build (downloads each photo once into <folder>; not committed)

Needs Python 3 + Pillow (photo crop/resize) and node (to read the built-in U.S. History backs from index.html and the
presidents list from notebooks.js, so the unit's copies are byte for byte the app's). Nothing here touches the app's
database.
"""
import argparse, base64, tempfile, hashlib, io, json, math, os, re, subprocess, sys, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS = os.path.join(ROOT, "tools")
MANIFEST = os.path.join(TOOLS, "us_pics.json")
UA = {"User-Agent": "HoweAcademyBuild/1.0 (homeschool app build script)"}

# ───────────────────────────── stages and decks (plan §0, §5) ─────────────────────────────
STAGES = [
    {"n": 1, "label": "Symbols of America", "emoji": "🇺🇸", "weeklyFrom": 0},
    {"n": 2, "label": "Holidays & presidents to know", "emoji": "🎆", "weeklyFrom": 0, "readyAt": 14},
    {"n": 3, "label": "Famous Americans", "emoji": "⭐", "weeklyFrom": 0, "readyAt": 21},
    {"n": 4, "label": "How our government works", "emoji": "🏛", "weeklyFrom": 0, "readyAt": 27},
    {"n": 5, "label": "Colonies, Revolution & Constitution", "emoji": "📜", "weeklyFrom": 0, "readyAt": 33},
    {"n": 6, "label": "The Bill of Rights & all 27 amendments", "emoji": "⚖️", "weeklyFrom": 0, "readyAt": 26},
    {"n": 7, "label": "Presidents in order", "emoji": "🎩", "weeklyFrom": 0, "readyAt": 42},
    {"n": 8, "label": "A growing nation & the Civil War", "emoji": "🗺", "weeklyFrom": 0, "readyAt": 22},
    {"n": 9, "label": "America in the world, 1865–today", "emoji": "🌎", "weeklyFrom": 0, "readyAt": 23},
    {"n": 10, "label": "The citizen's test", "emoji": "🗳", "weeklyFrom": 0, "readyAt": 110},
]
# key, mode, introCap — in the order the record lists them
DECKS = [
    ("American Symbols", "flash", 2), ("American Holidays", "flash", 2), ("Famous Presidents", "flash", 2),
    ("Famous Americans", "flip", 2), ("Civics", "flip", 3), ("13 Colonies", "flash", 3), ("U.S. History", "flip", 3),
    ("American Battles", "flip", 3), ("Amendments", "flip", 3), ("Presidents", "flip", 3), ("Civics Test", "flip", 3),
]
BUILTIN = "B"   # a def of BUILTIN = the built-in U.S. History back, read from index.html's MAST_VOCAB_DEFS

# ───────────────────────────── the cards (plan Appendices A–H) ─────────────────────────────
# (deck, stage, family, name, def, pic)  — pic: "photo:<id>" | "flag" | "pledge" | "anthem" | "holiday:<k>" | "icon:<k>"
#   | "amend:<n>" | "branch:<L|E|J|C>" | "level:<federal|state|local>" | "chamber:<n>" | "colony:<state>" | "pin:<id>" | "badge:<id>"
# Flash decks carry no def (the kid says what she sees; a def would make the stock enroll write a back) — their kid
# meaning rides as "about" for the notebook and a later flip pass.
CARDS = []
def C(deck, stage, family, name, d=None, pic=None, about=None, more=None, changes=False):
    CARDS.append({"deck": deck, "stage": stage, "family": family, "name": name, "def": d, "pic": pic, "about": about, "more": more, "changes": changes})

# Stage 1 · American Symbols (flash, 11)
for fam, rows in [
    ("Our flag and our bird", [("American flag", "flag", "our flag — 13 stripes for the first 13 colonies, 50 stars for the 50 states"),
                               ("bald eagle", "photo:bald eagle", "our national bird")]),
    ("Famous places", [("Statue of Liberty", "photo:Statue of Liberty", "a gift from France, in New York Harbor"),
                       ("Liberty Bell", "photo:Liberty Bell", "rang in Philadelphia for freedom; it has a crack"),
                       ("White House", "photo:White House", "where the President lives and works"),
                       ("the Capitol", "photo:the Capitol", "where Congress makes the laws")]),
    ("Monuments", [("Mount Rushmore", "photo:Mount Rushmore", "four presidents carved in a mountain"),
                   ("Washington Monument", "photo:Washington Monument", "a tall stone tower for George Washington"),
                   ("Lincoln Memorial", "photo:Lincoln Memorial", "a giant statue of Abraham Lincoln")]),
    ("Say it with your hand on your heart", [("Pledge of Allegiance", "pledge", "a promise to be loyal to our flag and country"),
                                              ("national anthem", "anthem", "“The Star-Spangled Banner”")]),
]:
    for n, p, a in rows: C("American Symbols", 1, fam, n, None, p, a)

# Stage 2 · American Holidays (flash, 11) — the 11 federal holidays (5 U.S.C. §6103), calendar order
for fam, rows in [
    ("Winter", [("New Year's Day", "the start of a new year · January"),
                ("Martin Luther King Jr Day", "a leader who worked for fair laws for everyone · January"),
                ("Presidents' Day", "George Washington's birthday and all our presidents · February")]),
    ("Summer", [("Memorial Day", "remembering soldiers who died for our country · May"),
                ("Juneteenth", "the day in 1865 the last enslaved people in Texas learned they were free · June"),
                ("Independence Day", "our country's birthday, July 4, 1776 · July"),
                ("Labor Day", "honoring workers · September")]),
    ("Fall and December", [("Columbus Day", "Columbus reached the Americas in 1492 · October"),
                           ("Veterans Day", "thanking everyone who served in our military · November"),
                           ("Thanksgiving", "giving thanks; remembering the Pilgrims' harvest feast · November"),
                           ("Christmas Day", "a holiday celebrating the birth of Jesus · December")]),
]:
    for n, a in rows: C("American Holidays", 2, fam, n, None, "holiday:" + n, a)

# Stage 2 · Famous Presidents (flash, 5)
for n in ["George Washington", "Thomas Jefferson", "Abraham Lincoln", "Theodore Roosevelt"]:
    C("Famous Presidents", 2, "Presidents every kid knows", n, None, "photo:" + n)
C("Famous Presidents", 2, "Presidents every kid knows", "Donald Trump", None, "photo:Donald Trump",
  "the president now (as of November 2026) — Mom edits this card when it changes", changes=True)

# Stage 3 + 5 · Famous Americans (flip, 30)
FAMOUS = [
    (3, "Long ago", [("Pocahontas", "a Powhatan girl who helped the Jamestown settlers and her people make peace for a time", "photo:Pocahontas"),
                     ("Squanto", "showed the Pilgrims how to plant corn and where to fish in their first year", "badge:Squanto"),
                     ("Benjamin Franklin", "inventor, writer and founder; he flew a kite to study lightning", "photo:Benjamin Franklin"),
                     ("Betsy Ross", "a Philadelphia flag maker; a famous story says she sewed the first flag", "badge:Betsy Ross"),
                     ("Paul Revere", "rode at night to warn that the British soldiers were coming", "photo:Paul Revere"),
                     ("Sacagawea", "a Shoshone woman who helped guide Lewis and Clark", "badge:Sacagawea")]),
    (3, "Freedom and fairness", [("Harriet Tubman", "escaped slavery, then led others to freedom on the Underground Railroad", "photo:Harriet Tubman"),
                                 ("Frederick Douglass", "escaped slavery and spoke and wrote against it", "photo:Frederick Douglass"),
                                 ("Susan B Anthony", "worked for women's right to vote", "photo:Susan B Anthony"),
                                 ("Martin Luther King Jr", "led peaceful marches for equal rights", "photo:Martin Luther King Jr"),
                                 ("Rosa Parks", "would not give up her bus seat, and helped start the bus boycott", "photo:Rosa Parks"),
                                 ("Ruby Bridges", "at six, the first Black child at her New Orleans elementary school", "photo:Ruby Bridges")]),
    (3, "Inventors and explorers", [("Thomas Edison", "invented the phonograph and a long-lasting light bulb", "photo:Thomas Edison"),
                                    ("Wright Brothers", "flew the first airplane, at Kitty Hawk, North Carolina, 1903", "photo:Wright Brothers"),
                                    ("George Washington Carver", "a scientist who found hundreds of uses for peanuts", "photo:George Washington Carver"),
                                    ("Amelia Earhart", "the first woman to fly alone across the Atlantic", "photo:Amelia Earhart"),
                                    ("Neil Armstrong", "the first person to walk on the Moon", "photo:Neil Armstrong")]),
    (3, "Helpers and heroes", [("Clara Barton", "a Civil War nurse who started the American Red Cross", "photo:Clara Barton"),
                               ("Helen Keller", "blind and deaf, she learned to read, write and speak, and helped others", "photo:Helen Keller"),
                               ("Jackie Robinson", "the first Black player in modern Major League Baseball", "photo:Jackie Robinson"),
                               ("Eleanor Roosevelt", "First Lady who spoke up for human rights", "photo:Eleanor Roosevelt"),
                               ("Mary McLeod Bethune", "a teacher who started a school and a college for Black students", "photo:Mary McLeod Bethune"),
                               ("Sequoyah", "made a writing system for the Cherokee language", "photo:Sequoyah"),
                               ("Daniel Boone", "explored and blazed a trail west from North Carolina into Kentucky", "photo:Daniel Boone")]),
    (5, "Founders", [("Alexander Hamilton", "wrote most of the Federalist Papers; the first Treasury Secretary", "photo:Alexander Hamilton"),
                     ("John Hancock", "signed the Declaration of Independence first and biggest", "photo:John Hancock"),
                     ("Patrick Henry", "“Give me liberty, or give me death!”", "photo:Patrick Henry"),
                     ("Thomas Paine", "wrote Common Sense, urging independence", "photo:Thomas Paine"),
                     ("Abigail Adams", "wrote to her husband John to “remember the ladies”", "photo:Abigail Adams"),
                     ("Marquis de Lafayette", "a young French officer who fought beside Washington", "photo:Marquis de Lafayette")]),
]
for st, fam, rows in FAMOUS:
    for n, d, p in rows: C("Famous Americans", st, fam, n, d, p)

# Stage 4 + 6 · Civics (flip, 33)
CIVICS = [
    (4, "Our country's rules", [("Constitution", "the supreme law: the plan for our government", "photo:Constitution"),
                                ("law", "a rule everyone must follow", "icon:law"),
                                ("citizen", "a member of a country, with rights and duties", "icon:citizen"),
                                ("rights", "freedoms that belong to you", "icon:rights"),
                                ("responsibilities", "things a good citizen should do", "icon:responsibilities"),
                                ("democracy", "the people rule, by voting", "icon:democracy"),
                                ("republic", "people choose leaders to make laws for them", "icon:republic")]),
    (4, "Three branches", [("legislative branch", "makes the laws (Congress)", "branch:L"),
                           ("executive branch", "carries out the laws (the President)", "branch:E"),
                           ("judicial branch", "decides what the laws mean (the courts)", "branch:J"),
                           ("Congress", "the Senate and the House together; it writes the laws", "photo:the Capitol"),
                           ("President", "leads the executive branch and the military; elected for 4 years", "photo:White House"),
                           ("Supreme Court", "the highest court in the country; 9 justices", "photo:Supreme Court"),
                           ("checks and balances", "each branch can stop the others from getting too much power", "branch:C"),
                           ("veto", "the President says no to a bill", "icon:veto")]),
    (4, "Congress", [("Senate", "100 senators, 2 from every state", "chamber:100"),
                     ("House of Representatives", "435 members; bigger states have more", "chamber:435"),
                     ("senator", "elected for 6 years to the Senate; speaks for the whole state", "icon:senator"),
                     ("representative", "elected for 2 years to the House; speaks for one district", "icon:representative"),
                     ("bill", "an idea for a law: both houses vote yes, then the President signs it (or vetoes it)", "icon:bill")]),
    (4, "Levels of government", [("federal government", "the national government in Washington DC", "level:federal"),
                                 ("state government", "runs each state, led by a governor", "level:state"),
                                 ("local government", "runs a town, city or county", "level:local"),
                                 ("governor", "the leader of a state", "icon:governor"),
                                 ("mayor", "the leader of a city or town", "icon:mayor"),
                                 ("capitol", "the building where lawmakers meet", "icon:capitol")]),
    (4, "Voting", [("vote", "choose by marking a ballot", "icon:vote"),
                   ("election", "when people vote for leaders", "icon:election"),
                   ("ballot", "the paper or screen you vote on", "icon:ballot"),
                   ("jury", "citizens who decide a trial", "icon:jury")]),
    (6, "Changing the Constitution", [("amendment", "a change or addition to the Constitution", "icon:amendment"),
                                      ("ratify", "to officially approve", "icon:ratify"),
                                      ("Preamble", "the opening “We the People…” that says why the Constitution was written", "icon:preamble")]),
]
for st, fam, rows in CIVICS:
    for n, d, p in rows: C("Civics", st, fam, n, d, p)

# Stage 5 · 13 Colonies (flash, 13) — today's state lines (plan Q12)
for fam, rows in [("New England", ["New Hampshire", "Massachusetts", "Rhode Island", "Connecticut"]),
                  ("Middle", ["New York", "New Jersey", "Pennsylvania", "Delaware"]),
                  ("Southern", ["North Carolina", "Virginia", "South Carolina", "Georgia", "Maryland"])]:
    for n in rows: C("13 Colonies", 5, fam, n, None, "colony:" + n)

# U.S. History (flip, 48 — 20 built-in (B), backs byte-identical to MAST_VOCAB_DEFS)
HISTORY = [
    (5, "Colonies", [("Jamestown", BUILTIN, "photo:Jamestown"), ("Plymouth Colony", BUILTIN, "photo:Mayflower")]),
    (5, "Road to revolution", [("French and Indian War", "1754–1763 — Britain and the colonists fought France; Britain's war debts led to new taxes", "pin:French and Indian War"),
                               ("Stamp Act", "1765 — a British tax on paper; colonists cried “no taxation without representation”", "photo:Stamp Act"),
                               ("Boston Tea Party", BUILTIN, "photo:Boston Tea Party"),
                               ("Revolutionary War", "1775–1783 — the 13 colonies won independence from Britain", "pin:Revolutionary War")]),
    (5, "A new nation", [("Declaration of Independence", BUILTIN, "photo:Declaration"),
                         ("Articles of Confederation", "1781 — the first plan of government; it was too weak", "photo:Articles"),
                         ("Constitutional Convention", BUILTIN, "photo:Constitutional Convention"),
                         ("Bill of Rights", BUILTIN, "photo:Bill of Rights")]),
    (6, "Freedom after the Civil War", [("13th Amendment", BUILTIN, "amend:13"), ("14th Amendment", BUILTIN, "amend:14"), ("15th Amendment", BUILTIN, "amend:15")]),
    (6, "More people vote", [("19th Amendment", BUILTIN, "amend:19")]),
    (8, "Westward", [("Louisiana Purchase", BUILTIN, "photo:Louisiana Purchase"),
                     ("Lewis and Clark Expedition", "1804–1806 — explored the West to the Pacific", "photo:Lewis and Clark"),
                     ("War of 1812", BUILTIN, "pin:War of 1812"),
                     ("Monroe Doctrine", "1823 — told Europe not to start new colonies in the Americas", "icon:monroe"),
                     ("Trail of Tears", BUILTIN, "pin:Trail of Tears"),
                     ("Oregon Trail", "1840s — wagon trains carried families 2,000 miles west", "photo:Oregon Trail"),
                     ("Mexican-American War", "1846–1848 — the US gained California and the Southwest", "pin:Mexican-American War"),
                     ("Gold Rush", BUILTIN, "photo:Gold Rush"),
                     ("Alaska Purchase", "1867 — the US bought Alaska from Russia", "photo:Alaska Purchase")]),
    (8, "Freedom", [("Seneca Falls Convention", "1848 — the first big meeting for women's rights", "icon:seneca"),
                    ("Underground Railroad", "1800s — secret routes and helpers leading enslaved people to freedom", "photo:Underground Railroad")]),
    (8, "The Civil War and after", [("Civil War", BUILTIN, "pin:Civil War"),
                                    ("Emancipation Proclamation", BUILTIN, "photo:Emancipation Proclamation"),
                                    ("Gettysburg Address", "1863 — Lincoln's short speech about “government of the people, by the people, for the people”", "photo:Gettysburg Address"),
                                    ("Reconstruction", BUILTIN, "icon:reconstruction"),
                                    ("Transcontinental Railroad", "1869 — railroad tracks joined the East and the West", "photo:Transcontinental Railroad")]),
    (9, "A new century", [("Industrial Revolution", BUILTIN, "icon:factory"),
                          ("Ellis Island", BUILTIN, "photo:Ellis Island"),
                          ("Spanish-American War", BUILTIN, "pin:Spanish-American War"),
                          ("World War I", "1914–1918 — the US joined in 1917 and helped the Allies win", "pin:World War I"),
                          ("Great Depression", "1929–1930s — banks failed and millions lost jobs", "photo:Great Depression"),
                          ("New Deal", "1930s — Franklin Roosevelt's programs to put people back to work", "icon:newdeal"),
                          ("World War II", "1939–1945 — the US joined after Pearl Harbor; the Allies won", "pin:World War II")]),
    (9, "The Cold War years", [("Cold War", "1947–1991 — a long standoff between the US and the Soviet Union, without a war between them", "pin:Cold War"),
                               ("Korean War", "1950–1953 — the US helped South Korea stay free", "pin:Korean War"),
                               ("Brown v Board of Education", "1954 — the Supreme Court ruled that segregated public schools were unconstitutional", "icon:school"),
                               ("Civil Rights Movement", "1950s–1960s — Americans worked peacefully for equal rights for Black Americans", "photo:Civil Rights Movement"),
                               ("Moon landing", "1969 — Apollo 11; Neil Armstrong walked on the Moon", "photo:Moon landing"),
                               ("Vietnam War", "1960s–1973 — the US fought to stop communism in South Vietnam", "pin:Vietnam War"),
                               ("Fall of the Berlin Wall", "1989 — the wall dividing Berlin came down; the Cold War was ending", "photo:Berlin Wall")]),
    (9, "Our times", [("Persian Gulf War", "1991 — the US led a coalition to free Kuwait from Iraq", "pin:Persian Gulf War"),
                      ("September 11 attacks", "2001 — terrorists attacked New York and Washington; the country came together", "icon:tribute"),
                      ("War in Afghanistan", "2001–2021 — the US fought the group behind the 9/11 attacks", "pin:War in Afghanistan"),
                      ("Iraq War", "2003–2011 — the US-led war that removed Iraq's dictator", "pin:Iraq War")]),
]
for st, fam, rows in HISTORY:
    for n, d, p in rows: C("U.S. History", st, fam, n, d, p)

# American Battles (flip, 25) — back = year · war · where · what it decided (Appendix A); picture = a pin on the map
BATTLES = [
    (5, "The Revolution", [
        ("Lexington and Concord", "1775 · Revolution · Massachusetts · the first shots of the war", 42.4604, -71.3489),
        ("Bunker Hill", "1775 · Revolution · Massachusetts · the British took the hill but learned the colonists would stand and fight", 42.3763, -71.0608),
        ("Moores Creek Bridge", "1776 · Revolution · North Carolina · Patriots stopped Loyalists marching to the coast", 34.4579, -78.1101),
        ("Trenton", "1776 · Revolution · New Jersey · Washington crossed the icy Delaware on Christmas night and won", 40.2206, -74.7597),
        ("Saratoga", "1777 · Revolution · New York · an American win that brought France in as an ally", 42.9989, -73.6375),
        ("Kings Mountain", "1780 · Revolution · South Carolina · frontier Patriots, many from North Carolina, beat a Loyalist army", 35.1418, -81.3768),
        ("Guilford Courthouse", "1781 · Revolution · North Carolina · the British held the field but were worn down and left for Virginia", 36.1318, -79.8456),
        ("Yorktown", "1781 · Revolution · Virginia · the British army surrendered; the war's last big battle", 37.2388, -76.5097)]),
    (8, "War of 1812", [
        ("Fort McHenry", "1814 · War of 1812 · Maryland · the fort held, and Francis Scott Key wrote “The Star-Spangled Banner”", 39.2633, -76.5797),
        ("New Orleans", "1815 · War of 1812 · Louisiana · Andrew Jackson's big win, fought just after the peace treaty was signed", 29.9425, -89.9906)]),
    (8, "Civil War", [
        ("Fort Sumter", "1861 · Civil War · South Carolina · the first shots of the Civil War", 32.7523, -79.8747),
        ("First Bull Run", "1861 · Civil War · Virginia · a Confederate win that showed the war would be long", 38.8126, -77.5219),
        ("Antietam", "1862 · Civil War · Maryland · stopped Lee's push north and led to the Emancipation Proclamation", 39.4740, -77.7447),
        ("Gettysburg", "1863 · Civil War · Pennsylvania · a Union win and the war's turning point", 39.8113, -77.2257),
        ("Vicksburg", "1863 · Civil War · Mississippi · the Union won control of the Mississippi River", 32.3433, -90.8506),
        ("Bentonville", "1865 · Civil War · North Carolina · the largest battle ever fought in North Carolina", 35.3049, -78.3192),
        ("Appomattox Court House", "1865 · Civil War · Virginia · Lee surrendered to Grant, ending the war's main fighting", 37.3772, -78.7964)]),
    (9, "World War I", [
        ("Meuse-Argonne", "1918 · World War I · France · the biggest American battle of the war; it helped end it", 49.28, 5.08)]),
    (9, "World War II", [
        ("Pearl Harbor", "1941 · World War II · Hawaii · a surprise attack that brought the US into the war", 21.3649, -157.9507),
        ("Midway", "1942 · World War II · the Pacific · a US Navy win that turned the war in the Pacific", 28.2072, -177.3735),
        ("D-Day", "1944 · World War II · France · the Allies landed in Normandy to free Europe", 49.37, -0.88),
        ("Battle of the Bulge", "1944–1945 · World War II · Belgium · Germany's last big attack in the west failed", 50.0, 5.72),
        ("Iwo Jima", "1945 · World War II · Japan · US Marines took the island; the famous flag-raising", 24.78, 141.32)]),
    (9, "Korea and Vietnam", [
        ("Inchon", "1950 · Korean War · Korea · a landing behind enemy lines that turned the war", 37.47, 126.62),
        ("Tet Offensive", "1968 · Vietnam War · Vietnam · a surprise attack that turned many Americans against the war", 16.46, 107.59)]),
]
PINS = {}
for st, fam, rows in BATTLES:
    for n, d, lat, lon in rows:
        C("American Battles", st, fam, n, d, "pin:" + n); PINS[n] = (lat, lon)
# where the history-deck war and route cards are pinned (one place that stands for the war, not a battle scene)
PINS.update({"French and Indian War": (40.44, -80.0), "Revolutionary War": (39.95, -75.16), "War of 1812": (42.9, -79.0),
             "Mexican-American War": (29.4, -98.5), "Civil War": (37.5, -77.4), "Spanish-American War": (21.5, -79.5),
             "World War I": (49.2, 4.0), "World War II": (50.0, 10.0), "Cold War": (52.52, 13.40), "Korean War": (37.5, 127.0),
             "Vietnam War": (14.0, 108.0), "Persian Gulf War": (29.3, 47.5), "War in Afghanistan": (34.5, 69.2), "Iraq War": (33.3, 44.4)})
ROUTES = {"Trail of Tears": [(35.6, -84.5), (35.15, -90.05), (35.5, -95.0)]}   # from the Southeast's Cherokee lands west to Indian Territory

# Stage 6 · Amendments (flip, 23 — the 13th, 14th, 15th and 19th are U.S. History (B) cards in this stage)
AMENDS = [
    ("The Bill of Rights", [(1, "1791 — freedom of religion, speech and the press, to gather peacefully, and to ask the government to fix things"),
                            (2, "1791 — the right to keep and bear arms"),
                            (3, "1791 — soldiers can't be made to live in your home in peacetime"),
                            (4, "1791 — no unreasonable searches; police usually need a warrant"),
                            (5, "1791 — rights when accused: no trial twice for the same crime, and you don't have to speak against yourself"),
                            (6, "1791 — a speedy, public trial with a jury and a lawyer"),
                            (7, "1791 — a jury trial in many money disagreements"),
                            (8, "1791 — no cruel and unusual punishment or unfair bail"),
                            (9, "1791 — people have more rights than the ones listed"),
                            (10, "1791 — powers not given to the national government belong to the states or the people")]),
    ("More people vote", [(17, "1913 — people vote directly for their senators"),
                          (23, "1961 — people in Washington DC can vote for president"),
                          (24, "1964 — no paying a tax to vote in federal elections"),
                          (26, "1971 — citizens 18 and older can vote")]),
    ("How the government runs", [(11, "1795 — limits lawsuits against a state in federal court"),
                                 (12, "1804 — electors vote for president and vice president separately"),
                                 (16, "1913 — Congress can collect an income tax"),
                                 (20, "1933 — a new president starts January 20, Congress January 3"),
                                 (22, "1951 — a president can be elected only twice"),
                                 (25, "1967 — who takes over if the president can't serve"),
                                 (27, "1992 — a pay raise Congress gives itself waits until after the next election")]),
    ("Prohibition, on and off", [(18, "1919 — banned making and selling alcohol"), (21, "1933 — ended the 18th Amendment")]),
]
def ordinal(n): return str(n) + ("th" if 10 <= n % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th"))
for fam, rows in AMENDS:
    for n, d in rows: C("Amendments", 6, fam, ordinal(n) + " Amendment", d, "amend:%d" % n)

# Stage 7 · Presidents (flip, 47) — names, years and the 3rd–5th fact are notebooks.js's LN_EXTRA.enrich.presidents
# (read at build); "more" = the 6th–8th line (Appendix G, kept on the card for the Presidents' Line page).
ERAS = [("Founders", 1, 5), ("A growing nation", 6, 12), ("Toward war", 13, 17), ("Rebuilding and the Gilded Age", 18, 25),
        ("A new century", 26, 31), ("Depression, war and the Cold War", 32, 37), ("Into a new century", 38, 43), ("Today", 44, 47)]
MORE = {1: "Presided over the Constitutional Convention; warned against political parties in his Farewell Address",
        2: "A lawyer and diplomat; kept the country out of a war with France", 3: "Sent Lewis and Clark west",
        4: "Wrote the Bill of Rights; the British burned Washington in 1814", 5: "The “Era of Good Feelings”; the Missouri Compromise",
        6: "Earlier wrote much of the Monroe Doctrine as Secretary of State", 7: "Signed the Indian Removal Act, which led to the Trail of Tears",
        8: "The Panic of 1837, a hard economic time", 9: "Died of illness a month into his term", 10: "Texas joined the Union",
        11: "The Mexican-American War; the Oregon Territory", 12: "Died in office; the fight over slavery in the new lands grew",
        13: "Signed the Compromise of 1850", 14: "The Kansas-Nebraska Act deepened the split over slavery",
        15: "Southern states began to leave the Union",
        16: "The Emancipation Proclamation and the Gettysburg Address; was killed in 1865, days after the war's end",
        17: "Fought with Congress over Reconstruction; Alaska was bought",
        18: "Reconstruction; the Transcontinental Railroad was finished", 19: "Reconstruction ended",
        20: "Was killed months after taking office", 21: "The Pendleton Act: government jobs by test, not favors",
        22: "The Statue of Liberty was dedicated", 23: "Six states joined, more than under any other president",
        24: "The Panic of 1893", 25: "Hawaii became a US territory; was killed in 1901",
        26: "Started the Panama Canal; won the Nobel Peace Prize", 27: "“Trust-busting”: broke up giant companies",
        28: "Planned the League of Nations; women won the vote (19th Amendment)", 29: "Died in office; his staff's scandals came out after",
        30: "The Roaring Twenties", 31: "The stock market crash of 1929",
        32: "The New Deal; led until his death in 1945. The 22nd Amendment came after him.",
        33: "The Marshall Plan rebuilt Europe; the Korean War began",
        34: "Sent troops so Black students could attend Little Rock Central High", 35: "The Cuban Missile Crisis; was killed in 1963",
        36: "The Voting Rights Act; the Vietnam War grew", 37: "The Moon landing happened on his watch; resigned over Watergate",
        38: "Became president when Nixon resigned", 39: "The Camp David Accords between Egypt and Israel",
        40: "Worked with the Soviet leader to cut nuclear weapons", 41: "The Persian Gulf War",
        42: "The federal budget was balanced for the first time in about 30 years", 43: "The War in Afghanistan and the Iraq War",
        44: "The Affordable Care Act", 45: "Appointed three Supreme Court justices",
        46: "Brought the last US troops home from Afghanistan in 2021",
        47: "The second president to serve two terms that were not back-to-back (after Grover Cleveland)"}

# Stage 10 · Civics Test (flip, 124 = the 2025 USCIS 128 minus Q23, Q29, Q61, Q62 — "your state" questions; plan §5)
# (question number, front in kid words — no periods, back = 1–3 accepted answers, cards in this unit that teach it)
# "geo:" = taught by the Geography Path. changes=True: the answer follows an officeholder (plan R4).
STAR = {2, 7, 12, 20, 30, 36, 38, 39, 44, 52, 61, 66, 74, 78, 86, 94, 113, 115, 121, 126}   # USCIS's ★ list (65/20)
LOCAL = {23: "Who is one of your state's US senators now?", 29: "Name your US representative",
         61: "Who is the governor of your state now?", 62: "What is the capital of your state?"}
SECTIONS = [(1, 15, "Principles of American Government"), (16, 62, "System of Government"), (63, 72, "Rights and Responsibilities"),
            (73, 89, "Colonial Period and Independence"), (90, 99, "The 1800s"), (100, 118, "Recent American History"), (119, 128, "Symbols and Holidays")]
CT = [
    (1, "What is the form of government of the United States?", "A republic — the people choose leaders to govern (a representative democracy)", ["Civics|republic"]),
    (2, "What is the supreme law of the land?", "The Constitution", ["Civics|Constitution"]),
    (3, "Name one thing the Constitution does", "Sets up the government · says what each part can do · protects people's rights", ["Civics|Constitution"]),
    (4, "The Constitution starts with the words “We the People” — what does that mean?", "The people govern themselves (self-government)", ["Civics|Preamble"]),
    (5, "How are changes made to the Constitution?", "By amendments", ["Civics|amendment"]),
    (6, "What does the Bill of Rights protect?", "The basic rights of people in America", ["U.S. History|Bill of Rights"]),
    (7, "How many amendments does the Constitution have?", "27", ["Civics|amendment", "Amendments|27th Amendment"]),
    (8, "Why is the Declaration of Independence important?", "It says America is free from Britain · all people are created equal · people have rights", ["U.S. History|Declaration of Independence"]),
    (9, "What founding document said the American colonies were free from Britain?", "The Declaration of Independence", ["U.S. History|Declaration of Independence"]),
    (10, "Name two important ideas from the Declaration of Independence and the Constitution", "Two of: equality, liberty, self-government, natural rights, limited government", ["U.S. History|Declaration of Independence", "Civics|democracy"]),
    (11, "The words “Life, Liberty, and the pursuit of Happiness” are in what founding document?", "The Declaration of Independence", ["U.S. History|Declaration of Independence"]),
    (12, "What is the economic system of the United States?", "Capitalism (a free market economy)", []),
    (13, "What is the rule of law?", "Everyone must follow the law — leaders and the government too; no one is above the law", ["Civics|law"]),
    (14, "Many documents influenced the Constitution — name one", "The Declaration of Independence · the Articles of Confederation · the Federalist Papers · the Mayflower Compact", ["U.S. History|Articles of Confederation"]),
    (15, "There are three branches of government — why?", "So no one part gets too powerful (checks and balances)", ["Civics|checks and balances"]),
    (16, "Name the three branches of government", "Legislative, executive and judicial (Congress, the President and the courts)", ["Civics|legislative branch", "Civics|executive branch", "Civics|judicial branch"]),
    (17, "The President is in charge of which branch of government?", "The executive branch", ["Civics|executive branch"]),
    (18, "What part of the federal government writes laws?", "Congress (the legislative branch)", ["Civics|Congress"]),
    (19, "What are the two parts of Congress?", "The Senate and the House of Representatives", ["Civics|Congress"]),
    (20, "Name one power of Congress", "Writes laws · declares war · makes the federal budget", ["Civics|Congress"]),
    (21, "How many US senators are there?", "100", ["Civics|Senate"]),
    (22, "How long is a term for a US senator?", "6 years", ["Civics|senator"]),
    (24, "How many voting members are in the House of Representatives?", "435", ["Civics|House of Representatives"]),
    (25, "How long is a term for a member of the House of Representatives?", "2 years", ["Civics|representative"]),
    (26, "Why do representatives serve shorter terms than senators?", "To follow what the people think more closely", ["Civics|representative"]),
    (27, "How many senators does each state have?", "2", ["Civics|Senate"]),
    (28, "Why does each state have two senators?", "So small states are equal to big ones in the Senate (the Great Compromise)", ["Civics|Senate"]),
    (30, "What is the name of the Speaker of the House of Representatives now?", "Mike Johnson (as of November 2026 — check when a new Congress starts)", []),
    (31, "Who does a US senator represent?", "The people of their state", ["Civics|senator"]),
    (32, "Who elects US senators?", "The citizens of their state", ["Amendments|17th Amendment"]),
    (33, "Who does a member of the House of Representatives represent?", "The people in their district", ["Civics|representative"]),
    (34, "Who elects members of the House of Representatives?", "The citizens in their district", ["Civics|representative"]),
    (35, "Some states have more representatives than other states — why?", "They have more people", ["Civics|House of Representatives"]),
    (36, "The President is elected for how many years?", "4 years", ["Civics|President"]),
    (37, "The President can serve only two terms — why?", "The 22nd Amendment — so no president gets too powerful", ["Amendments|22nd Amendment"]),
    (38, "What is the name of the President of the United States now?", "Donald Trump (as of November 2026)", ["Famous Presidents|Donald Trump"]),
    (39, "What is the name of the Vice President of the United States now?", "JD Vance (as of November 2026)", []),
    (40, "If the president can no longer serve, who becomes president?", "The Vice President", ["Amendments|25th Amendment"]),
    (41, "Name one power of the president", "Signs bills into law · vetoes bills · leads the military · appoints federal judges", ["Civics|veto", "Civics|President"]),
    (42, "Who is Commander in Chief of the US military?", "The President", ["Civics|President"]),
    (43, "Who signs bills to become laws?", "The President", ["Civics|bill"]),
    (44, "Who vetoes bills?", "The President", ["Civics|veto"]),
    (45, "Who appoints federal judges?", "The President", []),
    (46, "The executive branch has many parts — name one", "The President · the Cabinet · federal departments", ["Civics|executive branch"]),
    (47, "What does the President's Cabinet do?", "Gives the President advice", []),
    (48, "What are two Cabinet-level positions?", "Two of: Vice President, Secretary of State, Secretary of the Treasury, Attorney General, Secretary of Education (and more)", []),
    (49, "Why is the Electoral College important?", "It decides who is elected president", []),
    (50, "What is one part of the judicial branch?", "The Supreme Court (or the federal courts)", ["Civics|Supreme Court"]),
    (51, "What does the judicial branch do?", "Explains laws, settles disagreements about the law, and decides if a law goes against the Constitution", ["Civics|judicial branch"]),
    (52, "What is the highest court in the United States?", "The Supreme Court", ["Civics|Supreme Court"]),
    (53, "How many seats are on the Supreme Court?", "9", ["Civics|Supreme Court"]),
    (54, "How many Supreme Court justices are usually needed to decide a case?", "5", []),
    (55, "How long do Supreme Court justices serve?", "For life (until they retire)", []),
    (56, "Supreme Court justices serve for life — why?", "To keep them independent of politics", []),
    (57, "Who is the Chief Justice of the United States now?", "John Roberts (as of November 2026)", []),
    (58, "Name one power that is only for the federal government", "Print money · declare war · create an army · make treaties", ["Civics|federal government"]),
    (59, "Name one power that is only for the states", "Run schools · give driver's licenses · provide police and fire protection", ["Civics|state government"]),
    (60, "What is the purpose of the 10th Amendment?", "Powers not given to the federal government belong to the states or the people", ["Amendments|10th Amendment"]),
    (63, "There are four amendments about who can vote — describe one", "Citizens 18 and older can vote · no paying to vote · women and men can vote · a citizen of any race can vote", ["Amendments|26th Amendment", "Amendments|24th Amendment", "U.S. History|19th Amendment", "U.S. History|15th Amendment"]),
    (64, "Who can vote in federal elections, run for federal office, and serve on a jury?", "US citizens", ["Civics|citizen"]),
    (65, "What are three rights of everyone living in the United States?", "Three of: freedom of speech, of religion, of assembly, to petition the government; the right to bear arms", ["Amendments|1st Amendment", "Amendments|2nd Amendment"]),
    (66, "What do we show loyalty to when we say the Pledge of Allegiance?", "The United States and the flag", ["American Symbols|Pledge of Allegiance"]),
    (67, "Name two promises that new citizens make in the Oath of Allegiance", "Two of: be loyal to the United States, defend the Constitution, obey the laws, serve the nation if needed", []),
    (68, "How can people become United States citizens?", "Be born here (the 14th Amendment) or naturalize", ["U.S. History|14th Amendment"]),
    (69, "What are two examples of civic participation in the United States?", "Two of: vote, run for office, help with a campaign, join a community group, write to an elected official", ["Civics|vote"]),
    (70, "What is one way Americans can serve their country?", "Vote · pay taxes · obey the law · serve in the military · run for office", ["Civics|responsibilities"]),
    (71, "Why is it important to pay federal taxes?", "The law requires it, and taxes pay for the federal government (the 16th Amendment)", ["Amendments|16th Amendment"]),
    (72, "It is important for all men age 18 through 25 to register for the Selective Service — name one reason why", "The law requires it, and it makes a draft fair if one is ever needed", []),
    (73, "The colonists came to America for many reasons — name one", "Freedom · religious freedom · a chance at a better life", ["U.S. History|Plymouth Colony"]),
    (74, "Who lived in America before the Europeans arrived?", "American Indians (Native Americans)", ["Famous Americans|Pocahontas", "Famous Americans|Squanto"]),
    (75, "What group of people was taken and sold as slaves?", "People from Africa", ["Famous Americans|Harriet Tubman", "U.S. History|Underground Railroad"]),
    (76, "What war did the Americans fight to win independence from Britain?", "The Revolutionary War (the American Revolution)", ["U.S. History|Revolutionary War"]),
    (77, "Name one reason why the Americans declared independence from Britain", "High taxes · taxation without representation · British soldiers in their houses · the Boston Tea Party", ["U.S. History|Stamp Act", "U.S. History|Boston Tea Party"]),
    (78, "Who wrote the Declaration of Independence?", "Thomas Jefferson", ["U.S. History|Declaration of Independence"]),
    (79, "When was the Declaration of Independence adopted?", "July 4, 1776", ["American Holidays|Independence Day"]),
    (80, "The American Revolution had many important events — name one", "Bunker Hill · the Declaration of Independence · Washington crossing the Delaware · Saratoga · Valley Forge · Yorktown", ["American Battles|Yorktown", "American Battles|Saratoga"]),
    (81, "There were 13 original states — name five", "Five of: New Hampshire, Massachusetts, Rhode Island, Connecticut, New York, New Jersey, Pennsylvania, Delaware, Maryland, Virginia, North Carolina, South Carolina, Georgia", ["13 Colonies|North Carolina"]),
    (82, "What founding document was written in 1787?", "The Constitution", ["U.S. History|Constitutional Convention"]),
    (83, "The Federalist Papers supported passing the Constitution — name one of the writers", "James Madison · Alexander Hamilton · John Jay", ["Famous Americans|Alexander Hamilton"]),
    (84, "Why were the Federalist Papers important?", "They helped people understand the Constitution and supported passing it", ["Famous Americans|Alexander Hamilton"]),
    (85, "Benjamin Franklin is famous for many things — name one", "Inventor · helped write the Declaration of Independence · first Postmaster General · started the first free public library", ["Famous Americans|Benjamin Franklin"]),
    (86, "George Washington is famous for many things — name one", "“Father of Our Country” · the first president · general of the Continental Army", ["Presidents|1st President"]),
    (87, "Thomas Jefferson is famous for many things — name one", "Wrote the Declaration of Independence · the third president · doubled the country's size (the Louisiana Purchase)", ["Presidents|3rd President"]),
    (88, "James Madison is famous for many things — name one", "“Father of the Constitution” · the fourth president · president during the War of 1812", ["Presidents|4th President"]),
    (89, "Alexander Hamilton is famous for many things — name one", "The first Secretary of the Treasury · a writer of the Federalist Papers · an aide to George Washington", ["Famous Americans|Alexander Hamilton"]),
    (90, "What territory did the United States buy from France in 1803?", "Louisiana", ["U.S. History|Louisiana Purchase"]),
    (91, "Name one war fought by the United States in the 1800s", "The War of 1812 · the Mexican-American War · the Civil War · the Spanish-American War", ["U.S. History|War of 1812"]),
    (92, "Name the US war between the North and the South", "The Civil War", ["U.S. History|Civil War"]),
    (93, "The Civil War had many important events — name one", "Fort Sumter · the Emancipation Proclamation · Gettysburg · Vicksburg · Antietam · the surrender at Appomattox", ["American Battles|Gettysburg"]),
    (94, "Abraham Lincoln is famous for many things — name one", "Freed the slaves (the Emancipation Proclamation) · saved the Union · led the country in the Civil War · the 16th president · gave the Gettysburg Address", ["Presidents|16th President"]),
    (95, "What did the Emancipation Proclamation do?", "Freed the slaves in the Confederate states", ["U.S. History|Emancipation Proclamation"]),
    (96, "What US war ended slavery?", "The Civil War", ["U.S. History|13th Amendment"]),
    (97, "What amendment says all persons born or naturalized in the United States are US citizens?", "The 14th Amendment", ["U.S. History|14th Amendment"]),
    (98, "When did all men get the right to vote?", "After the Civil War — the 15th Amendment, 1870", ["U.S. History|15th Amendment"]),
    (99, "Name one leader of the women's rights movement in the 1800s", "Susan B. Anthony · Elizabeth Cady Stanton · Sojourner Truth · Harriet Tubman", ["Famous Americans|Susan B Anthony"]),
    (100, "Name one war fought by the United States in the 1900s", "World War I · World War II · the Korean War · the Vietnam War · the Persian Gulf War", ["U.S. History|World War I"]),
    (101, "Why did the United States enter World War I?", "Germany attacked US ships · to help the Allies (Britain, France, Italy and Russia)", ["U.S. History|World War I"]),
    (102, "When did all women get the right to vote?", "1920 — the 19th Amendment", ["U.S. History|19th Amendment"]),
    (103, "What was the Great Depression?", "The longest hard time for the economy in modern history", ["U.S. History|Great Depression"]),
    (104, "When did the Great Depression start?", "With the Great Crash of 1929", ["U.S. History|Great Depression"]),
    (105, "Who was president during the Great Depression and World War II?", "Franklin Roosevelt", ["Presidents|32nd President"]),
    (106, "Why did the United States enter World War II?", "Japan attacked Pearl Harbor", ["American Battles|Pearl Harbor"]),
    (107, "Dwight Eisenhower is famous for many things — name one", "A general in World War II · president during the Korean War · the 34th president", ["Presidents|34th President"]),
    (108, "Who was the United States' main rival during the Cold War?", "The Soviet Union (the USSR)", ["U.S. History|Cold War"]),
    (109, "During the Cold War, what was one main concern of the United States?", "Communism · nuclear war", ["U.S. History|Cold War"]),
    (110, "Why did the United States enter the Korean War?", "To stop the spread of communism", ["U.S. History|Korean War"]),
    (111, "Why did the United States enter the Vietnam War?", "To stop the spread of communism", ["U.S. History|Vietnam War"]),
    (112, "What did the civil rights movement do?", "Fought to end racial discrimination", ["U.S. History|Civil Rights Movement"]),
    (113, "Martin Luther King Jr is famous for many things — name one", "Fought for civil rights · worked for equality for all Americans", ["Famous Americans|Martin Luther King Jr"]),
    (114, "Why did the United States enter the Persian Gulf War?", "To force Iraq's army out of Kuwait", ["U.S. History|Persian Gulf War"]),
    (115, "What major event happened on September 11, 2001, in the United States?", "Terrorists attacked the United States", ["U.S. History|September 11 attacks"]),
    (116, "Name one US military conflict after the September 11, 2001, attacks", "The War in Afghanistan · the Iraq War · the War on Terror", ["U.S. History|War in Afghanistan", "U.S. History|Iraq War"]),
    (117, "Name one American Indian tribe in the United States", "Cherokee · Navajo · Sioux · Seminole · Apache (and many more)", ["Famous Americans|Sequoyah"]),
    (118, "Name one example of an American innovation", "The light bulb · the airplane · the assembly line · landing on the Moon", ["Famous Americans|Wright Brothers", "Famous Americans|Thomas Edison"]),
    (119, "What is the capital of the United States?", "Washington, D.C.", ["geo:Washington DC"]),
    (120, "Where is the Statue of Liberty?", "New York Harbor (Liberty Island)", ["American Symbols|Statue of Liberty"]),
    (121, "Why does the flag have 13 stripes?", "For the 13 original colonies", ["American Symbols|American flag"]),
    (122, "Why does the flag have 50 stars?", "One star for each state", ["American Symbols|American flag"]),
    (123, "What is the name of the national anthem?", "“The Star-Spangled Banner”", ["American Symbols|national anthem"]),
    (124, "The nation's first motto was “E Pluribus Unum” — what does that mean?", "Out of many, one", []),
    (125, "What is Independence Day?", "The country's birthday — a holiday for our independence from Britain", ["American Holidays|Independence Day"]),
    (126, "Name three national US holidays", "Three of: New Year's Day, Martin Luther King Jr Day, Presidents' Day, Memorial Day, Juneteenth, Independence Day, Labor Day, Columbus Day, Veterans Day, Thanksgiving, Christmas Day", ["American Holidays|Independence Day", "American Holidays|Thanksgiving"]),
    (127, "What is Memorial Day?", "A holiday to honor soldiers who died serving our country", ["American Holidays|Memorial Day"]),
    (128, "What is Veterans Day?", "A holiday to honor people who served in the military", ["American Holidays|Veterans Day"]),
]
CT_CHANGES = {30, 38, 39, 57}

# ───────────────────────────── photos (plan §6) ─────────────────────────────
# picture id → (Commons file, crop: "face" = a portrait cropped 4:5 from the top third, "wide" = 5:4 landscape, "center" = 4:5 centre, file
# set: 1 = us_pics_1.js (Stages 1–4), 2 = us_pics_2.js (Stages 5–9)). Every file's licence is checked at --resolve.
PHOTOS = {
    # Stage 1 symbols
    "bald eagle": ("Bald Eagle (Haliaeetus leucocephalus) Kachemak Bay, Alaska.jpg", "center", 1),
    "Statue of Liberty": ("Statue of Liberty National Monument STLI 02-02.jpg", "center", 1),
    "Liberty Bell": ("Liberty Bell 2008.jpg", "center", 1),
    "White House": ("A rainbow is seen over the North Portico of the White House, Saturday, May 11, 2024.jpg", "wide", 1),
    "the Capitol": ("United States Capitol west front edit2.jpg", "wide", 1),
    "Mount Rushmore": ("Mount Rushmore National Memorial MORU3609.jpg", "center", 1),
    "Washington Monument": ("WashMonument WhiteHouse.jpg", "wide", 1),
    "Lincoln Memorial": ("Aerial view of Lincoln Memorial - east side EDIT.jpeg", "wide", 1),
    # Stage 4 civics
    "Supreme Court": ("U.S. Supreme Court building, Washington, D.C. LCCN2017878871.jpg", "center", 1),
    "Constitution": ("Constitution of the United States - DPLA - 9ca804144bd5965e992ae3528bc3c6a3 (page 1).jpg", "center", 1),
    # Stage 3 famous Americans
    "Pocahontas": ("NPG 65 61 Pocahontas.tif", "face", 1),
    "Benjamin Franklin": ("Joseph Siffrein Duplessis - Benjamin Franklin - Google Art Project.jpg", "face", 1),
    "Paul Revere": ("J S Copley - Paul Revere.jpg", "face", 1),
    "Harriet Tubman": ("Harriet Tubman (circa 1885).jpg", "face", 1),
    "Frederick Douglass": ("Frederick Douglass as a younger man.jpg", "face", 1),
    "Susan B Anthony": ("SB Anthony from WoC.jpg", "face", 1),
    "Martin Luther King Jr": ("The Rev. Dr. Martin Luther King Jr. Color Portrait (high quality).jpg", "face", 1),
    "Rosa Parks": ("Rosa Parks, November 1956 (cropped).jpg", "face", 1),
    "Ruby Bridges": ("US Marshals with Young Ruby Bridges on School Steps (1x1 crop).jpg", "center", 1),
    "Thomas Edison": ("Thomas Edison2-crop.jpg", "face", 1),
    "Wright Brothers": ("First flight2.jpg", "wide", 1),
    "George Washington Carver": ("George Washington Carver c1910.jpg", "face", 1),
    "Amelia Earhart": ("Amelia Earhart 1928 (cropped).jpg", "face", 1),
    "Neil Armstrong": ("Neil Armstrong pose.jpg", "face", 1),
    "Clara Barton": ("Portrait of Clara Barton.jpg", "face", 1),
    "Helen Keller": ("Helen Keller circa 1920 - restored.jpg", "face", 1),
    "Jackie Robinson": ("Jackie Robinson, NPG 97 135.jpg", "face", 1),
    "Eleanor Roosevelt": ("Eleanor Roosevelt at the United Nations, circa 1946-1947 (3x4 cropped).jpg", "face", 1),
    "Mary McLeod Bethune": ("Mary Jane McLeod Bethune, c1910.jpg", "face", 1),
    "Sequoyah": ("Sequoyah.jpg", "face", 1),
    "Daniel Boone": ("Unfinished portrait of Daniel Boone by Chester Harding 1820.jpg", "face", 1),
    # Stage 5 founders
    "Alexander Hamilton": ("Google Arts Project - Alexander Hamilton (1792 portrait) by John Trumbull.jpg", "face", 2),
    "John Hancock": ("John Hancock 1770-crop.jpg", "face", 2),
    "Patrick Henry": ("Patrick henry.JPG", "face", 2),
    "Thomas Paine": ("Thomas Paine rev1.jpg", "face", 2),
    "Abigail Adams": ("Abigail Adams.jpg", "face", 2),
    "Marquis de Lafayette": ("Marquis de Lafayette 2.jpg", "face", 2),
    # Stages 5, 8, 9 history scenes and documents
    "Jamestown": ("Jamestown Virginia in 1622 Conquestofvirg1939sams 0590.jpg", "wide", 2),
    "Mayflower": ("Mayflower in Plymouth Harbor, by William Halsall.jpg", "wide", 2),
    "Stamp Act": ("Stamp Act box, 1765 - National Museum of American History - DSC00087.jpg", "wide", 2),
    "Boston Tea Party": ("Boston Tea Party Currier colored.jpg", "wide", 2),
    "Declaration": ("Declaration of Independence (1819), by John Trumbull.jpg", "wide", 2),
    "Articles": ("Articles page1.jpg", "center", 2),
    "Constitutional Convention": ("Scene at the Signing of the Constitution of the United States.jpg", "wide", 2),
    "Bill of Rights": ("Bill of Rights - DPLA - a65f6d0b6210c18d17c596908ebcf270 (page 1).jpg", "center", 2),
    "Louisiana Purchase": ("Handover ceremony of Lousiana.jpg", "wide", 2),
    "Lewis and Clark": ("Lewis and clark-expedition.jpg", "wide", 2),
    "Oregon Trail": ("Emigrants Crossing the Plains, or The Oregon Trail (Albert Bierstadt), 1869.jpg", "wide", 2),
    "Gold Rush": ("California Gold Rush handbill.jpg", "center", 2),
    "Alaska Purchase": ("Alaska Purchase (hi-res).jpg", "center", 2),
    "Underground Railroad": ("Undergroundrailroadsmall2.jpg", "wide", 2),
    "Emancipation Proclamation": ("Emancipation Proclamation.jpg", "center", 2),
    "Gettysburg Address": ("Lincolnatgettysburg.jpg", "wide", 2),
    "Transcontinental Railroad": ("69workmen.jpg", "wide", 2),
    "Ellis Island": ("Ellis island air photo.jpg", "wide", 2),
    "Great Depression": ("Lange-MigrantMother02.jpg", "face", 2),
    "Civil Rights Movement": ("Civil Rights March on Washington, D.C. (Dr. Martin Luther King, Jr. speaking.) - NARA - 542068.tif", "wide", 2),
    "Moon landing": ("Aldrin Apollo 11 original.jpg", "center", 2),
    "Berlin Wall": ("BerlinWall-BrandenburgGate.jpg", "wide", 2),
}
# The presidents (45 people; Cleveland and Trump each hold two numbers) — Stage 7, and the five every kid knows in Stage 2.
PRES_FILES = {
    "George Washington": "Gilbert Stuart Williamstown Portrait of George Washington.jpg", "John Adams": "John Adams A18236.jpg",
    "Thomas Jefferson": "Official Presidential portrait of Thomas Jefferson (by Rembrandt Peale, 1800).jpg", "James Madison": "James Madison.jpg",
    "James Monroe": "James Monroe by Gilbert Stuart c1817.jpg", "John Quincy Adams": "John Q. Adams-edit.jpg", "Andrew Jackson": "Andrew jackson head.jpg",
    "Martin Van Buren": "Martin Van Buren.jpg", "William Henry Harrison": "William Henry Harrison by James Reid Lambdin, 1835.jpg",
    "John Tyler": "WHOportTyler.jpg", "James K. Polk": "James K. Polk restored (3x4 cropped).jpg", "Zachary Taylor": "Zachary Taylor restored and cropped.jpg",
    "Millard Fillmore": "Millard Fillmore.jpg", "Franklin Pierce": "Franklin Pierce.jpg", "James Buchanan": "James Buchanan (cropped).jpg",
    "Abraham Lincoln": "Abraham Lincoln O-77 matte collodion print.jpg", "Andrew Johnson": "President Andrew Johnson.jpg", "Ulysses S. Grant": "Ugrant.jpeg",
    "Rutherford B. Hayes": "President Rutherford Hayes 1870 - 1880 Restored.jpg", "James A. Garfield": "James Abram Garfield, photo portrait seated.jpg",
    "Chester A. Arthur": "Chester A. Arthur by Abraham Bogardus.jpg", "Grover Cleveland": "Grover Cleveland - NARA - 518139 (cropped).jpg",
    "Benjamin Harrison": "Benjamin Harrison, head and shoulders bw photo, 1896.jpg", "William McKinley": "William mckinley.jpg",
    "Theodore Roosevelt": "Theodore Roosevelt by the Pach Bros.jpg",
    "William Howard Taft": "Cabinet card of William Howard Taft by Pach Brothers - Cropped to image.jpg",
    "Woodrow Wilson": "President Woodrow Wilson Harris & Ewing (3x4 cropped b).jpg", "Warren G. Harding": "Warren G Harding portrait as senator June 1920.jpg",
    "Calvin Coolidge": "President Calvin Coolidge, 1924 portrait photograph (3x4 cropped).jpeg", "Herbert Hoover": "President Hoover portrait.jpg",
    "Franklin D. Roosevelt": "FDR 1944 Color Portrait.jpg", "Harry S. Truman": "TRUMAN 58-766-06 (cropped).jpg",
    "Dwight D. Eisenhower": "Dwight D. Eisenhower, official photo portrait, May 29, 1959.jpg",
    "John F. Kennedy": "John F. Kennedy, White House color photo portrait.jpg",
    "Lyndon B. Johnson": "Lyndon B. Johnson, photo portrait, leaning on chair, color cropped.jpg", "Richard Nixon": "Richard Nixon presidential portrait.jpg",
    "Gerald Ford": "Gerald Ford presidential portrait (cropped).jpg", "Jimmy Carter": "JimmyCarterPortrait2.jpg",
    "Ronald Reagan": "Ronald Reagan 1981 presidential portrait.jpg", "George H. W. Bush": "George H. W. Bush presidential portrait (cropped).jpg",
    "Bill Clinton": "Bill Clinton.jpg", "George W. Bush": "George-W-Bush.jpeg", "Barack Obama": "President Barack Obama.jpg",
    "Donald Trump": "Official Presidential Portrait of President Donald J. Trump (2025) (3x4).jpg", "Joe Biden": "Joe Biden presidential portrait.jpg",
}
STAGE2_PRES = {"George Washington", "Thomas Jefferson", "Abraham Lincoln", "Theodore Roosevelt", "Donald Trump"}
for n, f in PRES_FILES.items(): PHOTOS[n] = (f, "face", 1 if n in STAGE2_PRES else 2)

LICENCE_OK = re.compile(r"^(Public domain|PD\b|CC0|CC BY \d(\.\d)?$)")   # PD, CC0, CC BY x.y — never BY-SA, never ND/NC
PHOTO_W, PHOTO_H, PHOTO_MAX = 200, 250, 14 * 1024   # portrait 4:5; a wide crop is 250×200
NAME_BAD = re.compile(r"[.#$\[\]/]")   # mastDefKeyOk: a card name must be a legal database key

# ───────────────────────────── helpers ─────────────────────────────
def http_json(url, params):
    q = url + "?" + urllib.parse.urlencode(params)
    for i in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(q, headers=UA), timeout=60) as r: return json.load(r)
        except Exception as e:
            err = e; time.sleep(5 + i * 10)
    raise err
def http_bytes(url):
    for i in range(8):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r: return r.read()
        except Exception as e:
            err = e; time.sleep(30 + i * 30)   # a 429 means wait
    raise err
def strip_html(s): return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s or "")).replace("&amp;", "&").replace("&quot;", '"').replace("&#039;", "'").strip()

def node_eval(js):
    return json.loads(subprocess.check_output(["node", "-e", js], cwd=ROOT).decode("utf-8"))

def builtin_history():
    """The built-in U.S. History names (the code's built-in catalog) and their backs (MAST_VOCAB_DEFS), straight from index.html."""
    js = r'''
const fs=require("fs"); const s=fs.readFileSync("index.html","utf8");
function lit(start,open,close){ const i=s.indexOf(start); if(i<0) throw new Error(start); let j=s.indexOf(open,i), d=0, q=null;
  for(let k=j;k<s.length;k++){ const c=s[k]; if(q){ if(c==="\\"){k++;continue;} if(c===q) q=null; continue; }
    if(c==='"'||c==="'"||c==="`"){q=c;continue;} if(c===open)d++; else if(c===close){ d--; if(!d) return s.slice(j,k+1); } } }
const names=JSON.parse(lit('"U.S. History":["Jamestown"',"[","]"));
const defs=(new Function("return "+lit("const MAST_VOCAB_DEFS={","{","}")))();
process.stdout.write(JSON.stringify(names.map(n=>[n,defs[n.toLowerCase()]])));'''
    return node_eval(js)

def notebook_presidents():
    js = r'''
const fs=require("fs"); const s=fs.readFileSync("notebooks.js","utf8"); const i=s.indexOf("var LN_EXTRA = "); const j=s.indexOf("{",i);
let d=0,q=null; for(let k=j;k<s.length;k++){ const c=s[k]; if(q){ if(c==="\\"){k++;continue;} if(c===q) q=null; continue; }
  if(c==='"'){q=c;continue;} if(c==="{")d++; else if(c==="}"){ d--; if(!d){ const o=JSON.parse(s.slice(j,k+1)); process.stdout.write(JSON.stringify(o.enrich.presidents)); break; } } }'''
    return node_eval(js)

# ───────────────────────────── --resolve: every photo's licence, author and URL → tools/us_pics.json ─────────────────────────────
def resolve():
    files = sorted({f for f, _, _ in PHOTOS.values()})
    meta = {}
    for i in range(0, len(files), 25):
        ch = files[i:i + 25]
        d = http_json("https://commons.wikimedia.org/w/api.php", {"action": "query", "format": "json", "titles": "|".join("File:" + f for f in ch),
                      "prop": "imageinfo", "iiprop": "url|extmetadata|size|mime", "iiurlwidth": 500})
        back = {n["to"]: n["from"] for n in d["query"].get("normalized", [])}
        for p in d["query"]["pages"].values():
            src = back.get(p["title"], p["title"])[5:]
            ii = (p.get("imageinfo") or [{}])[0]; m = ii.get("extmetadata", {})
            g = lambda k: strip_html((m.get(k) or {}).get("value", ""))
            meta[src] = {"file": p["title"][5:], "missing": "missing" in p, "licence": g("LicenseShortName"), "licenceUrl": g("LicenseUrl"),
                         "artist": g("Artist")[:120], "credit": g("Credit")[:160], "date": g("DateTimeOriginal")[:40],
                         "page": ii.get("descriptionurl", ""), "thumb": ii.get("thumburl", ""), "w": ii.get("width"), "h": ii.get("height")}
        time.sleep(1.5)
    bad = []
    out = {}
    for pid, (f, crop, fset) in sorted(PHOTOS.items()):
        m = meta.get(f) or {"missing": True}
        ok = (not m.get("missing")) and bool(LICENCE_OK.match(m.get("licence", "")))
        if not ok: bad.append((pid, f, m.get("licence")))
        out[pid] = dict(m, crop=crop, set=fset, ok=ok)
    json.dump(out, open(MANIFEST, "w", encoding="utf-8"), indent=1, ensure_ascii=False, sort_keys=True)
    print("resolved %d photos → %s" % (len(out), MANIFEST))
    for b in bad: print("  NOT USABLE:", b)
    return not bad

# ───────────────────────────── photos: download once, crop, resize, compress ─────────────────────────────
def photo_bytes(pid, m, cache):
    from PIL import Image, ImageOps
    os.makedirs(cache, exist_ok=True)
    raw = os.path.join(cache, hashlib.sha1(m["thumb"].encode("utf-8")).hexdigest()[:16] + ".img")
    if not os.path.exists(raw):
        b = http_bytes(m["thumb"]); open(raw, "wb").write(b); time.sleep(4.0)   # Wikimedia asks for a gentle pace
    im = Image.open(raw); im = ImageOps.exif_transpose(im).convert("RGB")
    W, H = (PHOTO_H, PHOTO_W) if m["crop"] == "wide" else (PHOTO_W, PHOTO_H)
    r = W / H; w, h = im.size
    if w / h > r:   # too wide → cut the sides
        nw = int(h * r); x = (w - nw) // 2; box = (x, 0, x + nw, h)
    else:           # too tall → cut top/bottom; a face keeps the top (heads sit in the upper third)
        nh = int(w / r); y = int((h - nh) * (0.12 if m["crop"] == "face" else 0.5)); box = (0, y, w, y + nh)
    im = im.crop(box).resize((W, H), Image.LANCZOS)
    for q in (72, 66, 60, 55, 50, 45, 40, 35):
        buf = io.BytesIO(); im.save(buf, "JPEG", quality=q, optimize=True, progressive=False); b = buf.getvalue()
        if len(b) <= PHOTO_MAX: return b, q
    raise SystemExit("photo too big even at q35: " + pid)

def credit_line(m):
    who = m.get("artist") or ""
    who = re.sub(r"(Unknown author\s*)+", "Unknown author ", who)
    who = re.sub(r"^[^:]{0,120}\.(jpe?g|png|tiff?):\s*", "", who, flags=re.I)   # "Some_file.jpg: Brady…" → "Brady…" (a derivative's source)
    if not who.strip() or re.search(r"\.(jpe?g|png|tiff?)\b|_", who, re.I): who = "Wikimedia Commons contributor (see the file page)"
    return "%s · %s · Wikimedia Commons (%s)" % (who.strip()[:90], m["licence"], m["file"])

# ───────────────────────────── build ─────────────────────────────
def build(cache, out_dir):
    if not os.path.exists(MANIFEST): raise SystemExit("run --resolve first")
    man = json.load(open(MANIFEST, encoding="utf-8"))
    hist = builtin_history(); pres = notebook_presidents()
    assert len(hist) == 20 and len(pres) == 47, (len(hist), len(pres))
    hist_back = dict(hist)
    # presidents: name · years · the notebook's one line
    for era, a, b in ERAS:
        for i in range(a, b + 1):
            num, name, years, fact = pres[i - 1]
            assert num == ordinal(i), (num, i)
            C("Presidents", 7, era, ordinal(i) + " President", name + " · " + years + " · " + fact, "photo:" + name, more=MORE[i])
    # the civics test, ★ first, then by USCIS section
    teach = {}
    star_rows = [r for r in CT if r[0] in STAR]
    for q, front, back, t in star_rows: C("Civics Test", 10, "The big twenty", front, back, None, changes=q in CT_CHANGES); teach[front] = (q, t)
    for a, b, sec in SECTIONS:
        for q, front, back, t in CT:
            if a <= q <= b and q not in STAR: C("Civics Test", 10, sec, front, back, None, changes=q in CT_CHANGES); teach[front] = (q, t)
    # built-in backs
    for c in CARDS:
        if c["def"] == BUILTIN: c["def"] = hist_back[c["name"]]; c["builtin"] = True
    # order: stage by stage, deck order inside a stage, cards in list order
    deck_ix = {k: i for i, (k, _, _) in enumerate(DECKS)}
    for i, c in enumerate(CARDS): c["_i"] = i
    CARDS.sort(key=lambda c: (c["stage"], deck_ix[c["deck"]], c["_i"]))
    for i, c in enumerate(CARDS): c["order"] = i + 1
    # checks that must hold before anything is written
    seen = set()
    for c in CARDS:
        assert not NAME_BAD.search(c["name"]), ("bad key", c["name"])
        k = (c["deck"], c["name"]); assert k not in seen, ("twice", k); seen.add(k)
        if c["pic"] and c["pic"].startswith("photo:"): assert c["pic"][6:] in man and man[c["pic"][6:]]["ok"], ("photo", c["pic"])
        if c["pic"] and c["pic"].startswith("pin:"): assert c["pic"][4:] in PINS or c["pic"][4:] in ROUTES, c["pic"]
    # photos
    used = sorted({c["pic"][6:] for c in CARDS if c["pic"] and c["pic"].startswith("photo:")})
    pics = {1: {}, 2: {}}; credits = {}; report = []
    for pid in used:
        m = man[pid]; b, q = photo_bytes(pid, m, cache)
        pics[m["set"]][pid] = "data:image/jpeg;base64," + base64.b64encode(b).decode("ascii")
        credits["photo:" + pid] = {"line": credit_line(m), "licence": m["licence"], "page": m["page"], "file": m["file"], "artist": m["artist"], "set": m["set"], "bytes": len(b)}
        report.append((pid, len(b), q))
    # projection of the pins into geo.js's frames (the same AlbersUSA calibration geo.js was built with)
    pins = project_pins(cache)
    data = {
        "v": 1,
        "unit": {"id": "us_path", "title": "United States Path", "emoji": "🇺🇸"},
        "stages": STAGES,
        "decks": [{"key": k, "mode": m, "introCap": ic, "groupBy": "family"} for k, m, ic in DECKS],
        "cards": [{k: v for k, v in (("deck", c["deck"]), ("name", c["name"]), ("family", c["family"]), ("stage", c["stage"]), ("order", c["order"]),
                   ("def", c["def"]), ("about", c["about"]), ("more", c["more"]), ("changes", c["changes"] or None), ("builtin", c.get("builtin")),
                   ("pic", c["pic"])) if v not in (None, False)} for c in CARDS],
        "pins": pins,
        "credits": dict(credits, **{"drawing": {"line": "Drawing: Howe Academy"}, "map": {"line": "Map data: Natural Earth (public domain) · naturalearthdata.com"}}),
        "uscis": {"version": "2025 civics test (M-1778, 09/25), 128 questions", "star": sorted(STAR), "local": {str(k): v for k, v in LOCAL.items()},
                  "teach": {front: {"q": q, "cards": t} for front, (q, t) in teach.items()},
                  "untaught": sorted(q for q, f, b, t in CT if not t)},
    }
    runtime = open(os.path.join(TOOLS, "us_runtime.js"), encoding="utf-8").read()
    head = ("// us.js — the United States Path's cards and drawn pictures (GENERATED by tools/build_us_js.py — do not edit by hand; edit the\n"
            "// build or tools/us_runtime.js). PLAN_us_unit_2026-11-16.md §3, §6, slice 1 USDATA. Photos: us_pics_1.js / us_pics_2.js.\n"
            "// Maps (13 colonies, pins): Natural Earth (public domain) via geo.js. Drawings: Howe Academy. Loaded lazily; nothing here runs on its own.\n")
    js = head + "(function(){\nconst US_DATA=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n" + runtime + "\n})();\n"
    open(os.path.join(out_dir, "us.js"), "w", encoding="utf-8").write(js)
    for s in (1, 2):
        stages = "Stages 1–4" if s == 1 else "Stages 5–9"
        body = ("// us_pics_%d.js — United States Path photos, %s (GENERATED by tools/build_us_js.py — do not edit by hand).\n"
                "// Every photo is Public domain, CC0 or CC BY on Wikimedia Commons; its author, licence and file page are in us.js (HoweUS.credits).\n"
                "(function(){ const P=%s;\n"
                "if (typeof window !== \"undefined\") { window.HoweUSPics = Object.assign(window.HoweUSPics || {}, P); window._haLazy_us_pics_%d = true; }\n"
                "if (typeof module !== \"undefined\" && module.exports) module.exports = P; })();\n") % (s, stages, json.dumps(pics[s], separators=(",", ":"), sort_keys=True), s)
        open(os.path.join(out_dir, "us_pics_%d.js" % s), "w", encoding="utf-8").write(body)
    n = {}
    for c in CARDS: n[c["deck"]] = n.get(c["deck"], 0) + 1
    print("cards %d · decks %s" % (len(CARDS), n))
    print("photos %d (set 1: %d, set 2: %d) · largest %d bytes" % (len(report), len(pics[1]), len(pics[2]), max(r[1] for r in report)))
    for f in ("us.js", "us_pics_1.js", "us_pics_2.js"): print("  %-13s %8d bytes" % (f, os.path.getsize(os.path.join(out_dir, f))))

def project_pins(cache):
    """Battle and war pins in geo.js's frames: the Albers-USA frame (lower 48, Hawaii, Alaska insets) or the Robinson world."""
    sys.path.insert(0, TOOLS); import build_geo_js as B
    src = os.path.join(cache, "ne_50m_admin_1_states_provinces.geojson")
    if not os.path.exists(src):
        open(src, "wb").write(http_bytes("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson"))
    feats = json.load(open(src, encoding="utf-8"))["features"]
    us = {f["properties"]["name"]: f for f in feats if f["properties"].get("iso_a2") == "US"}
    A = B.AlbersUSA(); A.calibrate([r for n, f in us.items() if n not in ("Alaska", "Hawaii") for r in B.rings_of(f["geometry"])])
    out = {}
    def place(lat, lon):
        if 18 < lat < 23 and -161 < lon < -154: x, y = A.hawaii(lon, lat); return ("hi", round(x, 1), round(y, 1))   # the Hawaii inset
        if 24 < lat < 50 and -125 < lon < -66: x, y = A.lower48(lon, lat); return ("us", round(x, 1), round(y, 1))
        x, y = B.robinson(lon, lat); return ("world", round(x, 1), round(y, 1))
    for n, (lat, lon) in sorted(PINS.items()): out[n] = place(lat, lon)
    for n, pts in ROUTES.items(): out[n] = ["route"] + [list(place(lat, lon)[1:]) for lat, lon in pts]
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--resolve", action="store_true", help="look up every photo's licence and URL → tools/us_pics.json")
    ap.add_argument("--cache", default=os.path.join(tempfile.gettempdir(), "howe_us_cache"), help="where downloads are kept (outside the repo)")
    ap.add_argument("--out", default=ROOT)
    a = ap.parse_args()
    if a.resolve: sys.exit(0 if resolve() else 1)
    build(a.cache, a.out)

if __name__ == "__main__":
    main()
