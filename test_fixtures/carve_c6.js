/*
 * test_fixtures/carve_c6.js — "the app before" C6 (CHOREZERO in index.html, LEDGERZERO in house.js; test_chore_zero_daily.js):
 * the given source with slice C6 taken out, each piece matched exactly once (or it throws). Used by test_chore_zero_daily.js and
 * by the tests whose own "app before" is built on a tree that C6 depends on (C3 test_chore_drop.js, C5 test_chore_daily.js).
 */
"use strict";
const once = (src, what, from, to, label) => { const n = typeof from === "string" ? src.split(from).length - 1 : (src.match(from) || []).length;
  if (n !== 1) throw new Error("carve_c6: the app before cannot be built — " + label + " found " + n + "× in " + what + " (must be exactly once)"); return src.replace(from, () => to); };
function carveIdx(s) { const R = (a, b, l) => { s = once(s, "index.html", a, b, l); };
  R(/^\/\/ CHOREZERO_START[^\n]*\n[\s\S]*?^\/\/ CHOREZERO_END\n/m, "", "the CHOREZERO block");
  R(/^ {2}if\(typeof rtZeroSee==="function"\) rtZeroSee\("morning",kid,steps\);[^\n]*\n/m, "", "the Morning list's hook");
  R(/^ {2}if\(typeof rtZeroSee==="function"\) rtZeroSee\(slot,kid,steps\);[^\n]*\n/m, "", "rtSlotHTML's hook");
  R("function rtDailyRow(st,z){ return !!st&&(st.cad||\"daily\")===\"daily\"&&(st.pts>0)!==!!z&&", "function rtDailyRow(st){ return !!st&&(st.cad||\"daily\")===\"daily\"&&(st.pts||0)>0&&", "rtDailyRow");
  R(/ z \(CHOREZERO, C6\)[^\n]*/, "", "rtDailyMissed's comment");
  R("function rtDailyMissed(slot,kid,i,st,z){\n  if(!rtDailyRow(st,z)||", "function rtDailyMissed(slot,kid,i,st){\n  if(!rtDailyRow(st)||", "rtDailyMissed");
  R(/^ {2}if\(z\)\{ const q=_todayDay==="monday"[^\n]*\n/m, "", "the walk's week check");
  R("const from=z?rtZeroFrom(kid):[RT_DAILY_FROM,", "const from=[RT_DAILY_FROM,", "the walk's start");
  R("for(let k=1;k<=(z?tp+8:6);k++){", "for(let k=1;k<=6;k++){", "the walk's length");
  R("if(!w||!m){ if(z) return -1; break; }", "if(!w||!m) break;", "the walk's last week");
  R("const lo=rtDailyLogOn(kid,w,dn,slot,st.label); if(lo){ if(z&&lo>1) return -1; break; }", "if(rtDailyLogOn(kid,w,dn,slot,st.label)) break;", "the walk's log");
  R(".indexOf(w)<0) return 2;", ".indexOf(w)<0) return true;", "rtDailyLogOn's unsure");
  R(/\+\(\(e\.zero&&e\.zero\.n\)\?[^\n]*?\/\* CHOREZERO \*\//, "", "the Click-off Log's −1");
  if (/CHOREZERO|rtZero|RT_ZERO_FROM|czero_|e\.zero/.test(s)) throw new Error("carve_c6: the app before still mentions CHOREZERO");
  return s; }
function carveHjs(s) { const R = (a, b, l) => { s = once(s, "house.js", a, b, l); };
  R(/^\/\/ LEDGERZERO_START[^\n]*\n[\s\S]*?^\/\/ LEDGERZERO_END\n/m, "", "the LEDGERZERO block");
  R(/^ {8}if\(r&&typeof lgZeroRow===[^\n]*\n/m, "", "the row hook");
  R(/^ {2}out\.lists\.forEach\(function\(L\)\{ L\.rows\.forEach\(function\(r\)\{ out\.taken\+=[^\n]*\n/m, "", "the day's taken");
  R(/^ {2}if\(on&&typeof lgZeroOff===[^\n]*\n/m, "", "the Excuse hook");
  R(/^ {2}if\(off&&typeof lgZeroOn===[^\n]*\n/m, "", "the Excuse Undo hook");
  R("+(typeof lgZeroSet===\"function\"?lgZeroSet(sep,sub):'')", "", "the setting");
  if (/LEDGERZERO|lgZero|rtZero/.test(s)) throw new Error("carve_c6: the app before's house.js still mentions LEDGERZERO");
  return s; }
module.exports = { idx: carveIdx, hjs: carveHjs };
