// test_env_boothide.js — ENVBOOTHIDE (2026-11-08): the class site never paints the Howe home. Before, the 🌿 edition drew Howe's header,
// tabs, week strip and the ⚙️ Mom-PIN gear and laid the sign-in card over them; the gear peeked through the teacher/admin console and
// "Offline" + an empty Sunday showed behind the card. Now html.env-site-boot is set right after family-config.js, before the shell is laid
// out, whenever the family file says edition "envirothon"; the shell is hidden for every role, #content until the gate resolves a role.
const fs=require("fs"), path=require("path"); const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n); } };
const i=src.indexOf("// ENVBOOTHIDE_START"), j=src.indexOf("// ENVBOOTHIDE_END"); const JS=i>=0&&j>i?src.slice(i,j):"";
ok("the ENVBOOTHIDE script block is present once", JS&&src.split("// ENVBOOTHIDE_START").length===2&&src.split("// ENVBOOTHIDE_END").length===2);
ok("it sets html.env-site-boot only when HA_FAMILY.edition is \"envirothon\"", /var f=window\.HA_FAMILY; if\(f&&f\.edition==="envirothon"\) document\.documentElement\.classList\.add\("env-site-boot"\)/.test(JS));
ok("the fallback script runs right after the FAMCFG guard (after family-config.js)", src.indexOf("// FAMCFG_GUARD_END")<i && i-src.indexOf("// FAMCFG_GUARD_END")<400);
const cssAt=src.indexOf("/* ENVBOOTHIDE (2026-11-08)"), cssEnd=src.indexOf("</style>",cssAt); const CSS=cssAt>=0?src.slice(cssAt,cssEnd):"";
ok("its <style> is in <head>, before any shell markup, and is the only ENVBOOTHIDE style", CSS&&cssAt<src.indexOf("</head>")&&src.split("/* ENVBOOTHIDE (2026-11-08)").length===2);
const build=fs.readFileSync(path.join(__dirname,"envirothon/build/build_envirothon.js"),"utf8");
ok("the Envirothon build puts class=\"env-site-boot\" on <html> itself (no runtime detection, no flash)", /outHtml\.replace\(HTML_TAG, '<html lang="en" class="env-site-boot">'\)/.test(build)&&/fs\.writeFileSync\(path\.join\(OUT, "index\.html"\), outHtmlB\)/.test(build));
ok("the source <html> tag is the one the build looks for", src.split('<html lang="en">').length===2);
const ids=["app-header","nav-tabs","sched-subtabs","day-tabs","kid-filter","mom-pin-bar","skylight-panel","week-strip","admin-btn","scroll-top","hq-back","md-back","admin-panel"];
ok("every Howe shell id (the body.kiosk list + #admin-panel) is hidden under html.env-site-boot", ids.every(id=>CSS.indexOf("html.env-site-boot #"+id)>=0)&&/#admin-panel\{display:none!important\}/.test(CSS));
ok("the kiosk list is the same 12 ids (no Howe control was missed)", (()=>{ const k=src.match(/\nbody\.kiosk [^\n]*/); if(!k) return false; const got=(k[0].match(/#[a-z-]+/g)||[]).filter((v,i,a)=>a.indexOf(v)===i); return got.length===12&&got.every(h=>ids.indexOf(h.slice(1))>=0); })());
ok("#content is hidden only until the gate resolves a role (body.env-site)", /html\.env-site-boot body:not\(\.env-site\) #content\{display:none!important\}/.test(CSS));
ok("the page is the card's green until then", /html\.env-site-boot body:not\(\.env-site\)\{background:#0f2e1f\}/.test(CSS));
ok("envsEnter still sets body.env-site before it paints", /document\.body\.classList\.add\("env-site","env-role-"\+_envs\.role\)/.test(src));
ok("the shell ids really exist in the static markup", ["app-header","nav-tabs","week-strip","admin-btn","scroll-top","content"].every(id=>src.indexOf('id="'+id+'"')>=0));
const strip=JSON.parse(fs.readFileSync(path.join(__dirname,"envirothon/build/strip_list.json"),"utf8"));
ok("the build does not strip ENVBOOTHIDE", !JSON.stringify(strip.strip||[]).includes("ENVBOOTHIDE"));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
