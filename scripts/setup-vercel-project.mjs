#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { verifySharedAdminReadiness } from "./verify-shared-admin-readiness.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const TEAM_ID = "team_v0pxRIIzSUGJleUTRNSz6GS4";
const PROJECT_NAME = "wanfancabletray";
const APPROVED_ADMIN_URL = "https://admin.globle-trade.com";
const ENVIRONMENTS = ["production", "preview", "development"];
const ENVIRONMENT_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_TENANT_ID",
  "NEXT_PUBLIC_ADMIN_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1].startsWith("#")) continue;
    process.env[match[1]] ??= match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

function loadEnvironmentSources() {
  for (const filePath of [
    path.join(ROOT, ".env.local"),
    path.join(ROOT, ".env"),
    "D:/Cursor/Grand/huanqiu-admin/.env.local",
    "D:/Cursor/Grand/huanqiu-admin/.env",
    "D:/Cursor/Grand/huanqiu-admin/_migrate-batch/.env",
  ]) {
    loadEnvFile(filePath);
  }
}

function parseArguments(args) {
  let mode = "dry-run";
  for (const argument of args) {
    if (argument === "--dry-run") mode = "dry-run";
    else if (argument === "--apply") mode = "apply";
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return { mode };
}

function requireDeliveryValues(environment) {
  const values = {};
  for (const key of ENVIRONMENT_KEYS) {
    const value = environment[key]?.trim();
    if (!value) throw new Error(`${key} is required from an existing environment source.`);
    values[key] = value;
  }
  if (!/^https:\/\//i.test(values.NEXT_PUBLIC_SUPABASE_URL)) throw new Error("NEXT_PUBLIC_SUPABASE_URL must use HTTPS.");
  const adminUrl = values.NEXT_PUBLIC_ADMIN_URL.replace(/\/$/, "");
  if (adminUrl !== APPROVED_ADMIN_URL) throw new Error(`NEXT_PUBLIC_ADMIN_URL must equal ${APPROVED_ADMIN_URL}.`);
  values.NEXT_PUBLIC_ADMIN_URL = adminUrl;
  return values;
}

function redact(text, secrets) {
  return secrets.reduce((safe, secret) => safe.split(secret).join("[REDACTED]"), String(text || ""));
}

function runVercel(args, { input, environment, secrets }) {
  const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const result = spawnSync(command, ["dlx", "vercel@latest", ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, ...environment, NO_COLOR: "1" },
    input,
  });
  if (result.error) throw new Error(`Unable to start Vercel CLI: ${result.error.message}`);
  if (result.status !== 0) {
    const diagnostic = redact(`${result.stdout || ""}\n${result.stderr || ""}`, secrets).trim();
    throw new Error(`Vercel CLI failed (${result.status}).${diagnostic ? ` ${diagnostic}` : ""}`);
  }
}

async function applySetup(values, environment) {
  const token = environment.VERCEL_TOKEN?.trim();
  if (!token) throw new Error("VERCEL_TOKEN is required with --apply.");
  const secrets = [token, ...Object.values(values)];
  const cliEnvironment = { VERCEL_TOKEN: token };

  runVercel([
    "link",
    "--yes",
    "--project", PROJECT_NAME,
    "--team", TEAM_ID,
  ], { environment: cliEnvironment, secrets });

  for (const [name, value] of Object.entries(values)) {
    for (const target of ENVIRONMENTS) {
      const args = ["env", "add", name, target, "--force", "--team", TEAM_ID];
      if (target === "preview") args.push("--git-branch", "main");
      runVercel(args, { input: `${value}\n`, environment: cliEnvironment, secrets });
    }
  }
}

export async function main(args = process.argv.slice(2), environment = process.env) {
  loadEnvironmentSources();
  const { mode } = parseArguments(args);
  const values = requireDeliveryValues(environment);
  const sharedAdminReadiness = await verifySharedAdminReadiness({
    sharedAdminRoot: environment.HUANQIU_ADMIN_ROOT || "D:/Cursor/Grand/huanqiu-admin",
    environment,
    mode: "dependency-check",
  });
  if (mode === "apply" && !sharedAdminReadiness.deployReady) {
    throw new Error(`Shared admin dependency blocked. Missing origins: ${sharedAdminReadiness.dependency.missingOrigins.join(", ")}. Update huanqiu-admin separately before customer deployment apply.`);
  }
  if (mode === "apply") await applySetup(values, environment);

  return {
    mode,
    mutations: mode === "apply" ? 1 + ENVIRONMENT_KEYS.length * ENVIRONMENTS.length : 0,
    teamId: TEAM_ID,
    projectName: PROJECT_NAME,
    cliBootstrap: "pnpm dlx vercel@latest",
    link: { explicit: true, project: PROJECT_NAME, teamId: TEAM_ID },
    deployReady: sharedAdminReadiness.deployReady,
    sharedAdminDependency: sharedAdminReadiness.dependency,
    environments: ENVIRONMENTS,
    environmentVariables: ENVIRONMENT_KEYS.map((name) => ({
      name,
      present: Boolean(values[name]),
      targets: ENVIRONMENTS,
      previewBranch: "main",
    })),
    valuesPrinted: false,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main()
    .then((report) => process.stdout.write(`${JSON.stringify(report, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
