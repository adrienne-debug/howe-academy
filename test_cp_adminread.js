// CPADMINREAD (2026-11-09): the admin console subscribes to the WHOLE classes and teachers nodes, so the rules must grant
// a node-level admin read there — Firebase refuses a parent read that only the children grant (first live sign-in).
const fs=require("fs"), assert=require("assert");
const src=fs.readFileSync(__dirname+"/index.html","utf8");
const R=JSON.parse(fs.readFileSync(__dirname+"/envirothon/SITE_RULES.json","utf8")).rules;
const ADMIN="auth != null && root.child('admins/'+auth.uid).val() == true";
let n=0; const ok=(c,m)=>{ assert(c,m); n++; };
ok(R.classes[".read"]===ADMIN,"classes: node-level admin read");
ok(R.teachers[".read"]===ADMIN,"teachers: node-level admin read");
ok(R.classes.$cid&&R.classes.$cid[".read"],"classes/$cid read rule kept");
ok(R.teachers.$uid&&R.teachers.$uid[".read"],"teachers/$uid read rule kept");
ok(!R.classes[".write"]&&!R.teachers[".write"],"no node-level write added");
// every whole-node subscription the admin console opens has a node-level read
const subs=[...src.matchAll(/envcSub\("[^"]+","([a-zA-Z]+)"/g)].map(m=>m[1]);
ok(subs.includes("classes")&&subs.includes("teachers"),"console still subscribes classes + teachers whole-node");
subs.forEach(p=>{ const node=R[p]; ok(node&&node[".read"],"whole-node subscription "+p+" has a node-level .read"); });
ok(/CPADMINREAD/.test(JSON.parse(fs.readFileSync(__dirname+"/envirothon/SITE_RULES.json","utf8"))._about),"_about notes CPADMINREAD");
console.log("test_cp_adminread: "+n+" ok");
