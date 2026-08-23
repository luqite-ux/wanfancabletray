#!/usr/bin/env node

import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const REQUIRED_SHARED_ADMIN_ORIGINS = [
  "wanfancabletray.com",
  "www.wanfancabletray.com",
];

export const SHARED_ADMIN_TEAM_ID = "team_v0pxRIIzSUGJleUTRNSz6GS4";
export const SHARED_ADMIN_PROJECT_ID = "prj_VFHYQ1BFLRFQzxAOY4m1Gdz55byM";

const DEFAULT_SHARED_ADMIN_ROOT = "D:/Cursor/Grand/huanqiu-admin";
const SHARED_ADMIN_PROJECT_NAME = "huanqiu-admin";
const SHARED_ADMIN_GIT_ORG = "luqite-ux";
const SHARED_ADMIN_GIT_REPO = "huanqiu-admin";
const SHARED_ADMIN_GIT_REF = "main";
const VERCEL_API_ORIGIN = "https://api.vercel.com";

function runGit(sharedAdminRoot, args) {
  const result = spawnSync("git", ["-C", sharedAdminRoot, ...args], {
    encoding: "utf8",
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1" },
  });
  if (result.error) throw new Error(`Unable to inspect shared-admin Git repository: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(`Unable to inspect shared-admin Git repository: ${(result.stderr || result.stdout).trim()}`);
  }
  return result.stdout;
}

function evaluateCommittedConfig(source) {
  const evaluator = [
    "import fs from 'node:fs';",
    "const source = fs.readFileSync(0, 'utf8');",
    "const url = `data:text/javascript;base64,${Buffer.from(source, 'utf8').toString('base64')}`;",
    "const configuration = (await import(url)).default;",
    "const origins = configuration?.experimental?.serverActions?.allowedOrigins;",
    "process.stdout.write(JSON.stringify(Array.isArray(origins) ? origins : []));",
  ].join("\n");
  const isolatedEnvironment = Object.fromEntries(
    ["SystemRoot", "WINDIR", "COMSPEC", "PATHEXT", "TEMP", "TMP"]
      .filter((key) => process.env[key] !== undefined)
      .map((key) => [key, process.env[key]]),
  );
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", evaluator], {
    encoding: "utf8",
    input: source,
    env: isolatedEnvironment,
  });
  if (result.error) throw new Error(`Unable to evaluate committed shared-admin config: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(`Unable to evaluate committed shared-admin config: ${(result.stderr || result.stdout).trim()}`);
  }
  const allowedOrigins = JSON.parse(result.stdout);
  return allowedOrigins
    .filter((origin) => typeof origin === "string")
    .map((origin) => origin.trim().toLowerCase());
}

