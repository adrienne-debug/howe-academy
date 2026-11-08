/*
 * Node tests — 📅 REGENNOPAST: a Regenerate never adds a NEW card to a day before today (her rule 2026-11-07: "Past days first").
 * Live replay: a family copy's week 5, Regenerate Thu 11/5 11:47 AM laid 9 open cards on Mon/Tue/Wed — two daily subjects
 * made Monday evening (Spelling Practice, Fact Review, for two kids) and a retrieval Drill + Match switched on mid-week.
 * WEEK below is that regenerate's own result (names replaced by k1–k4); the week as it stood before is the same cards
 * without the 9 new ones (proved by replay on 11/5: a dry run of the build that ran re-made exactly those 9 + 4 Thursday).
 * Runs the REAL gwNoPastNew and subjNoCarry, and checks gwCommit's wiring.
 *   run:  node test_regen_no_past.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function fn(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0, s = false; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") { d++; s = true; } else if (src[k] === "}") { d--; if (s && !d) return src.slice(i, k + 1); } } }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);

const WEEK=[["2026d306_2786","k1","mon","10:15 AM","piano","🎹 Piano — Piano","","",1],
["2026d306_2789","k1","mon","1:00 PM","speech","💻 Speech — Speech","","",1],
["2026d306_2794","k1","mon","1:43 PM","","🏡 History","fbmusz3l9q","",1],
["2026d306_2798","k1","mon","1:54 PM","","🏡 Science","fbmusz3l9q","",1],
["2026d306_2802","k1","mon","2:10 PM","","🏡 Read Aloud","fbmusz3l9q","",1],
["2026d306_retr_drill_k1","k1","mon","3:20 PM","retrieval","🃏 Daily Drill","","drill",0],
["2026d306_retr_match_k1","k1","mon","3:25 PM","retrieval","🎯 Match & Play","","match",0],
["2026d306_2271","k1","mon","9:00 AM","","🏡 Fact Review","fbmut07y5c","",1],
["2026d306_2771","k1","mon","9:00 AM","spelling_practice","📄 Spelling Practice — Spelling Practice","","",0],
["2026d306_2775","k1","mon","9:10 AM","fact_review_with_k2","📄 Fact Review with K2 — Fact Review with K2","","",0],
["k1_k1__all_about_spelling_1_L0027","k1","mon","9:15 AM","all_about_spelling_1","📄 All About Spelling 1 — L22 Adding S to Make Words Plural · day 3 of 5","","",1],
["2026d306_2779","k1","mon","9:20 AM","handwriting","📄 Handwriting — Handwriting","","",1],
["k1_k1__arithmetic_2_L0019","k1","mon","9:25 AM","arithmetic_2","📄 Arithmetic 2 — Lesson 53","","",1],
["2026d306_2783","k1","mon","9:30 AM","independent_reading","📄 Independent Reading — Independent Reading","","",1],
["k1_k1__language_arts_2_phonics_L0022","k1","mon","9:45 AM","language_arts_2_phonics","📄 Language Arts 2 Phonics — Lesson 58","","",1],
["2026d306_2795","k4","mon","1:43 PM","","🏡 History","fbmusz3l9q","",1],
["2026d306_2799","k4","mon","1:54 PM","","🏡 Science","fbmusz3l9q","",1],
["2026d306_2803","k4","mon","2:10 PM","","🏡 Read Aloud","fbmusz3l9q","",1],
["2026d306_2772","k4","mon","9:00 AM","morning_notebook","📖 Morning Notebook — Morning Notebook","","",1],
["2026d306_2776","k4","mon","9:10 AM","drills","📄 Drills — Drills","","",1],
["2026d306_2780","k4","mon","9:20 AM","closing_notebook","📖 Closing Notebook — Closing Notebook","","",1],
["2026d306_2788","k2","mon","10:15 AM","reading","📖 Reading — Reading","","",1],
["2026d306_2790","k2","mon","10:45 AM","typing","🎹 Typing — Typing","","",1],
["k2_k2__iew_fables_myths_fairy_tales_L0016","k2","mon","10:55 AM","iew_fables_myths_fairy_tales","📄 IEW Fables, Myths & Fairy Tales — Lesson 7: Theseus and the Minotaur, Part 2 (pp. 51–56) · day 4 of 4","","",1],
["2026d306_2791","k2","mon","11:03 AM","we_remember","📄 We Remember — We Remember","","",1],
["k2_k2__apologia_math_4_L0020","k2","mon","11:25 AM","apologia_math_4","📄 Apologia Math 4 — Chapter 9 Test","","",1],
["k2_k2__cle_language_arts_4_L0020","k2","mon","11:39 AM","cle_language_arts_4","📄 CLE Language Arts 4 — 404 L3: Thank–You Notes","","",1],
["2026d306_2793","k2","mon","1:43 PM","","🏡 History","fbmusz3l9q","",1],
["2026d306_2797","k2","mon","1:54 PM","","🏡 Science","fbmusz3l9q","",1],
["2026d306_2801","k2","mon","2:10 PM","","🏡 Read Aloud","fbmusz3l9q","",1],
["2026d306_2272","k2","mon","9:00 AM","","🏡 Fact Review","fbmut07y5c","",1],
["2026d306_2778","k2","mon","9:00 AM","fact_review_with_k1","📄 Fact Review — Fact Review","","",0],
["2026d306_2774","k2","mon","9:10 AM","spelling_practice","📄 Spelling Practice — Spelling Practice","","",0],
["k2_k2__aas_4_L0158","k2","mon","9:15 AM","aas_4","📄 AAS 4 — Lesson 7 · day 3 of 5","","",1],
["2026d306_2782","k2","mon","9:20 AM","penmanship","📄 Penmanship — Penmanship","","",1],
["2026d306_2770","k2","mon","9:35 AM","checkup_spelling","📄 Checkup Spelling — Checkup Spelling","","",1],
["2026d306_2785","k2","mon","9:55 AM","piano","🎹 Piano — Piano","","",1],
["2026d306_2242","k3","mon","10:20 AM","facts_check_up","📄 Facts Check-up — Facts Check-up","","",1],
["k3_k3__saxon_math_8_7_L0018","k3","mon","10:20 AM","saxon_math_8_7","📖 Saxon Math 8/7 — Lesson 41","","",1],
["2026d306_2787","k3","mon","10:25 AM","typing_1_lesson","💻 Typing (1 lesson) — Typing (1 lesson)","","",1],
["k3_k3__fix_it_grammar_L0005","k3","mon","11:05 AM","fix_it_grammar","📖 Fix-It Grammar — Week 21","","",1],
["2026d306_2792","k3","mon","1:43 PM","","🏡 History","fbmusz3l9q","",1],
["2026d306_2796","k3","mon","1:54 PM","","🏡 Science","fbmusz3l9q","",1],
["2026d306_2800","k3","mon","2:10 PM","","🏡 Read Aloud","fbmusz3l9q","",1],
["2026d306_2773","k3","mon","9:00 AM","fact_practice","📄 Fact Practice — Fact Practice","","",1],
["2026d306_2784","k3","mon","9:10 AM","spelling_words","📄 Spelling Words — Spelling Words","","",1],
["2026d306_2769","k3","mon","9:25 AM","checkup_spelling","📄 Checkup Spelling — Checkup Spelling","","",1],
["2026d306_2777","k3","mon","9:34 AM","piano","🎹 Piano — Piano","","",1],
["2026d306_2781","k3","mon","9:55 AM","reading","📖 Reading — Reading","","",1],
["2026d307_2821","k1","tue","10:35 AM","piano","🎹 Piano — Piano","","",1],
["2026d307_2829","k1","tue","1:00 PM","","🏡 History","fbmusz3l9q","",1],
["2026d307_2833","k1","tue","1:30 PM","","🏡 Science","fbmusz3l9q","",1],
["2026d307_2837","k1","tue","2:00 PM","","🏡 Read Aloud","fbmusz3l9q","",1],
["2026d307_retr_drill_k1","k1","tue","2:20 PM","retrieval","🃏 Daily Drill","","drill",0],
["2026d307_retr_match_k1","k1","tue","2:25 PM","retrieval","🎯 Match & Play","","match",0],
["2026d307_2806","k1","tue","9:00 AM","spelling_practice","📄 Spelling Practice — Spelling Practice","","",1],
["2026d307_2810","k1","tue","9:01 AM","fact_review_with_k2","📄 Fact Review with K2 — Fact Review with K2","","",1],
["k1_k1__all_about_spelling_1_L0028","k1","tue","9:10 AM","all_about_spelling_1","📄 All About Spelling 1 — L22 Adding S to Make Words Plural · day 4 of 5","","",1],
["2026d307_2814","k1","tue","9:20 AM","handwriting","📄 Handwriting — Handwriting","","",1],
["k1_k1__language_arts_2_phonics_L0023","k1","tue","9:25 AM","language_arts_2_phonics","📄 Language Arts 2 Phonics — Lesson 59","","",1],
["2026d307_2818","k1","tue","9:30 AM","independent_reading","📄 Independent Reading — Independent Reading","","",1],
["k1_k1__arithmetic_2_L0020","k1","tue","9:55 AM","arithmetic_2","📄 Arithmetic 2 — Lesson 54","","",1],
["2026d307_2830","k4","tue","1:00 PM","","🏡 History","fbmusz3l9q","",1],
["2026d307_2834","k4","tue","1:30 PM","","🏡 Science","fbmusz3l9q","",1],
["2026d307_2838","k4","tue","2:00 PM","","🏡 Read Aloud","fbmusz3l9q","",1],
["2026d307_2807","k4","tue","9:00 AM","morning_notebook","📖 Morning Notebook — Morning Notebook","","",1],
["2026d307_2811","k4","tue","9:10 AM","drills","📄 Drills — Drills","","",1],
["2026d307_2815","k4","tue","9:17 AM","closing_notebook","📖 Closing Notebook — Closing Notebook","","",1],
["k2_k2__aas_4_L0159","k2","tue","10:30 AM","aas_4","📄 AAS 4 — Lesson 7 · day 4 of 5","","",1],
["2026d307_2826","k2","tue","10:35 AM","we_remember","📄 We Remember — We Remember","","",1],
["2026d307_2825","k2","tue","10:55 AM","typing","🎹 Typing — Typing","","",1],
["k2_k2__apologia_math_4_L0016","k2","tue","11:25 AM","apologia_math_4","📄 Apologia Math 4 — Lesson 66","","",1],
["2026d307_2828","k2","tue","1:00 PM","","🏡 History","fbmusz3l9q","",1],
["2026d307_2832","k2","tue","1:30 PM","","🏡 Science","fbmusz3l9q","",1],
["2026d307_2836","k2","tue","2:00 PM","","🏡 Read Aloud","fbmusz3l9q","",1],
["k2_k2__cle_language_arts_4_L0021","k2","tue","2:20 PM","cle_language_arts_4","📄 CLE Language Arts 4 — 404 L4: Addressing Envelopes","","",1],
["k2_k2__iew_fables_myths_fairy_tales_L0017","k2","tue","2:40 PM","iew_fables_myths_fairy_tales","📄 IEW Fables, Myths & Fairy Tales — Lesson 8: Daedalus and Icarus (pp. 57–64) · day 1 of 4","","",1],
["2026d307_2813","k2","tue","9:00 AM","fact_review_with_k1","📄 Fact Review — Fact Review","","",1],
["2026d307_2809","k2","tue","9:10 AM","spelling_practice","📄 Spelling Practice — Spelling Practice","","",1],
["2026d307_2820","k2","tue","9:11 AM","piano","🎹 Piano — Piano","","",1],
["2026d307_2817","k2","tue","9:20 AM","penmanship","📄 Penmanship — Penmanship","","",1],
["2026d307_2805","k2","tue","9:35 AM","checkup_spelling","📄 Checkup Spelling — Checkup Spelling","","",1],
["2026d307_2823","k2","tue","9:45 AM","reading","📖 Reading — Reading","","",0],
["2026d307_2819","k3","tue","10:15 AM","reading","📖 Reading — Reading","","",0],
["2026d307_2824","k3","tue","10:45 AM","typing_1_lesson","💻 Typing (1 lesson) — Typing (1 lesson)","","",1],
["k3_k3__saxon_math_8_7_L0019","k3","tue","10:45 AM","saxon_math_8_7","📖 Saxon Math 8/7 — Lesson 42","","",1],
["2026d307_2827","k3","tue","1:00 PM","","🏡 History","fbmusz3l9q","",1],
["2026d307_2831","k3","tue","1:30 PM","","🏡 Science","fbmusz3l9q","",1],
["2026d307_2835","k3","tue","2:00 PM","","🏡 Read Aloud","fbmusz3l9q","",1],
["2026d307_2808","k3","tue","9:00 AM","fact_practice","📄 Fact Practice — Fact Practice","","",1],
["2026d307_2822","k3","tue","9:10 AM","spelling_words","📄 Spelling Words — Spelling Words","","",1],
["2026d307_2804","k3","tue","9:25 AM","checkup_spelling","📄 Checkup Spelling — Checkup Spelling","","",1],
["2026d307_2812","k3","tue","9:35 AM","fix_it_practice","📖 Fix-It Practice — Fix-It Practice","","",1],
["2026d307_2641","k3","tue","9:37 AM","facts_check_up","📄 Facts Check-up — Facts Check-up","","",1],
["2026d307_2816","k3","tue","9:55 AM","piano","🎹 Piano — Piano","","",1],
["k1_k1__all_about_spelling_1_L0030","k1","wed","10:00 AM","all_about_spelling_1","📄 All About Spelling 1 — L23 Adding ES to Make Words Plural · day 1 of 5","","",1],
["2026d308_2856","k1","wed","10:35 AM","piano","🎹 Piano — Piano","","",1],
["2026d308_2864","k1","wed","1:00 PM","","🏡 History","fbmusz3l9q","",1],
["2026d308_2868","k1","wed","1:30 PM","","🏡 Science","fbmusz3l9q","",1],
["2026d308_2872","k1","wed","2:00 PM","","🏡 Read Aloud","fbmusz3l9q","",1],
["2026d308_retr_match_k1","k1","wed","2:20 PM","retrieval","🎯 Match & Play","","match",0],
["2026d308_2841","k1","wed","9:00 AM","spelling_practice","📄 Spelling Practice — Spelling Practice","","",1],
["2026d308_2845","k1","wed","9:10 AM","fact_review_with_k2","📄 Fact Review with K2 — Fact Review with K2","","",1],
["k1_k1__language_arts_2_phonics_L0024","k1","wed","9:10 AM","language_arts_2_phonics","📄 Language Arts 2 Phonics — Lesson 60","","",1],
["2026d308_2849","k1","wed","9:20 AM","handwriting","📄 Handwriting — Handwriting","","",1],
["2026d308_2853","k1","wed","9:30 AM","independent_reading","📄 Independent Reading — Independent Reading","","",1],
["k1_st_L1-22","k1","wed","9:50 AM","spelltest","📝 Spelling test: Lesson 22","","",1],
["2026d308_2865","k4","wed","1:00 PM","","🏡 History","fbmusz3l9q","",1],
["2026d308_2869","k4","wed","1:30 PM","","🏡 Science","fbmusz3l9q","",1],
["2026d308_2873","k4","wed","2:00 PM","","🏡 Read Aloud","fbmusz3l9q","",1],
["2026d308_2842","k4","wed","9:00 AM","morning_notebook","📖 Morning Notebook — Morning Notebook","","",1],
["2026d308_2846","k4","wed","9:10 AM","drills","📄 Drills — Drills","","",1],
["2026d308_2850","k4","wed","9:20 AM","closing_notebook","📖 Closing Notebook — Closing Notebook","","",1],
["2026d308_2855","k2","wed","10:15 AM","piano","🎹 Piano — Piano","","",1],
["2026d308_2861","k2","wed","10:35 AM","we_remember","📄 We Remember — We Remember","","",1],
["2026d308_2860","k2","wed","10:55 AM","typing","🎹 Typing — Typing","","",1],
["k2_k2__apologia_math_4_L0017","k2","wed","11:10 AM","apologia_math_4","📄 Apologia Math 4 — Lesson 67","","",1],
["2026d308_2863","k2","wed","1:00 PM","","🏡 History","fbmusz3l9q","",1],
["2026d308_2867","k2","wed","1:30 PM","","🏡 Science","fbmusz3l9q","",1],
["2026d308_2871","k2","wed","2:00 PM","","🏡 Read Aloud","fbmusz3l9q","",1],
["2026d308_2848","k2","wed","9:00 AM","fact_review_with_k1","📄 Fact Review — Fact Review","","",1],
["2026d308_2844","k2","wed","9:10 AM","spelling_practice","📄 Spelling Practice — Spelling Practice","","",1],
["2026d308_2852","k2","wed","9:20 AM","penmanship","📄 Penmanship — Penmanship","","",1],
["2026d308_2840","k2","wed","9:35 AM","checkup_spelling","📄 Checkup Spelling — Checkup Spelling","","",0],
["2026d308_2858","k2","wed","9:45 AM","reading","📖 Reading — Reading","","",1],
["k2_k2__iew_fables_myths_fairy_tales_L0018","k2","wed","9:50 AM","iew_fables_myths_fairy_tales","📄 IEW Fables, Myths & Fairy Tales — Lesson 8: Daedalus and Icarus (pp. 57–64) · day 2 of 4","","",1],
["2026d308_2683","k3","wed","10:01 AM","facts_check_up","📄 Facts Check-up — Facts Check-up","","",1],
["2026d308_2854","k3","wed","10:15 AM","reading","📖 Reading — Reading","","",1],
["2026d308_2859","k3","wed","10:45 AM","typing_1_lesson","💻 Typing (1 lesson) — Typing (1 lesson)","","",1],
["k3_k3__saxon_math_8_7_L0020","k3","wed","10:59 AM","saxon_math_8_7","📖 Saxon Math 8/7 — Lesson 43","","",1],
["2026d308_2862","k3","wed","1:00 PM","","🏡 History","fbmusz3l9q","",1],
["2026d308_2866","k3","wed","1:30 PM","","🏡 Science","fbmusz3l9q","",1],
["2026d308_2870","k3","wed","2:00 PM","","🏡 Read Aloud","fbmusz3l9q","",1],
["2026d308_2843","k3","wed","9:00 AM","fact_practice","📄 Fact Practice — Fact Practice","","",1],
["2026d308_2857","k3","wed","9:10 AM","spelling_words","📄 Spelling Words — Spelling Words","","",1],
["2026d308_2839","k3","wed","9:25 AM","checkup_spelling","📄 Checkup Spelling — Checkup Spelling","","",1],
["2026d308_2847","k3","wed","9:35 AM","fix_it_practice","📖 Fix-It Practice — Fix-It Practice","","",1],
["2026d308_2851","k3","wed","9:55 AM","piano","🎹 Piano — Piano","","",1],
["2026d309_2876","k1","thu","3:00 PM","fact_review_with_k2","📄 Fact Review with K2 — Fact Review with K2","","",0],
["2026d309_2879","k1","thu","3:10 PM","independent_reading","📄 Independent Reading — Independent Reading","","",0],
["2026d309_2882","k1","thu","3:40 PM","piano","🎹 Piano — Piano","","",0],
["2026d309_retr_drill_k1","k1","thu","4:00 PM","retrieval","🃏 Daily Drill","","drill",0],
["2026d309_retr_match_k1","k1","thu","4:05 PM","retrieval","🎯 Match & Play","","match",0],
["2026d309_2875","k2","thu","3:00 PM","fact_review_with_k1","📄 Fact Review — Fact Review","","",0],
["2026d309_2878","k2","thu","3:20 PM","piano","🎹 Piano — Piano","","",0],
["2026d309_2881","k2","thu","3:40 PM","reading","📖 Reading — Reading","","",0],
["2026d309_2874","k3","thu","3:00 PM","piano","🎹 Piano — Piano","","",0],
["2026d309_2877","k3","thu","3:20 PM","reading","📖 Reading — Reading","","",0],
["2026d309_2880","k3","thu","3:50 PM","spelling_words","📄 Spelling Words — Spelling Words","","",0],
["2026d310_2900","k1","fri","10:15 AM","fact_review_with_k2","📄 Fact Review with K2 — Fact Review with K2","","",0],
["2026d310_2903","k1","fri","10:25 AM","handwriting","📄 Handwriting — Handwriting","","",0],
["2026d310_2906","k1","fri","10:35 AM","independent_reading","📄 Independent Reading — Independent Reading","","",0],
["2026d310_2908","k1","fri","10:55 AM","piano","🎹 Piano — Piano","","",0],
["2026d310_2914","k1","fri","1:00 PM","","🏡 History","fbmusz3l9q","",0],
["2026d310_2918","k1","fri","1:30 PM","","🏡 Science","fbmusz3l9q","",0],
["2026d310_2922","k1","fri","2:00 PM","","🏡 Read Aloud","fbmusz3l9q","",0],
["2026d310_retr_drill_k1","k1","fri","2:50 PM","retrieval","🃏 Daily Drill","","drill",0],
["2026d310_retr_match_k1","k1","fri","2:55 PM","retrieval","🎯 Match & Play","","match",0],
["k1_k1__all_about_spelling_1_L0031","k1","fri","9:00 AM","all_about_spelling_1","📄 All About Spelling 1 — L23 Adding ES to Make Words Plural · day 2 of 5","","",0],
["2026d310_2897","k1","fri","9:10 AM","spelling_practice","📄 Spelling Practice — Spelling Practice","","",0],
["k1_k1__arithmetic_2_L0021","k1","fri","9:25 AM","arithmetic_2","📄 Arithmetic 2 — Lesson 55","","",0],
["k1_k1__language_arts_2_phonics_L0025","k1","fri","9:45 AM","language_arts_2_phonics","📄 Language Arts 2 Phonics — Lesson 61","","",0],
["2026d310_2915","k4","fri","1:00 PM","","🏡 History","fbmusz3l9q","",0],
["2026d310_2919","k4","fri","1:30 PM","","🏡 Science","fbmusz3l9q","",0],
["2026d310_2923","k4","fri","2:00 PM","","🏡 Read Aloud","fbmusz3l9q","",0],
["2026d310_2886","k4","fri","9:00 AM","morning_notebook","📖 Morning Notebook — Morning Notebook","","",0],
["2026d310_2890","k4","fri","9:10 AM","drills","📄 Drills — Drills","","",0],
["2026d310_2894","k4","fri","9:20 AM","closing_notebook","📖 Closing Notebook — Closing Notebook","","",0],
["2026d310_2910","k2","fri","10:10 AM","reading","📖 Reading — Reading","","",0],
["2026d310_2884","k2","fri","10:45 AM","checkup_spelling","📄 Checkup Spelling — Checkup Spelling","","",0],
["k2_st_L4-7","k2","fri","10:55 AM","spelltest","📝 Spelling test: Lesson 7","","",0],
["k2_k2__aas_4_L0161","k2","fri","11:05 AM","aas_4","📄 AAS 4 — Lesson 8 · day 1 of 5","","",0],
["k2_k2__apologia_math_4_L0018","k2","fri","11:25 AM","apologia_math_4","📄 Apologia Math 4 — Lesson 68","","",0],
["2026d310_2913","k2","fri","1:00 PM","","🏡 History","fbmusz3l9q","",0],
["2026d310_2917","k2","fri","1:30 PM","","🏡 Science","fbmusz3l9q","",0],
["2026d310_2921","k2","fri","2:00 PM","","🏡 Read Aloud","fbmusz3l9q","",0],
["2026d310_2911","k2","fri","2:20 PM","we_remember","📄 We Remember — We Remember","","",0],
["k2_k2__cle_language_arts_4_L0023","k2","fri","2:55 PM","cle_language_arts_4","📄 CLE Language Arts 4 — 404 L6: Finding Fragments Within Paragraphs","","",0],
["2026d310_2899","k2","fri","9:00 AM","spelling_practice","📄 Spelling Practice — Spelling Practice","","",0],
["k2_k2__iew_fables_myths_fairy_tales_L0019","k2","fri","9:10 AM","iew_fables_myths_fairy_tales","📄 IEW Fables, Myths & Fairy Tales — Lesson 8: Daedalus and Icarus (pp. 57–64) · day 3 of 4","","",0],
["2026d310_2905","k2","fri","9:30 AM","fact_review_with_k1","📄 Fact Review — Fact Review","","",0],
["2026d310_2907","k2","fri","9:40 AM","penmanship","📄 Penmanship — Penmanship","","",0],
["2026d310_2909","k2","fri","9:50 AM","piano","🎹 Piano — Piano","","",0],
["2026d310_2883","k3","fri","10:15 AM","checkup_spelling","📄 Checkup Spelling — Checkup Spelling","","",0],
["k3_k3__saxon_math_8_7_L0021","k3","fri","10:25 AM","saxon_math_8_7","📖 Saxon Math 8/7 — Lesson 44","","",0],
["2026d310_2901","k3","fri","10:45 AM","reading","📖 Reading — Reading","","",0],
["2026d310_2912","k3","fri","1:00 PM","","🏡 History","fbmusz3l9q","",0],
["2026d310_2916","k3","fri","1:30 PM","","🏡 Science","fbmusz3l9q","",0],
["2026d310_2920","k3","fri","2:00 PM","","🏡 Read Aloud","fbmusz3l9q","",0],
["2026d310_2891","k3","fri","9:00 AM","fact_practice","📄 Fact Practice — Fact Practice","","",0],
["2026d310_2895","k3","fri","9:10 AM","fix_it_practice","📖 Fix-It Practice — Fix-It Practice","","",0],
["2026d310_2898","k3","fri","9:30 AM","piano","🎹 Piano — Piano","","",0],
["2026d310_2904","k3","fri","9:50 AM","spelling_words","📄 Spelling Words — Spelling Words","","",0]];
const SUBJ={"k1":{"piano":{"tracking":"daily"},"speech":{"tracking":"daily"},"spelling_practice":{"tracking":"daily","noCarry":true},"fact_review_with_k2":{"tracking":"daily","noCarry":true},"handwriting":{"tracking":"daily"},"independent_reading":{"tracking":"daily"}},"k4":{"morning_notebook":{"tracking":"daily"},"drills":{"tracking":"daily"},"closing_notebook":{"tracking":"daily"}},"k2":{"reading":{"tracking":"daily"},"typing":{"tracking":"daily"},"we_remember":{"tracking":"daily"},"fact_review_with_k1":{"tracking":"daily","noCarry":true},"spelling_practice":{"tracking":"daily","noCarry":true},"penmanship":{"tracking":"daily"},"checkup_spelling":{"tracking":"daily","noCarry":true},"piano":{"tracking":"daily"}},"k3":{"typing_1_lesson":{"tracking":"daily"},"fact_practice":{"tracking":"daily","noCarry":true},"checkup_spelling":{"tracking":"daily","noCarry":true},"piano":{"tracking":"daily"},"reading":{"tracking":"daily"},"fix_it_practice":{"tracking":"daily"}}};
const DAYS = { mon: "monday", tue: "tuesday", wed: "wednesday", thu: "thursday", fri: "friday" };
const DATES = { monday: "November 2", tuesday: "November 3", wednesday: "November 4", thursday: "November 5", friday: "November 6" };
const THU = new Date(2026, 10, 5, 11, 47, 51);
const NEW9 = ["2026d306_retr_drill_k1", "2026d306_retr_match_k1", "2026d306_2771", "2026d306_2775", "2026d306_2778", "2026d306_2774",
  "2026d307_retr_drill_k1", "2026d307_retr_match_k1", "2026d308_retr_match_k1"];

function world(subjects) {
  const ctx = { currData: { subjects: subjects || {} }, Date, Set, String, Object, Array };
  vm.createContext(ctx);
  vm.runInContext([fn("subjNoCarry"), fn("gwNoPastNew")].join("\n"), ctx);
  return ctx;
}
function cards() {
  const tasks = [], checked = {};
  WEEK.forEach(r => { const t = { id: r[0], who: r[1], day: DAYS[r[2]], time: r[3], title: r[5] };
    if (r[4]) t.subjectKey = r[4]; if (r[6]) t.famBlock = r[6]; if (r[7]) t.retrieval = r[7]; tasks.push(t); if (r[8]) checked[t.id] = "x"; });
  return { tasks, checked };
}
function run(c, gen, old, extra) {
  return c.gwNoPastNew(gen, old, Object.assign({ dates: DATES, now: THU, checked: {}, claimed: {}, noCarry: c.subjNoCarry, consumed: () => false }, extra || {}));
}

console.log("── The live week: Thursday's 11:47 AM Regenerate ──");
{
  const c = world(SUBJ);
  const { tasks, checked } = cards();
  const old = tasks.filter(t => NEW9.indexOf(t.id) < 0).map(t => Object.assign({}, t));
  const gen = tasks.map(t => Object.assign({}, t));
  const before = gen.length;
  const gone = run(c, gen, old, { checked });
  ok("the 9 new past-day cards are left off — exactly those", J(gone.map(t => t.id).sort()) === J(NEW9.slice().sort()), gone.map(t => t.id));
  ok("Monday 6, Tuesday 2, Wednesday 1", J(["monday", "tuesday", "wednesday"].map(d => gone.filter(t => t.day === d).length)) === J([6, 2, 1]));
  ok("nothing else is touched (" + (before - 9) + " cards stay)", gen.length === before - 9);
  const left = d => gen.filter(t => t.day === d && !checked[t.id]).map(t => t.title).sort();
  ok("past days keep their own open cards exactly (Tue: two Reading; Wed: Checkup Spelling)",
    J(left("tuesday")) === J(["📖 Reading — Reading", "📖 Reading — Reading"]) && J(left("wednesday")) === J(["📄 Checkup Spelling — Checkup Spelling"]), [left("tuesday"), left("wednesday")]);
  ok("Monday's open cards are gone; all its checked cards stay", left("monday").length === 0 && gen.filter(t => t.day === "monday").every(t => checked[t.id]) &&
    gen.filter(t => t.day === "monday").length === tasks.filter(t => t.day === "monday" && checked[t.id]).length);
  ok("today (Thursday) keeps its new cards: Drill + Match", gen.some(t => t.id === "2026d310_retr_drill_k1") && gen.some(t => t.id === "2026d310_retr_match_k1"));
  ok("Friday keeps every card", gen.filter(t => t.day === "friday").length === tasks.filter(t => t.day === "friday").length);
  ok("the old family-time Fact Review (checked) stays on Monday", gen.some(t => t.id === "2026d306_2271"));
}

console.log("\n── A subject made after Monday (Thursday regenerate) ──");
{
  const c = world({ k: { nd: { tracking: "daily" }, nl: {} } });
  const mk = (id, day, sk, x) => Object.assign({ id, who: "k", day, time: "9:00 AM", subjectKey: sk, title: sk }, x || {});
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  const old = days.map((d, i) => mk("o" + i, d, "math"));
  const gen = days.map((d, i) => mk("d" + i, d, "nd")).concat(days.map((d, i) => mk("l" + i, d, "nl", { lid: "L000" + (i + 1) })));
  const gone = run(c, gen, old);
  ok("a new daily subject gets no card Mon/Tue/Wed", J(gone.map(t => t.day)) === J(["monday", "tuesday", "wednesday"]));
  ok("…and keeps Thursday (today) and Friday", gen.filter(t => t.subjectKey === "nd").map(t => t.day).join() === "thursday,friday");
  ok("a new lesson subject is left for the cascade to move forward in order (no lesson skipped)", gen.filter(t => t.subjectKey === "nl").length === 5);
}
{
  const mk = (id, day, x) => Object.assign({ id, who: "k", day, time: "9:00 AM", subjectKey: "nd", title: "nd" }, x || {});
  const old = [mk("a1", "monday"), mk("a2", "tuesday")];
  const gen = [mk("b1", "monday"), mk("b2", "tuesday"), mk("b3", "wednesday"), mk("b4", "wednesday", { id: "b4_c" }),
    mk("b5", "wednesday", { who: "j" }), mk("b6", "wednesday", { who: "j" }), mk("b7", "wednesday", { who: "j" })];
  gen[4].id = "chk"; gen[5].id = "clm"; gen[6].id = "used";
  const g2 = run(world({ k: { nd: { tracking: "daily" } }, j: { nd: { tracking: "daily" } } }), gen, old,
    { checked: { chk: "x" }, claimed: { clm: 1 }, consumed: id => id === "used" });
  ok("a past day that already had the subject keeps the regenerated card (new id, same kid + subject)", gen.some(t => t.id === "b1") && gen.some(t => t.id === "b2"));
  ok("a new one on a day that never had it goes", J(g2.map(t => t.id)) === J(["b3"]));
  ok("checked / claimed / consumed / carried (_c) cards always stay", ["chk", "clm", "used", "b4_c"].every(id => gen.some(t => t.id === id)));
}
{
  const c = world({});
  const fam = (id, day, b) => ({ id, who: "k", day, time: "1:00 PM", title: "🏡 X", famBlock: b });
  const old = [fam("f1", "monday", "A")];
  const gen = [fam("g1", "monday", "A"), fam("g2", "monday", "B"), fam("g3", "friday", "B")];
  const gone = run(c, gen, old);
  ok("family time: the block that was there stays; a block made later is left off the past day only", J(gone.map(t => t.id)) === J(["g2"]));
  const r = (id, day, kind) => ({ id: id, who: "k", day, time: "3:00 PM", subjectKey: "retrieval", retrieval: kind, title: kind });
  const old2 = [r("x_retr_drill_k", "monday", "drill")];
  const gen2 = [r("y_retr_drill_k", "monday", "drill"), r("y_retr_match_k", "monday", "match")];
  ok("retrieval: same kind stays, a new kind goes", J(run(c, gen2, old2).map(t => t.id)) === J(["y_retr_match_k"]));
}
{
  const c = world({ k: { nd: { tracking: "daily" } } });
  const gen = () => [{ id: "a", who: "k", day: "monday", subjectKey: "nd", title: "nd" }, { id: "b", who: "k", day: "tuesday", subjectKey: "nd", title: "nd" }];
  const g1 = gen(); ok("today is Monday → nothing is past, nothing left off", run(c, g1, [], { now: new Date(2026, 10, 2, 8, 0) }).length === 0 && g1.length === 2);
  const g2 = gen(); ok("Sunday (today is not a day of this week) → untouched (the Sunday catch-up as before)", run(c, g2, [], { now: new Date(2026, 10, 8, 18, 0) }).length === 0 && g2.length === 2);
  const g3 = gen(); ok("a coming week (today before it) → untouched", run(c, g3, [], { now: new Date(2026, 9, 30, 12, 0) }).length === 0 && g3.length === 2);
}

console.log("\n── gwCommit is wired ──");
{
  const g = fn("gwCommit");
  const iCall = g.indexOf("gwNoPastNew(d.tasks,weekData.tasks||[],");
  ok("gwCommit calls it on the regenerated cards against the week as it stood", iCall > 0);
  ok("…in the same-week branch, right after the check-off matching", iCall > g.indexOf("// GWC_MATCH_END") && iCall < g.indexOf("const snapSl=") && iCall > g.indexOf("else if(isSameWeek){"));
  ok("…before the carry-overs re-attach and the GC", iCall < g.indexOf("Re-attach carry-overs") && iCall < g.indexOf("// GC: purge"));
  ok("…with this week's checks, claims and consumed cards, and the real day-bound rule", ["checked:snapChecked,claimed:", "noCarry:subjNoCarry,consumed:id=>_gwConsumedCard(id,"].every(x => g.indexOf(x) > iCall && g.indexOf(x) < iCall + 400));
  ok("…and it writes nothing of its own (no db call in the block)", (() => { const b = src.slice(src.indexOf("// REGENNOPAST_START"), src.indexOf("// REGENNOPAST_END")); return b.length > 0 && !/\bdb\.|\.ref\(|\.set\(|\.update\(/.test(b); })());
  const blk = src.slice(src.indexOf("// REGENNOPAST_START"), src.indexOf("// REGENNOPAST_END"));
  ok("the block is marked, has no 🔀 and names no family or kid", blk.length > 0 && blk.indexOf("\u{1F500}") < 0 && !/andrew|kenzie|taylor|caleb|dewalt|lincoln|ellis|lucy|julian|sara\b/i.test(blk));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
