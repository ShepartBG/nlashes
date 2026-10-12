// Локален сървър: node server.js  →  http://localhost:4321
const http = require("http"), fs = require("fs"), path = require("path");
const root = __dirname, port = process.env.PORT || 4321;
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, path.normalize(p));
  if (!f.startsWith(root)) return res.writeHead(403).end();
  fs.readFile(f, (err, data) => {
    if (err) return res.writeHead(404).end("Not found");
    res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(port, () => console.log("N Lashes: http://localhost:" + port));
