/*
 * Node tests for the class LINK and the in-app class screen.
 *
 * ⚠ Context that shapes this whole feature: Outschool sends `x-frame-options: SAMEORIGIN`
 * (verified against the real classroom URL 2026-09-12), so the class CANNOT be embedded in
 * the app. The class therefore opens in its own tab and the "header back to the app" lives
 * on a full-screen app page that stays put behind it. These tests pin that contract.
 *
 *   run:  node test_fixed_class_link.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function extractFn(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let depth = 0, started = false;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    const c = src[k];
    if (c === "{") { depth++; started = true; }
    else if (c === "}") { depth--; if (started && depth === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced: " + name);
}

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra ? "  (" + extra + ")" : "")); }
}

console.log("\nA) Only a real web link is ever opened\n");

const fxSafeUrl = new Function(extractFn("fxSafeUrl") + "; return fxSafeUrl;")();

ok("https passes", fxSafeUrl("https://outschool.com/classroom/abc") === "https://outschool.com/classroom/abc");
ok("http passes", fxSafeUrl("http://example.com/x") === "http://example.com/x");
ok("surrounding whitespace trimmed", fxSafeUrl("  https://a.b/c  ") === "https://a.b/c");
ok("empty gives empty", fxSafeUrl("") === "");
ok("null gives empty", fxSafeUrl(null) === "");
ok("javascript: is refused", fxSafeUrl("javascript:alert(1)") === "");
ok("data: is refused", fxSafeUrl("data:text/html,<h1>x") === "");
ok("a bare domain is refused (no scheme)", fxSafeUrl("outschool.com/classroom") === "");
ok("file: is refused", fxSafeUrl("file:///etc/passwd") === "");
ok("case-insensitive scheme passes", fxSafeUrl("HTTPS://a.b/c") === "HTTPS://a.b/c");

console.log("\nB) The class screen carries the header and the two actions\n");

(() => {
  const ENV = { html: "", display: "", opened: [], tapped: [], ls: {} };
  const render = new Function("ENV", `
    const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    let fxClassOpen=null;
    const FX_LS="ha_fx_class";
    const localStorage={ getItem:k=>ENV.ls[k]===undefined?null:ENV.ls[k],
                         setItem:(k,v)=>{ENV.ls[k]=v;}, removeItem:k=>{delete ENV.ls[k];} };
    const document={ getElementById:()=>({ set innerHTML(v){ENV.html=v;}, get innerHTML(){return ENV.html;},
                                           style:{ set display(v){ENV.display=v;}, get display(){return ENV.display;} } }) };
    const window={ open:(u,t,f)=>ENV.opened.push([u,t,f]) };
    function renderAll(){}
    function tapTask(id){ ENV.tapped.push(id); }
    function gwGetSubjects(kid){ return ENV.subjects[kid]||{}; }
    ${extractFn("fxClassPersist")}
    ${extractFn("fxSafeUrl")}
    ${extractFn("fxOpenClassScreen")}
    ${extractFn("fxCloseClassScreen")}
    ${extractFn("fxLaunchClass")}
    ${extractFn("fxFinishClass")}
    ${extractFn("fxRenderClassScreen")}
    return {
      open:(k,s,t)=>fxOpenClassScreen(k,s,t),
      launch:()=>fxLaunchClass(),
      finish:()=>fxFinishClass(),
      close:()=>fxCloseClassScreen(),
      state:()=>fxClassOpen,
    };
  `);

  ENV.subjects = { lincoln: { german: {
    display: "German (Outschool)", fixedTime: "10:00 AM", minutes: 45,
    joinUrl: "https://outschool.com/classroom/e3eab421-c77d-46ea-b162-ce84fb9ada0e",
  } } };
  const api = render(ENV);

  api.open("lincoln", "german", "t_123");
  ok("screen is shown", ENV.display === "block", ENV.display);
  ok("header has a way back to his day", /fx-cls-back[^>]*onclick="fxCloseClassScreen\(\)"/.test(ENV.html));
  ok("header says 'My day'", /My day/.test(ENV.html));
  ok("header is sticky by class", /class="fx-cls-hd"/.test(ENV.html));
  ok("class name is shown", /German \(Outschool\)/.test(ENV.html));
  ok("the time is shown", /10:00 AM/.test(ENV.html) && /45 min/.test(ENV.html), ENV.html.slice(0, 200));
  ok("there is an Open-my-class button", /fx-cls-go[^>]*onclick="fxLaunchClass\(\)"/.test(ENV.html));
  ok("there is an I-finished button", /onclick="fxFinishClass\(\)"/.test(ENV.html));
  ok("it tells him the class opens in a new tab", /new tab/.test(ENV.html));

  // Launch opens the class in its own tab, with noopener.
  api.launch();
  ok("launch opens the real join URL in a new tab",
    ENV.opened.length === 1 && ENV.opened[0][0].indexOf("outschool.com/classroom/") > 0 && ENV.opened[0][1] === "_blank",
    JSON.stringify(ENV.opened));
  ok("launch passes noopener,noreferrer", /noopener/.test(ENV.opened[0][2] || ""), ENV.opened[0][2]);

  // The screen persists so a reload mid-class comes back to it.
  ok("state is persisted for a reload", !!ENV.ls.ha_fx_class, JSON.stringify(ENV.ls));

  // Finishing goes through the NORMAL check-off path, so points/pace behave as usual.
  api.finish();
  ok("finishing checks the card through tapTask", JSON.stringify(ENV.tapped) === JSON.stringify(["t_123"]), JSON.stringify(ENV.tapped));
  ok("finishing closes the screen", api.state() === null && ENV.display === "none", ENV.display);
  ok("finishing clears the persisted state", ENV.ls.ha_fx_class === undefined, JSON.stringify(ENV.ls));
})();

console.log("\nC) A class with no link set still works\n");

(() => {
  const ENV = { html: "", display: "", opened: [], tapped: [], ls: {} };
  const render = new Function("ENV", `
    const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    let fxClassOpen=null;
    const FX_LS="ha_fx_class";
    const localStorage={ getItem:k=>ENV.ls[k]===undefined?null:ENV.ls[k],
                         setItem:(k,v)=>{ENV.ls[k]=v;}, removeItem:k=>{delete ENV.ls[k];} };
    const document={ getElementById:()=>({ set innerHTML(v){ENV.html=v;}, get innerHTML(){return ENV.html;},
                                           style:{ set display(v){ENV.display=v;}, get display(){return ENV.display;} } }) };
    const window={ open:(u,t,f)=>ENV.opened.push([u,t,f]) };
    function renderAll(){}
    function tapTask(id){ ENV.tapped.push(id); }
    function gwGetSubjects(kid){ return ENV.subjects[kid]||{}; }
    ${extractFn("fxClassPersist")}
    ${extractFn("fxSafeUrl")}
    ${extractFn("fxOpenClassScreen")}
    ${extractFn("fxCloseClassScreen")}
    ${extractFn("fxLaunchClass")}
    ${extractFn("fxFinishClass")}
    ${extractFn("fxRenderClassScreen")}
    return { open:(k,s,t)=>fxOpenClassScreen(k,s,t), launch:()=>fxLaunchClass(), state:()=>fxClassOpen };
  `);

  ENV.subjects = { lincoln: { tutor: { display: "Piano lesson", fixedTime: "1:00 PM", minutes: 30 } } };
  const api = render(ENV);
  api.open("lincoln", "tutor", "t_9");
  ok("screen still opens without a link", ENV.display === "block");
  ok("it still has the header back to his day", /onclick="fxCloseClassScreen\(\)"/.test(ENV.html));
  ok("it says where Mom sets the link", /Set time/.test(ENV.html), ENV.html.slice(0, 300));
  ok("no Open-my-class button when there is no link", !/fxLaunchClass/.test(ENV.html));
  api.launch();
  ok("launching with no link opens nothing", ENV.opened.length === 0, JSON.stringify(ENV.opened));
})();

(() => {
  // A dangerous joinUrl must never reach window.open.
  const ENV = { html: "", display: "", opened: [], tapped: [], ls: {} };
  const render = new Function("ENV", `
    const esc=s=>String(s);
    let fxClassOpen=null;
    const FX_LS="ha_fx_class";
    const localStorage={ getItem:()=>null, setItem:()=>{}, removeItem:()=>{} };
    const document={ getElementById:()=>({ set innerHTML(v){ENV.html=v;}, style:{ set display(v){ENV.display=v;} } }) };
    const window={ open:(u)=>ENV.opened.push(u) };
    function renderAll(){}
    function tapTask(){}
    function gwGetSubjects(kid){ return ENV.subjects[kid]||{}; }
    ${extractFn("fxClassPersist")}
    ${extractFn("fxSafeUrl")}
    ${extractFn("fxOpenClassScreen")}
    ${extractFn("fxLaunchClass")}
    ${extractFn("fxRenderClassScreen")}
    return { open:(k,s,t)=>fxOpenClassScreen(k,s,t), launch:()=>fxLaunchClass(), state:()=>fxClassOpen };
  `);
  ENV.subjects = { lincoln: { bad: { display: "X", fixedTime: "9:00 AM", joinUrl: "javascript:alert(1)" } } };
  const api = render(ENV);
  api.open("lincoln", "bad", "t_1");
  api.launch();
  ok("a javascript: joinUrl is never opened", ENV.opened.length === 0, JSON.stringify(ENV.opened));
  ok("and it is stripped from the stored state", api.state().url === "", JSON.stringify(api.state()));
})();

console.log("\nD) The card only offers the class door for a real class\n");

(() => {
  // The card builds classRow from the subject record; assert the guard shape in source
  // rather than rendering the whole card (renderTask has ~40 collaborators).
  const i = src.indexOf("let classRow=");
  ok("classRow exists on the card", i > 0);
  const row = src.slice(i, i + 1800);
  ok("it opens the in-app screen, not the raw link",
    /fxOpenClassScreen\(/.test(row) && !/window\.open/.test(row), row.slice(0, 120));
  ok("it is hidden once the class is done", /if\(_fxC&&!done\)/.test(src.slice(i, i + 120)));
  const guard = src.slice(src.indexOf("const _fxC="), src.indexOf("const _fxC=") + 120);
  ok("only a fixed-time class gets the door", /fxIsClass\(_fxS\)/.test(guard), guard);
  ok("the class row is rendered into the card body",
    /spinBtn\+classRow\+linkRow\+wbRow/.test(src));
})();

console.log("\nE) The door only opens around class time\n");

(() => {
  // German: 10:00 AM, 45 min => window 9:30 .. 11:00 (end 10:45 + 15 grace).
  const german = { display:"German", fixedTime:"10:00 AM", minutes:45 };
  const mk = (nowMin, momMode, cardDay, today) => new Function("N","MOM","CD","TD", `
    const toMin=(t)=>{ const m=String(t).trim().match(/^(\\d{1,2}):(\\d{2})\\s*(AM|PM)?$/i); if(!m) return NaN;
      let h=parseInt(m[1],10); const mi=parseInt(m[2],10); const ap=(m[3]||"").toUpperCase();
      if(ap==="PM"&&h!==12)h+=12; if(ap==="AM"&&h===12)h=0; return h*60+mi; };
    const fromMin=(v)=>{ let h=Math.floor(v/60),m=v%60; const ap=h>=12?"PM":"AM"; let hh=h%12; if(hh===0)hh=12;
      return hh+":"+String(m).padStart(2,"0")+" "+ap; };
    function momHere(){ return MOM; }
    const _todayDay=TD;
    const Date=function(){ return { getHours:()=>Math.floor(N/60), getMinutes:()=>N%60 }; };
    const FX_JOIN_LEAD=30, FX_JOIN_GRACE=15;
    ${extractFn("fxJoinWindow")}
    ${extractFn("fxJoinState")}
    return fxJoinState(${JSON.stringify(german)}, CD);
  `)(nowMin, momMode, cardDay, today);

  const w = new Function("toMin", `const FX_JOIN_LEAD=30, FX_JOIN_GRACE=15;
    ${extractFn("fxJoinWindow")}
    return fxJoinWindow({fixedTime:"10:00 AM",minutes:45});`)(
    (t)=>{ const m=String(t).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); let h=parseInt(m[1],10);
      const mi=parseInt(m[2],10); const ap=(m[3]||"").toUpperCase();
      if(ap==="PM"&&h!==12)h+=12; if(ap==="AM"&&h===12)h=0; return h*60+mi; });
  ok("window opens 30 min before the start (9:30 = 570)", w.open === 570, JSON.stringify(w));
  ok("window closes 15 min after the END, not the start (11:00 = 660)", w.close === 660, JSON.stringify(w));

  ok("9:00 — too early, shut", mk(540,false,"wednesday","wednesday").ready === false);
  ok("9:00 — says when it opens", mk(540,false,"wednesday","wednesday").at === "9:30 AM");
  ok("9:30 — open on the dot", mk(570,false,"wednesday","wednesday").ready === true);
  ok("10:00 — open at class start", mk(600,false,"wednesday","wednesday").ready === true);
  ok("10:35 — STILL open mid-class (the rejoin case)", mk(635,false,"wednesday","wednesday").ready === true);
  ok("10:50 — open during the grace tail", mk(650,false,"wednesday","wednesday").ready === true);
  ok("11:05 — shut, class is over", mk(665,false,"wednesday","wednesday").ready === false);
  ok("11:05 — reason is 'over'", mk(665,false,"wednesday","wednesday").why === "over");

  ok("Mom gets in at 8am regardless", mk(480,true,"wednesday","wednesday").ready === true);
  ok("Mom gets in after it ended", mk(665,true,"wednesday","wednesday").ready === true);

  ok("a card on another day is not time-gated open", mk(600,false,"friday","wednesday").ready === false);
  ok("another day's reason is 'otherday'", mk(600,false,"friday","wednesday").why === "otherday");

  const noTime = new Function("toMin", `const FX_JOIN_LEAD=30, FX_JOIN_GRACE=15;
    function momHere(){ return false; }
    ${extractFn("fxJoinWindow")}
    ${extractFn("fxJoinState")}
    return fxJoinState({display:"x"},"wednesday");`)(()=>NaN);
  ok("a class with no parseable time is shut, not open", noTime.ready === false && noTime.why === "notime", JSON.stringify(noTime));
})();

(() => {
  // The card must render a SHUT state, not nothing — a vanished button reads as broken.
  const i = src.indexOf("let classRow=");
  ok("classRow has an open and a shut branch", i > 0 && /_js\.ready/.test(src.slice(i, i + 900)));
  const blk = src.slice(i, i + 1800);
  ok("the shut chip says when it opens", /Opens at/.test(blk));
  ok("the shut chip covers the ended case", /Class has ended/.test(blk));
  ok("the shut chip has no onclick", (() => {
    const shut = blk.slice(blk.indexOf("const _lbl="));
    return !/onclick/.test(shut);
  })(), "shut branch must not be tappable");
})();

console.log("\n" + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);
