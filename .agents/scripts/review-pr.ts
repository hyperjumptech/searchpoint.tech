#!/usr/bin/env tsx
/**
 * Azure DevOps PR Review — AI-powered
 *
 * Usage:
 *   tsx .agents/scripts/review-pr.ts <PR_ID> --claude [--post]
 *   tsx .agents/scripts/review-pr.ts <PR_ID> --agy    [--post]
 *
 * Flags:
 *   --claude : Use Claude CLI for the review
 *   --agy    : Use Antigravity CLI for the review
 *   --post   : Post the review as a PR comment in Azure DevOps
 */

import { spawn, spawnSync } from "node:child_process";
import {
  readFileSync,
  existsSync,
  writeFileSync,
  rmSync,
  mkdtempSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

// ── Colored logging ─────────────────────────────────────────
const c = {
  red: "\x1b[0;31m",
  green: "\x1b[0;32m",
  yellow: "\x1b[1;33m",
  cyan: "\x1b[0;36m",
  reset: "\x1b[0m",
};
const info = (msg: string) => console.log(`${c.cyan}[INFO]${c.reset} ${msg}`);
const warn = (msg: string) => console.log(`${c.yellow}[WARN]${c.reset} ${msg}`);
const success = (msg: string) =>
  console.log(`${c.green}[OK]${c.reset}   ${msg}`);
const fail = (msg: string): never => {
  console.error(`${c.red}[ERROR]${c.reset} ${msg}`);
  process.exit(1);
};

// ── AI backend config ───────────────────────────────────────
interface AIBackend {
  name: string;
  cmd: string;
  args: string[];
  label: string;
}

const BACKENDS: Record<string, AIBackend> = {
  claude: {
    name: "Claude",
    cmd: "claude",
    args: ["--print"],
    label: "Claude CLI",
  },
  agy: {
    name: "Antigravity",
    cmd: "agy",
    args: ["--print"],
    label: "Antigravity CLI (agy)",
  },
};

// ── Args ────────────────────────────────────────────────────
const args = process.argv.slice(2);
const prId = args.find((a) => !a.startsWith("--"));
const postComment = args.includes("--post");

const backendKey = Object.keys(BACKENDS).find((k) => args.includes(`--${k}`));
if (!prId || !backendKey) {
  fail("Usage: review-pr.ts <PR_ID> --claude|--agy [--post]");
}
const backend = BACKENDS[backendKey];

// ── Load .env from script directory ─────────────────────────
const scriptDir = dirname(fileURLToPath(import.meta.url));
const envPath = join(scriptDir, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const [, k, rawV] = m;
    const v = rawV.replace(/^["']|["']$/g, "");
    if (!(k in process.env)) process.env[k] = v;
  }
}

// ── Required env vars ────────────────────────────────────────
const requireEnv = (name: string): string =>
  process.env[name] ?? (fail(`Set ${name}`) as never);

const ADO_ORG = requireEnv("ADO_ORG");
const ADO_PROJECT = requireEnv("ADO_PROJECT");
const ADO_REPO = requireEnv("ADO_REPO");
const ADO_PAT = requireEnv("ADO_PAT");

const ADO_BASE = `https://dev.azure.com/${ADO_ORG}/${encodeURIComponent(ADO_PROJECT)}/_apis`;
const AUTH = `Basic ${Buffer.from(`:${ADO_PAT}`).toString("base64")}`;

// ── HTTP helpers ─────────────────────────────────────────────
async function ado<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${ADO_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: AUTH,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    fail(`${init.method ?? "GET"} ${url} → ${res.status}\n${body}`);
  }
  return res.json() as Promise<T>;
}

// Returns file content at a specific commit, "" if absent, null if binary/error
async function fetchFileAt(
  commitId: string,
  filePath: string,
): Promise<string | null> {
  const url =
    `${ADO_BASE}/git/repositories/${ADO_REPO}/items` +
    `?path=${encodeURIComponent(filePath)}` +
    `&versionDescriptor.version=${commitId}` +
    `&versionDescriptor.versionType=commit` +
    `&$format=text&api-version=7.1`;
  const res = await fetch(url, { headers: { Authorization: AUTH } });
  if (res.status === 404) return ""; // file absent at this commit
  if (!res.ok) return null;
  const text = await res.text();
  if (text.includes("\x00")) return null; // binary
  return text;
}

// ── Unified diff ─────────────────────────────────────────────
function unifiedDiff(oldText: string, newText: string, label: string): string {
  const dir = mkdtempSync(join(tmpdir(), "pr-review-"));
  const a = join(dir, "a");
  const b = join(dir, "b");
  try {
    writeFileSync(a, oldText);
    writeFileSync(b, newText);
    const result = spawnSync(
      "diff",
      ["-u", "-L", `a/${label}`, "-L", `b/${label}`, a, b],
      { encoding: "utf8" },
    );
    if (result.status === 2) return "(diff failed)";
    return result.stdout ?? "";
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {}
  }
}

// ── Types ────────────────────────────────────────────────────
interface PRMeta {
  title: string;
  description?: string;
  sourceRefName: string;
  targetRefName: string;
  lastMergeSourceCommit: { commitId: string };
  lastMergeTargetCommit: { commitId: string };
}

interface DiffResponse {
  changes?: Array<{
    changeType?: string;
    item?: { path?: string; isFolder?: boolean };
  }>;
}

interface ThreadResponse {
  id: number;
}

// ── Fetch PR metadata ────────────────────────────────────────
info(`Fetching PR !${prId}...`);
const meta = await ado<PRMeta>(
  `/git/repositories/${ADO_REPO}/pullRequests/${prId}?api-version=7.1`,
);
const { title, sourceRefName: srcRef, targetRefName: tgtRef } = meta;
const desc = meta.description ?? "";
const src = meta.lastMergeSourceCommit.commitId;
const tgt = meta.lastMergeTargetCommit.commitId;

info(`"${title}"  |  ${srcRef} → ${tgtRef}`);

// ── Fetch changed file list ──────────────────────────────────
info("Fetching changed files...");
const diffJson = await ado<DiffResponse>(
  `/git/repositories/${ADO_REPO}/diffs/commits` +
    `?baseVersion=${tgt}&baseVersionType=commit` +
    `&targetVersion=${src}&targetVersionType=commit&api-version=7.1`,
);
const changes = diffJson.changes ?? [];

// ── Fetch actual file diffs from ADO ────────────────────────
const MAX_FILE_BYTES = 80_000;
const MAX_TOTAL_BYTES = 300_000;
let totalBytes = 0;
const fileDiffs: string[] = [];

// Filter out directory entries — ADO includes directories in the diff response
const fileChanges = changes.filter((ch) => {
  const path = ch.item?.path;
  if (!path) return false;
  if (path.endsWith("/")) return false;
  if (ch.item?.isFolder) return false;

  return true;
});

info(`Fetching content for ${fileChanges.length} changed file(s)...`);
for (const ch of fileChanges) {
  const filePath = ch.item?.path;
  if (!filePath) continue;
  const changeType = String(ch.changeType ?? "edit");

  if (totalBytes >= MAX_TOTAL_BYTES) {
    fileDiffs.push(
      `### [${changeType}] ${filePath}\n(skipped — total size limit reached)`,
    );
    continue;
  }

  const [oldContent, newContent] = await Promise.all([
    fetchFileAt(tgt, filePath),
    fetchFileAt(src, filePath),
  ]);

  if (oldContent === null || newContent === null) {
    fileDiffs.push(
      `### [${changeType}] ${filePath}\n(skipped — binary or fetch error)`,
    );
    continue;
  }

  if (
    oldContent.length > MAX_FILE_BYTES ||
    newContent.length > MAX_FILE_BYTES
  ) {
    warn(`Skipping ${filePath} (file too large)`);
    fileDiffs.push(
      `### [${changeType}] ${filePath}\n(skipped — file exceeds ${MAX_FILE_BYTES / 1000}KB)`,
    );
    continue;
  }

  const patch = unifiedDiff(oldContent, newContent, filePath);
  const entry = patch
    ? `### [${changeType}] ${filePath}\n\`\`\`diff\n${patch}\`\`\``
    : `### [${changeType}] ${filePath}\n(no text changes)`;

  totalBytes += entry.length;
  fileDiffs.push(entry);
}

// ── Ask AI ───────────────────────────────────────────────────
info(`Asking ${backend.name} to review...`);
const prompt = `You are an expert code reviewer. Review this Azure DevOps pull request based ONLY on the diff provided below — do not reference any local files or project context.

**PR**: ${title}
**Description**: ${desc}
**Branch**: ${srcRef} → ${tgtRef}

**Diffs**:
${fileDiffs.join("\n\n")}

Provide structured feedback covering:
1. Bugs & logic errors
2. Security issues
3. Performance
4. Code quality
5. Missing tests

Format:
### Summary
(2-3 sentence overall assessment)

### Issues Found
- **[Critical/High/Medium/Low]** \`path/to/file\` – description and fix suggestion

### What Looks Good
(brief positives)

### Recommended Action
Approve / Approve with minor fixes / Request changes
`;

const review = await runAI(prompt);

console.log("");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`${c.green}${backend.name} Review — PR !${prId}${c.reset}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(review);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

// ── Post to ADO ─────────────────────────────────────────────
if (postComment) {
  info(`Posting to PR !${prId}...`);
  const body = `## 🤖 ${backend.name} AI Code Review\n\n${review}\n\n---\n*Generated by ${backend.label}*`;
  const resp = await ado<ThreadResponse>(
    `/git/repositories/${ADO_REPO}/pullRequests/${prId}/threads?api-version=7.1`,
    {
      method: "POST",
      body: JSON.stringify({
        comments: [{ parentCommentId: 0, content: body, commentType: 1 }],
        status: 1,
      }),
    },
  );
  if (resp.id) {
    success(
      `Posted as thread #${resp.id} → https://dev.azure.com/${ADO_ORG}/${ADO_PROJECT}/_git/${ADO_REPO}/pullrequest/${prId}`,
    );
  } else {
    console.log("Warning: could not confirm post. Check PAT permissions.");
  }
}

// ── Helpers ─────────────────────────────────────────────────
function runAI(promptText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(backend.cmd, [...backend.args, "--print"], {
      stdio: ["pipe", "pipe", "inherit"],
      // Run outside the project dir so local files don't bleed into the review
      cwd: tmpdir(),
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.on("error", reject);
    child.on("close", (code: number) =>
      code === 0
        ? resolve(out.trim())
        : reject(new Error(`${backend.cmd} exited ${code}`)),
    );
    child.stdin.end(promptText);
  });
}
