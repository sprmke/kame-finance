#!/usr/bin/env node
/**
 * Production deploy for GitHub Actions CD.
 *
 * Uploads the git tree and creates the deployment through the Vercel API. The
 * CLI reads team settings before the project, so a project-scoped token fails
 * with "Could not retrieve Project Settings" even though it can deploy.
 *
 * Requires: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import path from "node:path";

const token = process.env.VERCEL_TOKEN;
const orgId = process.env.VERCEL_ORG_ID;
const projectId = process.env.VERCEL_PROJECT_ID;

if (!token || !orgId || !projectId) {
  console.error(
    "VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID are required.",
  );
  process.exit(1);
}

const git = (args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();
const sha = git(["rev-parse", "HEAD"]);
const message = git(["log", "-1", "--format=%s"]);
const files = execFileSync("git", ["ls-files", "-z"], { cwd: root })
  .toString()
  .split("\0")
  .filter(Boolean)
  .filter((file) => lstatSync(path.join(root, file)).isFile());

const api = "https://api.vercel.com";
const team = `teamId=${encodeURIComponent(orgId)}`;

async function vercel(pathname, { method = "GET", body, headers } = {}) {
  const response = await fetch(`${api}${pathname}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...headers },
    body,
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  if (!response.ok) {
    const error = payload?.error;
    const detail =
      (error && `${error.code || ""} ${error.message || ""}`.trim()) ||
      (typeof payload === "string"
        ? payload.slice(0, 400)
        : JSON.stringify(payload));
    throw new Error(
      `${method} ${pathname} failed (${response.status}): ${detail}`,
    );
  }
  return payload;
}

async function mapPool(items, limit, worker) {
  const queue = items.slice();
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (queue.length) await worker(queue.shift());
    }),
  );
}

console.log(`→ upload ${files.length} files from ${sha.slice(0, 7)}`);

const uploaded = [];
await mapPool(files, 12, async (file) => {
  const bytes = readFileSync(path.join(root, file));
  const digest = createHash("sha1").update(bytes).digest("hex");
  await vercel(`/v2/files?${team}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "x-vercel-digest": digest,
    },
    body: bytes,
  });
  uploaded.push({ file, sha: digest, size: bytes.length });
  if (uploaded.length % 200 === 0 || uploaded.length === files.length) {
    console.log(`  uploaded ${uploaded.length}/${files.length}`);
  }
});

console.log("→ create production deployment");
const deployment = await vercel(`/v13/deployments?${team}&forceNew=1`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "kame-ops",
    project: projectId,
    target: "production",
    files: uploaded,
    meta: {
      githubCommitSha: sha,
      githubCommitRef: "main",
      githubCommitOrg: "sprmke",
      githubCommitRepo: "kame-finance",
      githubCommitMessage: message,
    },
  }),
});

const id = deployment.id || deployment.deploymentId;
if (!id) throw new Error("Deployment response did not include an id.");
console.log(`  ${id} ${deployment.url || ""}`.trim());

const deadline = Date.now() + 20 * 60 * 1000;
let ready = deployment;
while (Date.now() < deadline) {
  const state = ready.readyState || ready.status;
  if (state === "READY") break;
  if (state === "ERROR" || state === "CANCELED") {
    throw new Error(
      `Deployment ${id} ${state}: ${ready.errorMessage || ready.error?.message || "no message"}`,
    );
  }
  await new Promise((resolve) => setTimeout(resolve, 5000));
  ready = await vercel(`/v13/deployments/${encodeURIComponent(id)}?${team}`);
  console.log(`  ${ready.readyState || ready.status}`);
}

if ((ready.readyState || ready.status) !== "READY") {
  throw new Error(`Deployment ${id} did not become ready.`);
}

console.log(`✓ Production deploy ready: https://${ready.url}`);
