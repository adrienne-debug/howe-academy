/*
 * Node tests — ⚙️ CPGEAR, PR 1 of the class platform (DESIGN_class_platform_2026-10-28.md §7g, §13 row 1, §12).
 * Her answer 2026-10-28 (Q19): the bar color is the class's, set by the teacher; kids and parents have no color option at all.
 *   · The 🎨 Color card is gone from every role's ⚙️ (kid, parent, teacher, admin) and envsSetColor is removed.
 *   · Each ⚙️ shows only its own things — kid: read-aloud + Signed in; parent: PIN + Signed in; teacher/admin: Signed in;
 *     every role: Sign out + the © line.
 *   · The bars keep today's color (envsKidColor untouched — CPCLASS owns the bars); the demo writes nothing; Howe stays inert.
 * Uses the world from test_env_site.js.                                                                    run: node test_cp_gear.js
 */
const path=require("path");
const {world,src,SITE,REPO}=require("./test_env_site.js");
const LIB=require(path.join(REPO,"envirothon.js"));
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,400):"")); } };
const FAM={familyId:"envirothon",edition:"envirothon",className:"MS Science 2026-27",roster:[]};
const COLOR=/Color|envsSetColor|type="color"|envs-color|settings\/family/;
function demo(role){ const w=world({fam:FAM,search:"?demo=1&role="+role,envt:true,lib:{demo:true,tests:LIB.tests}}); w.envSiteDemoBoot(); w.renderAll(); return w; }
function gear(role){ const w=demo(role); if(role==="teacher"||role==="admin") w.envcView("settings"); else w.envsView("settings"); return w; }

console.log("── the block and the removal ──");
{ const a=src.indexOf("// CPGEAR_START"), b=src.indexOf("// CPGEAR_END");
  const G=src.slice(a,b);
  ok("one CPGEAR block, inside ENVSITE, holding envsSettingsHtml", a>0&&b>a&&src.indexOf("// CPGEAR_START",a+1)<0&&src.indexOf("// CPGEAR_END",b+1)<0&&SITE.indexOf("// CPGEAR_START")>0&&/function envsSettingsHtml\(\)\{/.test(G));
  ok("the block cites her answer and the date", /2026-10-28/.test(G.split("\n")[0])&&/Q19/.test(G));
  ok("envsSetColor is gone from index.html (no definition, no caller)", src.indexOf("envsSetColor")<0||src.indexOf("envsSetColor")===src.indexOf("envsSetColor with it"));
  ok("no color input anywhere on the site (envs-color / type=\"color\")", !/envs-color/.test(src)&&!/type="color"/.test(SITE));
  ok("the ⚙️ no longer reads envsKidColor or writes settings/family/<i>/color", !/envsKidColor|settings\/family|db\.ref/.test(G.slice(G.indexOf("function envsSettingsHtml"))));
  ok("envsKidColor itself is untouched: the bars keep today's color (CPCLASS owns the bars)", /function envsKidColor\(kid\)\{ try\{ return \(typeof KID_COLOR!=="undefined"&&KID_COLOR\[kid\]\)\|\|"#14532d"; \}catch\(e\)\{ return "#14532d"; \} \}/.test(src)&&(src.match(/col=envsKidColor\(kid\)/g)||[]).length===2); }

console.log("\n── each role's ⚙️ shows only its own things ──");
{ const k=gear("kid"), h=k.G.content;
  ok("kid: no Color card", !COLOR.test(h));
  ok("kid: the read-aloud switch + Signed in + Sign out + the © line", /envra-toggle/.test(h)&&/Signed in/.test(h)&&/envsSignOut\(\)/.test(h)&&h.indexOf(k.envsLicenseLine())>=0);
  ok("kid: no PIN, no family editing", !/PIN/.test(h)&&!/Add kid|Remove/.test(h)); }
{ const p=gear("parent"), h=p.G.content;
  ok("parent: no Color card", !COLOR.test(h));
  ok("parent: the PIN + Signed in + Sign out + the © line", /Parent PIN/.test(h)&&/envsSetPin\(\)/.test(h)&&/Signed in/.test(h)&&/envsSignOut\(\)/.test(h)&&h.indexOf(p.envsLicenseLine())>=0);
  ok("parent: no read-aloud switch", !/envra-toggle/.test(h)); }
for(const role of ["teacher","admin"]){ const t=gear(role), h=t.G.content;
  ok(role+": the ⚙️ is open and has no Color card", /Signed in/.test(h)&&!COLOR.test(h));
  ok(role+": Signed in + Sign out + the © line; no PIN, no read-aloud switch", /envsSignOut\(\)/.test(h)&&h.indexOf(t.envsLicenseLine())>=0&&!/PIN/.test(h)&&!/envra-toggle/.test(h)); }

console.log("\n── the bars keep today's color; nothing is written ──");
{ const bar=w=>(w.G.content.match(/class="envs-top" style="background:(#[0-9a-f]{6})"/i)||[])[1];
  const k=demo("kid"), p=demo("parent");
  ok("the kid's and parent's top bars still paint a color ("+bar(k)+", "+bar(p)+")", !!bar(k)&&!!bar(p));
  for(const role of ["kid","parent","teacher","admin"]){ const w=gear(role);
    ok(role+": opening the ⚙️ in the demo writes nothing", w.G.writes.length===0&&!(w._envs.writes||[]).length); } }

console.log("\n── Howe stays inert ──");
{ const h=world({fam:{familyId:"howe",roster:[]}});
  ok("no edition: nothing rendered, created, read or written", h.envSiteRender(h.G.contentEl)===false&&h.G.created.length===0&&h.G.writes.length===0&&h.G.reads.length===0&&h.G.content===""); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
