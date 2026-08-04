// ── PER-FAMILY DEPLOYMENT CONFIG ────────────────────────────────────────────
// This is the ONLY file that differs between family deployments. Everything a
// deployment needs to know about WHICH family it serves lives here: the family's
// own Firebase project and the starting kid roster. index.html falls back to its
// built-in Howe values if this file is missing, so it can never break the app.
//
// The roster below is only the FIRST-BOOT default — once the family saves names
// in Admin → Settings → Family, the app reads settings/family from their
// database and this list is ignored.
window.HA_FAMILY = {
  familyId: "howe",
  familyName: "Howe Academy",
  firebase: {
    apiKey:"AIzaSyC-wxpjLGu9vr1DgMHY0Dd1AFYVdU4-D4g",
    authDomain:"howeacademy.firebaseapp.com",
    databaseURL:"https://howeacademy-default-rtdb.firebaseio.com",
    projectId:"howeacademy",
    storageBucket:"howeacademy.firebasestorage.app",
    messagingSenderId:"581111328425",
    appId:"1:581111328425:web:d3e5f580036fb8898983b8"
  },
  roster: [
    {id:"lincoln", name:"Lincoln", color:"#1e3a5f", badge:"#dbeafe", schoolAge:true},
    {id:"ellis",   name:"Ellis",   color:"#2d5a3d", badge:"#dcfce7", schoolAge:true},
    {id:"lucy",    name:"Lucy",    color:"#5b3a8c", badge:"#ede9fe", schoolAge:true},
    {id:"julian",  name:"Julian",  color:"#c45e1a", badge:"#ffedd5", schoolAge:false} // Pre-K: no 180-day attendance, separate drills track
  ]
};