async function inspectCommittedConfiguration(sharedAdminRoot) {
  const absoluteRoot = path.resolve(sharedAdminRoot);
  try {
    const sha = runGit(absoluteRoot, ["rev-parse", "HEAD"]).trim();
    const source = runGit(absoluteRoot, ["show", "HEAD:next.config.mjs"]);
    const configured = new Set(evaluateCommittedConfig(source));
    const confirmedOrigins = REQUIRED_SHARED_ADMIN_ORIGINS.filter((origin) => configured.has(origin));
    const missingOrigins = REQUIRED_SHARED_ADMIN_ORIGINS.filter((origin) => !configured.has(origin));
    return {
      sha,
      configPath: "next.config.mjs",
      confirmedOrigins,
      missingOrigins,
      error: null,
    };
  } catch (error) {
    return {
      sha: null,
      configPath: "next.config.mjs",
      confirmedOrigins: [],
      missingOrigins: [...REQUIRED_SHARED_ADMIN_ORIGINS],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function dependencyReport({ absoluteRoot, verifiedCommit, project = null, productionDeployment = null, issues }) {
  const deployReady = issues.length === 0;
  return {
    deployReady,
    dependency: {
      id: "shared-admin-server-action-origins",
      owner: "huanqiu-admin shared capability",
      repository: DEFAULT_SHARED_ADMIN_ROOT,
      customerRepoMayMutate: false,
      requirement: "The exact huanqiu-admin commit containing both customer origins must be the latest READY Production deployment in the approved company Vercel project and team.",
      requiredOrigins: [...REQUIRED_SHARED_ADMIN_ORIGINS],
      confirmedOrigins: verifiedCommit.confirmedOrigins,
      missingOrigins: verifiedCommit.missingOrigins,
      status: deployReady ? "ready" : verifiedCommit.missingOrigins.length ? "blocked" : "pending-production-proof",
      checkedRoot: absoluteRoot,
      verifiedCommit,
      project,
      productionDeployment,
      issues,
    },
  };
}

export async function verifySharedAdminReadiness({
  sharedAdminRoot = DEFAULT_SHARED_ADMIN_ROOT,
  mode = "dry-run",
} = {}) {
  const absoluteRoot = path.resolve(sharedAdminRoot);
  const verifiedCommit = await inspectCommittedConfiguration(absoluteRoot);
  const issues = [];
  if (verifiedCommit.error) issues.push(verifiedCommit.error);
  for (const origin of verifiedCommit.missingOrigins) {
    issues.push(`Verified shared-admin commit is missing required origin ${origin}.`);
  }
  if (issues.length === 0) issues.push("Live Vercel Production deployment proof is required before apply.");
  const report = dependencyReport({ absoluteRoot, verifiedCommit, issues });
  return { mode, mutations: 0, ...report };
}

async function fetchJson(fetchImpl, pathname, token, searchParameters = {}) {
  const url = new URL(pathname, VERCEL_API_ORIGIN);
  for (const [key, value] of Object.entries(searchParameters)) url.searchParams.set(key, String(value));
  const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`.trim();
    try {
      const body = await response.json();
      message = body?.error?.message || message;
    } catch {}
    throw new Error(`Vercel API request failed: ${message}`);
  }
  return await response.json();
}

function isReadyProductionDeployment(deployment) {
  return deployment?.projectId === SHARED_ADMIN_PROJECT_ID
    && deployment?.target === "production"
    && (deployment?.state === "READY" || deployment?.readyState === "READY");
}

export async function inspectLiveSharedAdminReadiness({
  token,
  sharedAdminRoot = DEFAULT_SHARED_ADMIN_ROOT,
  fetchImpl = fetch,
} = {}) {
  const absoluteRoot = path.resolve(sharedAdminRoot);
  const verifiedCommit = await inspectCommittedConfiguration(absoluteRoot);
  const issues = [];
  if (verifiedCommit.error) issues.push(verifiedCommit.error);
  for (const origin of verifiedCommit.missingOrigins) {
    issues.push(`Verified shared-admin commit is missing required origin ${origin}.`);
  }
  if (!token?.trim()) issues.push("VERCEL_TOKEN is required for live shared-admin Production proof.");
  if (issues.some((issue) => issue.includes("Git repository")) || !token?.trim()) {
    const report = dependencyReport({ absoluteRoot, verifiedCommit, issues });
    return { mode: "live-production-proof", mutations: 0, ...report };
  }

  let projectBody;
  try {
    projectBody = await fetchJson(
      fetchImpl,
      `/v9/projects/${SHARED_ADMIN_PROJECT_ID}`,
      token.trim(),
      { teamId: SHARED_ADMIN_TEAM_ID },
    );
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
    const report = dependencyReport({ absoluteRoot, verifiedCommit, issues });
    return { mode: "live-production-proof", mutations: 0, ...report };
  }

  if (projectBody?.id !== SHARED_ADMIN_PROJECT_ID) issues.push(`Vercel project id must equal ${SHARED_ADMIN_PROJECT_ID}.`);
  if (projectBody?.name !== SHARED_ADMIN_PROJECT_NAME) issues.push(`Vercel project name must equal ${SHARED_ADMIN_PROJECT_NAME}.`);
  if (projectBody?.accountId !== SHARED_ADMIN_TEAM_ID) issues.push(`Vercel project team must equal ${SHARED_ADMIN_TEAM_ID}.`);
  if (projectBody?.link?.type !== "github"
    || projectBody?.link?.org !== SHARED_ADMIN_GIT_ORG
    || projectBody?.link?.repo !== SHARED_ADMIN_GIT_REPO) {
    issues.push(`Vercel project Git identity must equal ${SHARED_ADMIN_GIT_ORG}/${SHARED_ADMIN_GIT_REPO}.`);
  }
  const project = {
    id: projectBody?.id ?? null,
    name: projectBody?.name ?? null,
    teamId: projectBody?.accountId ?? null,
    gitRepository: projectBody?.link?.type === "github"
      ? `${projectBody.link.org || ""}/${projectBody.link.repo || ""}`
      : null,
  };
  if (issues.length) {
    const report = dependencyReport({ absoluteRoot, verifiedCommit, project, issues });
    return { mode: "live-production-proof", mutations: 0, ...report };
  }

  let deploymentList;
  try {
    deploymentList = await fetchJson(fetchImpl, "/v6/deployments", token.trim(), {
      projectId: SHARED_ADMIN_PROJECT_ID,
      teamId: SHARED_ADMIN_TEAM_ID,
      target: "production",
      state: "READY",
      limit: 20,
    });
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
    const report = dependencyReport({ absoluteRoot, verifiedCommit, project, issues });
    return { mode: "live-production-proof", mutations: 0, ...report };
  }
  const latest = (Array.isArray(deploymentList?.deployments) ? deploymentList.deployments : [])
    .filter(isReadyProductionDeployment)
    .sort((left, right) => Number(right.created || 0) - Number(left.created || 0))[0];
  if (!latest) {
    issues.push("No READY Production deployment exists for the approved shared-admin project.");
    const report = dependencyReport({ absoluteRoot, verifiedCommit, project, issues });
    return { mode: "live-production-proof", mutations: 0, ...report };
  }

  let deploymentBody;
  try {
    deploymentBody = await fetchJson(
      fetchImpl,
      `/v13/deployments/${encodeURIComponent(latest.uid)}`,
      token.trim(),
      { teamId: SHARED_ADMIN_TEAM_ID },
    );
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
    const report = dependencyReport({ absoluteRoot, verifiedCommit, project, issues });
    return { mode: "live-production-proof", mutations: 0, ...report };
  }
  if (!isReadyProductionDeployment(deploymentBody)) {
    issues.push("Deployment detail is not a READY Production deployment for the approved shared-admin project.");
  }
  const metadata = deploymentBody?.meta || {};
  if (metadata.githubOrg !== SHARED_ADMIN_GIT_ORG
    || metadata.githubRepo !== SHARED_ADMIN_GIT_REPO
    || metadata.githubCommitRef !== SHARED_ADMIN_GIT_REF) {
    issues.push(`Production deployment Git identity must equal ${SHARED_ADMIN_GIT_ORG}/${SHARED_ADMIN_GIT_REPO}@${SHARED_ADMIN_GIT_REF}.`);
  }
  const productionCommitSha = typeof metadata.githubCommitSha === "string" ? metadata.githubCommitSha : null;
  if (!productionCommitSha || productionCommitSha !== verifiedCommit.sha) {
    issues.push(`Production commit ${productionCommitSha || "<missing>"} does not match verified config commit ${verifiedCommit.sha || "<missing>"}.`);
  }
  const productionDeployment = {
    id: deploymentBody?.uid ?? null,
    projectId: deploymentBody?.projectId ?? null,
    target: deploymentBody?.target ?? null,
    readyState: deploymentBody?.readyState || deploymentBody?.state || null,
    commitSha: productionCommitSha,
    gitRepository: metadata.githubOrg && metadata.githubRepo
      ? `${metadata.githubOrg}/${metadata.githubRepo}`
      : null,
    gitRef: metadata.githubCommitRef ?? null,
  };
  const report = dependencyReport({ absoluteRoot, verifiedCommit, project, productionDeployment, issues });
  return { mode: "live-production-proof", mutations: 0, ...report };
}

function parseArguments(args) {
  let mode = "dry-run";
  let sharedAdminRoot = process.env.HUANQIU_ADMIN_ROOT || DEFAULT_SHARED_ADMIN_ROOT;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--dry-run") mode = "dry-run";
    else if (argument === "--preflight") mode = "preflight";
    else if (argument === "--shared-admin-root") {
      sharedAdminRoot = args[index + 1] || "";
      index += 1;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!sharedAdminRoot) throw new Error("--shared-admin-root requires a directory.");
  return { mode, sharedAdminRoot };
}

export async function main(args = process.argv.slice(2), environment = process.env) {
  const options = parseArguments(args);
  if (options.mode === "preflight" && environment.VERCEL_TOKEN?.trim()) {
    return await inspectLiveSharedAdminReadiness({
      token: environment.VERCEL_TOKEN,
      sharedAdminRoot: options.sharedAdminRoot,
    });
  }
  return await verifySharedAdminReadiness(options);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main()
    .then((report) => {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      if (report.mode === "preflight" || report.mode === "live-production-proof") {
        if (!report.deployReady) {
          if (report.dependency.missingOrigins.length) {
            process.stderr.write(`Missing shared admin origins: ${report.dependency.missingOrigins.join(", ")}\n`);
          } else {
            process.stderr.write(`Shared admin dependency blocked: ${report.dependency.issues.join(" ")}\n`);
          }
          process.exitCode = 1;
        }
      }
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
