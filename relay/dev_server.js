// Local stand-in for `wrangler dev`: runs worker.js on http://localhost:8787 with in-memory storage,
// so the relay can be tried on the Mac with no Cloudflare account and nothing deployed.
//   run:  node relay/dev_server.js        (Ctrl-C to stop; storage is forgotten on exit)
import http from "node:http";
import worker from "./worker.js";

const PORT = Number(process.env.PORT || 8787);
const store = new Map();
const env = {
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "https://adrienne-debug.github.io,http://localhost:8774",
  FEEDS: { async get(k) { return store.has(k) ? store.get(k) : null; }, async put(k, v) { store.set(k, v); }, async delete(k) { store.delete(k); } }
};

http.createServer(async function (inReq, out) {
  const chunks = [];
  for await (const c of inReq) chunks.push(c);
  const body = chunks.length && inReq.method !== "GET" && inReq.method !== "HEAD" ? Buffer.concat(chunks) : undefined;
  const res = await worker.fetch(new Request("http://localhost:" + PORT + inReq.url, { method: inReq.method, headers: inReq.headers, body }), env);
  out.writeHead(res.status, Object.fromEntries(res.headers));
  out.end(Buffer.from(await res.arrayBuffer()));
  console.log(inReq.method, inReq.url.slice(0, 80), "→", res.status);
}).listen(PORT, function () { console.log("calendar relay (local) on http://localhost:" + PORT); });
