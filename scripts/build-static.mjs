#!/usr/bin/env node
/**
 * Static export build for GitHub Pages — landing page only.
 *
 * `output: "export"` cannot include server-only code (API routes, middleware,
 * OAuth/settings/login pages, server actions) and the GitHub Actions runner
 * cannot clone the private Azure mcp-contract submodule. Those paths are
 * stashed out of the tree, `next build` runs with STATIC_EXPORT=1, then
 * everything is restored in a finally block — even on build failure.
 *
 * Normal `bun run build` (standalone/Docker) is unaffected.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stashDir = path.join(root, ".next-export-stash");

// Server-only routes/pages: Node runtime, headers()/cookies(), middleware.
const STASH_PATHS = [
  // Landing-only export: home, docs and changelog need request headers,
  // the private mcp submodule (docs) or the GitHub changelog API.
  "src/app/page.tsx",
  "src/app/docs",
  "src/app/changelog",
  "src/app/api",
  "src/app/oauth",
  "src/app/admin",
  "src/app/mcp",
  "src/app/logout",
  "src/app/.well-known",
  "src/app/videos",
  "src/app/settings",
  "src/app/login", // imports a "use server" action → export build rejects it
  "src/app/favicon.ico", // reads request headers; script copies a default icon
  "src/middleware.ts",
  "src/proxy.ts",
  // Private Azure submodule (src/contracts/mcp) is not cloned in CI;
  // these libs (and their tests) only serve server-only routes.
  "src/lib/mcp-contract.ts",
  "src/lib/mcp-contract.test.ts",
  "src/lib/mcp-protocol.ts",
  "src/lib/mcp-protocol.test.ts",
  "src/lib/mcp-tools.ts",
  "src/lib/mcp-tools.test.ts",
  "src/lib/mcp-tools.bubble.test.ts",
  // Next 16 typechecks test files; these import stashed server-only modules.
  "src/middleware.test.ts",
  "src/lib/mcp-allowlist.integration.test.ts",
];

/** @type {{ abs: string; dest: string }[]} */
const stashed = [];

function stashPath(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return;
  const dest = path.join(stashDir, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(abs, dest);
  stashed.push({ abs, dest });
}

function restore() {
  for (const { abs, dest } of stashed.reverse()) {
    if (fs.existsSync(abs)) {
      fs.rmSync(abs, { recursive: true, force: true });
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.renameSync(dest, abs);
  }
  fs.rmSync(stashDir, { recursive: true, force: true });
  stashed.length = 0;
}

try {
  for (const rel of STASH_PATHS) stashPath(rel);

  // The landing page becomes the root route: stash the real home page, then
  // put the landing page source at src/app/page.tsx for this build only.
  stashPath("src/app/landing/page.tsx");
  fs.writeFileSync(
    path.join(root, "src", "app", "page.tsx"),
    fs.readFileSync(
      path.join(stashDir, "src", "app", "landing", "page.tsx"),
      "utf8",
    ),
  );

  // Stale generated route types from `next dev` list the stashed routes and
  // break typecheck (tsconfig includes .next/dev/types). CI has a fresh tree;
  // local runs need the wipe.
  fs.rmSync(path.join(root, ".next", "dev"), { recursive: true, force: true });

  execSync("bunx next build --turbopack", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, STATIC_EXPORT: "1" },
  });

  // GitHub Pages runs Jekyll by default, which drops `_next/` (underscore
  // prefix). .nojekyll disables that.
  fs.writeFileSync(path.join(root, "out", ".nojekyll"), "");

  // Default-tenant favicon: the server route (per-tenant, header-based) is not
  // part of the static export.
  const favSrc = path.join(root, "public", "favicons", "hyperjump.ico");
  if (fs.existsSync(favSrc)) {
    fs.copyFileSync(favSrc, path.join(root, "out", "favicon.ico"));
  }

  console.log("build-static: export ready in out/");
} finally {
  restore();
}
