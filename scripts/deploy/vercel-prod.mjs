#!/usr/bin/env node
/**
 * Production deploy for GitHub Actions CD.
 *
 * Asks Vercel to build the git commit. A file upload does not match the Git
 * layout this project builds with: the root directory is apps/web, and
 * `cd ../..` only finds the workspace lockfile after a Git clone.
 *
 * Requires: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
 */
import { execFileSync } from "node:child_process";

const token = process.env.VERCEL_TOKEN;
const orgId = process.env.VERCEL_ORG_ID;
const projectId = process.env.VERCEL_PROJECT_ID;

if (!token || !orgId || !projectId) {
  console.error(
    "VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID are required.",
  );
  process.exit(1);
}

/** sprmke/kame-finance, linked on the kame-ops Vercel project. */
const GITHUB_REPO_ID = 1253966369;

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();
const git = (args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const sha = git(["rev-parse", "HEAD"]);
const message = git(["log", "-1", "--format=%s"]);

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

console.log(`→ create production deployment for ${sha.slice(0, 7)}`);
const deployment = await vercel(`/v13/deployments?${team}&forceNew=1`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "kame-ops",
    project: projectId,
    target: "production",
    gitSource: {
      type: "github",
      repoId: GITHUB_REPO_ID,
      ref: sha,
    },
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
