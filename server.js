#!/usr/bin/env node
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".mp4": "video/mp4",
  ".rsc": "text/x-component"
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === "/" || pathname === "/landing") {
    pathname = "/index.html";
  }

  if (url.searchParams.has("_rsc")) {
    if (url.pathname.includes("landing") && fs.existsSync(path.join(PUBLIC_DIR, "landing.rsc"))) {
      pathname = "/landing.rsc";
    } else if (url.pathname.includes("login") && fs.existsSync(path.join(PUBLIC_DIR, "login.rsc"))) {
      pathname = "/login.rsc";
    }
  }

  const filePath = path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  function serveFile(targetPath, stats) {
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    if (ext === ".html") {
      fs.readFile(targetPath, "utf8", (readErr, content) => {
        if (readErr) {
          res.writeHead(500);
          res.end("Internal Server Error");
          return;
        }
        const host = req.headers["x-forwarded-host"] || req.headers.host;
        if (host && !host.includes("searchpoint.tech")) {
          const proto = req.headers["x-forwarded-proto"] || "http";
          content = content
            .split("https://searchpoint.tech")
            .join(`${proto}://${host}`)
            .split("searchpoint.tech")
            .join(host);
        }
        const buf = Buffer.from(content, "utf8");
        res.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": "no-cache",
          "Content-Length": buf.length
        });
        res.end(buf);
      });
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": ext === ".png" ? "no-cache" : "public, max-age=3600",
      "Content-Length": stats.size
    });
    fs.createReadStream(targetPath).pipe(res);
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexPath = path.join(PUBLIC_DIR, "index.html");
      fs.stat(indexPath, (indexErr, indexStats) => {
        if (!indexErr && indexStats.isFile()) {
          serveFile(indexPath, indexStats);
          return;
        }
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end(`Not Found: ${pathname}`);
      });
      return;
    }

    serveFile(filePath, stats);
  });
});

server.listen(PORT, () => {
  console.log(`\x1b[32m✔ SearchPoint (${path.basename(PUBLIC_DIR)}) static server running at:\x1b[0m`);
  console.log(`  \x1b[36mhttp://localhost:${PORT}/\x1b[0m\n`);
  console.log(`Press Ctrl+C to stop.`);
});
