#!/usr/bin/env node
/**
 * Static export build for GitHub Pages.
 *
 * `output: "export"` cannot include server-only code (API routes, middleware,
 * OAuth/settings/login pages, server actions, ISR segment configs). Those
 * paths are stashed out of the tree, the changelog segment configs are patched
 * to static-safe literals, `next build` runs with STATIC_EXPORT=1, then
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
  "src/app/api",
  "src/app/oauth",
  "src/app/admin",
  "src/app/mcp",
  "src/app/logout",
  "src/app/.well-known",
  "src/app/videos",
  "src/app/settings",
  "src/app/login", // imports a "use server" action → export build rejects it
  "src/app/favicon.ico", // reads request headers; workflow copies a default icon
  "src/middleware.ts",
  "src/proxy.ts",
  // Next 16 typechecks test files; these import stashed server-only modules.
  "src/middleware.test.ts",
  "src/lib/mcp-allowlist.integration.test.ts",
];

// Segment configs that require a Node server (ISR revalidate, dynamicParams).
// Replacements must match exactly — fail loudly if the source drifts.
const REWRITES = [
  {
    file: "src/app/changelog/page.tsx",
    replacements: [
      ["export const revalidate = 60;", "export const revalidate = false;"],
    ],
  },
  {
    file: "src/app/changelog/[slug]/page.tsx",
    replacements: [
      ["export const revalidate = 60;", "export const revalidate = false;"],
      [
        "export const dynamicParams = true;",
        "export const dynamicParams = false;",
      ],
    ],
  },
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
      fs.rmSync(abs, { recursive: true, force: true }); // patched copy
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.renameSync(dest, abs);
  }
  fs.rmSync(stashDir, { recursive: true, force: true });
  stashed.length = 0;
}

function patchRewrites() {
  for (const { file, replacements } of REWRITES) {
    const abs = path.join(root, file);
    if (!fs.existsSync(abs)) continue;
    const original = fs.readFileSync(abs, "utf8");
    let patched = original;
    for (const [from, to] of replacements) {
      if (!patched.includes(from)) {
        throw new Error(
          `build-static: expected pattern not found in ${file}: ${JSON.stringify(from)}`,
        );
      }
      patched = patched.replace(from, to);
    }
    stashPath(file);
    fs.writeFileSync(abs, patched);
  }
}

try {
  for (const rel of STASH_PATHS) stashPath(rel);
  patchRewrites();

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
