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

  // Default to index.html
  if (pathname === "/" || pathname === "/landing") {
    pathname = "/index.html";
  }

  // Handle RSC prefetch gracefully if requested
  if (url.searchParams.has("_rsc")) {
    if (url.pathname.includes("landing") && fs.existsSync(path.join(PUBLIC_DIR, "landing.rsc"))) {
      pathname = "/landing.rsc";
    } else if (url.pathname.includes("login") && fs.existsSync(path.join(PUBLIC_DIR, "login.rsc"))) {
      pathname = "/login.rsc";
    }
  }

  const filePath = path.join(PUBLIC_DIR, pathname);

  // Security check: ensure path is within directory
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA-style routing if needed
      const indexPath = path.join(PUBLIC_DIR, "index.html");
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        fs.createReadStream(indexPath).pipe(res);
        return;
      }
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`Not Found: ${pathname}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600"
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\x1b[32m✔ Sinarmas Landing Page static server running at:\x1b[0m`);
  console.log(`  \x1b[36mhttp://localhost:${PORT}/\x1b[0m\n`);
  console.log(`Press Ctrl+C to stop.`);
});
