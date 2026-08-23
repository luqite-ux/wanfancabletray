#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const REQUIRED_SHARED_ADMIN_ORIGINS = [
  "wanfancabletray.com",
  "www.wanfancabletray.com",
];

const DEFAULT_SHARED_ADMIN_ROOT = "D:/Cursor/Grand/huanqiu-admin";

function parseOriginList(value) {
  return String(value || "")
    .trim()
    .replace(/^(['"])(.*)\1$/, "$2")
    .split(",")
    .map((origin) => origin.trim().toLowerCase())
    .filter(Boolean);
}

function readEnvironmentOrigins(filePath) {
  if (!fs.existsSync(filePath)) return [];
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*SERVER_ACTION_ALLOWED_ORIGINS\s*=\s*(.*)\s*$/);
    if (match) return parseOriginList(match[1]);
  }
  return [];
}

async function readStaticOrigins(filePath) {
  if (!fs.existsSync(filePath)) return { origins: [], error: "next.config.mjs not found" };
  try {
    const moduleUrl = pathToFileURL(filePath);
    moduleUrl.searchParams.set("readiness", `${Date.now()}-${Math.random()}`);
    const configuration = (await import(moduleUrl.href)).default;
    const allowedOrigins = configuration?.experimental?.serverActions?.allowedOrigins;
    const normalized = Array.isArray(allowedOrigins)
      ? allowedOrigins.filter((origin) => typeof origin === "string").map((origin) => origin.trim().toLowerCase())
      : [];
    return {
      origins: REQUIRED_SHARED_ADMIN_ORIGINS.filter((origin) => normalized.includes(origin)),
      error: null,
    };
  } catch (error) {
    return {
      origins: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function verifySharedAdminReadiness({
  sharedAdminRoot = DEFAULT_SHARED_ADMIN_ROOT,
  environment = process.env,
  mode = "dry-run",
} = {}) {
  const absoluteRoot = path.resolve(sharedAdminRoot);
  const staticConfiguration = await readStaticOrigins(path.join(absoluteRoot, "next.config.mjs"));
  const sourceEvidence = [
    {
      source: "next.config.mjs",
      origins: staticConfiguration.origins,
      error: staticConfiguration.error,
    },
    {
      source: ".env.local:SERVER_ACTION_ALLOWED_ORIGINS",
      origins: readEnvironmentOrigins(path.join(absoluteRoot, ".env.local")),
    },
    {
      source: ".env:SERVER_ACTION_ALLOWED_ORIGINS",
      origins: readEnvironmentOrigins(path.join(absoluteRoot, ".env")),
    },
    {
      source: "_migrate-batch/.env:SERVER_ACTION_ALLOWED_ORIGINS",
      origins: readEnvironmentOrigins(path.join(absoluteRoot, "_migrate-batch", ".env")),
    },
    {
      source: "process:SERVER_ACTION_ALLOWED_ORIGINS",
      origins: parseOriginList(environment.SERVER_ACTION_ALLOWED_ORIGINS),
    },
  ];
  const configured = new Set(sourceEvidence.flatMap((item) => item.origins));
  const confirmedOrigins = REQUIRED_SHARED_ADMIN_ORIGINS.filter((origin) => configured.has(origin));
  const missingOrigins = REQUIRED_SHARED_ADMIN_ORIGINS.filter((origin) => !configured.has(origin));
  const deployReady = missingOrigins.length === 0;
  return {
    mode,
    mutations: 0,
    deployReady,
    dependency: {
      id: "shared-admin-server-action-origins",
      owner: "huanqiu-admin shared capability",
      repository: "D:/Cursor/Grand/huanqiu-admin",
      customerRepoMayMutate: false,
      requirement: "Both customer origins must be present in huanqiu-admin next.config.mjs or SERVER_ACTION_ALLOWED_ORIGINS before customer deployment apply.",
      requiredOrigins: REQUIRED_SHARED_ADMIN_ORIGINS,
      confirmedOrigins,
      missingOrigins,
      status: deployReady ? "ready" : "blocked",
      checkedRoot: absoluteRoot,
      evidence: sourceEvidence,
    },
  };
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
  return await verifySharedAdminReadiness({ ...options, environment });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main()
    .then((report) => {
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      if (report.mode === "preflight" && !report.deployReady) {
        process.stderr.write(`Missing shared admin origins: ${report.dependency.missingOrigins.join(", ")}\n`);
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
