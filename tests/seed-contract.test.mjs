import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tenantId = "11111111-2222-4333-8444-555555555555";
const publicBase = "https://pub-unit.r2.dev";
const sharedAdminTeamId = "team_v0pxRIIzSUGJleUTRNSz6GS4";
const sharedAdminProjectId = "prj_VFHYQ1BFLRFQzxAOY4m1Gdz55byM";

function runScript(file, args = [], environment = {}) {
  return spawnSync(process.execPath, [file, ...args], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      NEXT_PUBLIC_TENANT_ID: tenantId,
      R2_PUBLIC_URL_PREFIX: publicBase,
      ...environment,
    },
  });
}

function createSharedAdminFixture({ staticOrigins = [], environmentOrigins = [] } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "wanfan-shared-admin-"));
  fs.writeFileSync(
    path.join(directory, "next.config.mjs"),
    `export default { experimental: { serverActions: { allowedOrigins: ${JSON.stringify(staticOrigins)} } } };\n`,
    "utf8",
  );
  if (environmentOrigins.length) {
    fs.writeFileSync(
      path.join(directory, ".env.local"),
      `SERVER_ACTION_ALLOWED_ORIGINS=${environmentOrigins.join(",")}\n`,
      "utf8",
    );
  }
  for (const args of [
    ["init", "--initial-branch=main"],
    ["config", "user.name", "Codex Test"],
    ["config", "user.email", "codex-test@example.com"],
    ["add", "next.config.mjs"],
    ["commit", "-m", "test: shared admin config"],
  ]) {
    const result = spawnSync("git", args, { cwd: directory, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  }
  return directory;
}

function sharedAdminFixtureHead(directory) {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: directory, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function createVercelFetchFixture({ project = {}, deployments, deployment = {} } = {}) {
  const defaultDeployment = {
    uid: "dpl_shared_admin_production",
    name: "huanqiu-admin",
    projectId: sharedAdminProjectId,
    target: "production",
    state: "READY",
    readyState: "READY",
    created: 2_000,
    meta: {
      githubCommitSha: "fixture-commit-sha",
      githubOrg: "luqite-ux",
      githubRepo: "huanqiu-admin",
      githubCommitRef: "main",
    },
    ...deployment,
  };
  const projectBody = {
    id: sharedAdminProjectId,
    name: "huanqiu-admin",
    accountId: sharedAdminTeamId,
    link: {
      type: "github",
      org: "luqite-ux",
      repo: "huanqiu-admin",
      repoId: 1233697430,
    },
    ...project,
  };
  const deploymentList = deployments ?? [defaultDeployment];
  const requests = [];
  return {
    requests,
    async fetch(input, init = {}) {
      const url = new URL(String(input));
      requests.push({ url: url.href, authorization: init.headers?.Authorization });
      assert.equal(init.headers?.Authorization, "Bearer fixture-vercel-token");
      assert.equal(url.searchParams.get("teamId"), sharedAdminTeamId);
      if (url.pathname === `/v9/projects/${sharedAdminProjectId}`) return Response.json(projectBody);
      if (url.pathname === "/v6/deployments") return Response.json({ deployments: deploymentList });
      if (url.pathname === `/v13/deployments/${defaultDeployment.uid}`) return Response.json(defaultDeployment);
      return Response.json({ error: { message: `Unexpected fixture request ${url.pathname}` } }, { status: 404 });
    },
  };
}

test("seed defaults to a zero-write, exact-tenant multilingual plan with public media only", () => {
  const result = runScript("scripts/seed-wanfancabletray.mjs", [], {
    NEXT_PUBLIC_SUPABASE_URL: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
  });

  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.mode, "dry-run");
  assert.equal(report.mutations, 0);
  assert.deepEqual(report.tenantScope, {
    id: tenantId,
    domain: "wanfancabletray.com",
  });
  assert.equal(report.plan.tenant.id, tenantId);
  assert.equal(report.plan.tenant.display_name, "南京万帆电气设备有限公司");
  assert.equal(report.plan.tenant.admin_group, 2);
  assert.equal(report.plan.tenant.default_language, "en");
  assert.deepEqual(report.plan.tenant.supported_languages, ["en"]);
  assert.ok(report.plan.tenant.site_title_i18n.en);
  assert.ok(report.plan.tenant.site_tagline_i18n.en);
  assert.ok(report.plan.tenant.site_description_i18n.en);
  assert.ok(report.plan.tenant.contact_address_i18n.en);
  assert.ok(report.plan.tenant.seo_title_i18n.en);
  assert.ok(report.plan.tenant.seo_description_i18n.en);
  assert.ok(report.plan.tenant.seo_keywords_i18n.en);
  assert.deepEqual(report.plan.articles, []);
  assert.equal(report.plan.products.length, 10);

  for (const row of [...report.plan.categories, ...report.plan.products]) {
    assert.equal(row.tenant_id, tenantId);
  }
  for (const product of report.plan.products) {
    for (const field of [
      "name_i18n",
      "description_i18n",
      "overview_i18n",
      "features_i18n",
      "applications_i18n",
      "advantages_i18n",
    ]) {
      assert.ok(product[field]?.en, `${product.slug}.${field}.en is required`);
    }
    assert.match(product.image_url, /^https:\/\/pub-unit\.r2\.dev\/tenants\/11111111-2222-4333-8444-555555555555\//);
  }

  const databasePayload = JSON.stringify(report.plan);
  assert.doesNotMatch(databasePayload, /(?:^|["\s])[A-Za-z]:[\\/]|file:\/\/|"\/(?:assets|images)\//i);
  assert.doesNotMatch(databasePayload, /\b(?:warrant(?:y|ies)|guarantee(?:d|s|ing)?|price|cart|payment|certified)\b/i);
});

test("seed refuses to plan without an explicit tenant ID", () => {
  const result = runScript("scripts/seed-wanfancabletray.mjs", ["--dry-run"], {
    NEXT_PUBLIC_TENANT_ID: "",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /NEXT_PUBLIC_TENANT_ID/);
});

test("existing-tenant reruns preserve nonempty and manually maintained site settings", async () => {
  const seed = await import("../scripts/seed-wanfancabletray.mjs");
  assert.equal(typeof seed.prepareTenantMutation, "function");
  const media = await import("../scripts/upload-wanfan-media-to-r2.mjs");
  const databaseMedia = media.buildDatabaseMedia(media.buildUploadPlan(tenantId, publicBase), tenantId);
  const planned = seed.buildSeedPlan(tenantId, databaseMedia, new Date("2030-01-02T03:04:05.000Z")).tenant;
  const existing = {
    id: tenantId,
    domain: "wanfancabletray.com",
    display_name: "人工维护的公司名称",
    admin_group: 3,
    logo_url: "https://pub-existing.r2.dev/manual/logo.png",
    favicon_url: "https://pub-existing.r2.dev/manual/favicon.png",
    brand_color: "#123456",
    default_language: "en",
    supported_languages: ["en", "de"],
    site_title_i18n: { en: "Human title" },
    site_tagline_i18n: {},
    site_description_i18n: { en: "Human description" },
    contact_email: "sales@wanfancabletray.com",
    contact_phone: "   ",
    contact_whatsapp: "+86 139 0000 0000",
    contact_address_short: "TBD",
    contact_address_i18n: { en: "Human-entered address" },
    social_links: { linkedin: "https://www.linkedin.com/company/wanfan" },
    seo_title_i18n: { en: "Human SEO title" },
    seo_description_i18n: { en: "Human SEO description" },
    seo_keywords_i18n: { en: "human, keywords" },
    google_analytics_id: "G-HUMAN",
    google_tag_manager_id: null,
    notes: "Human delivery note",
    extra_settings: {
      source: "human site-settings editor",
      initialized_at: "2029-01-01T00:00:00.000Z",
      manually_maintained_fields: ["site_tagline_i18n", "contact_whatsapp"],
      human_revision: "rev-7",
    },
  };

  const mutation = seed.prepareTenantMutation(planned, existing);

  assert.equal(mutation.display_name, "人工维护的公司名称");
  assert.equal(mutation.admin_group, 3);
  assert.equal(mutation.logo_url, "https://pub-existing.r2.dev/manual/logo.png");
  assert.equal(mutation.favicon_url, "https://pub-existing.r2.dev/manual/favicon.png");
  assert.equal(mutation.contact_email, "sales@wanfancabletray.com");
  assert.equal(mutation.contact_phone, "+86 158 5079 7846");
  assert.equal(mutation.contact_whatsapp, "+86 139 0000 0000");
  assert.equal(mutation.contact_address_short, "Yuhuatai District, Nanjing, Jiangsu, China");
  assert.deepEqual(mutation.site_tagline_i18n, {});
  assert.deepEqual(mutation.supported_languages, ["en", "de"]);
  assert.deepEqual(mutation.seo_title_i18n, { en: "Human SEO title" });
  assert.equal(mutation.google_analytics_id, "G-HUMAN");
  assert.equal(mutation.google_tag_manager_id, null);
  assert.equal(mutation.extra_settings.source, "human site-settings editor");
  assert.equal(mutation.extra_settings.initialized_at, "2029-01-01T00:00:00.000Z");
  assert.deepEqual(mutation.extra_settings.manually_maintained_fields, ["site_tagline_i18n", "contact_whatsapp"]);
  assert.equal(mutation.extra_settings.human_revision, "rev-7");
  assert.equal(mutation.extra_settings.production_url, "https://wanfancabletray.com");
});

test("R2 uploader defaults to a zero-write stable public object map", () => {
  const result = runScript("scripts/upload-wanfan-media-to-r2.mjs", [], {
    R2_S3_ENDPOINT: "",
    R2_ACCESS_KEY_ID: "",
    R2_SECRET_ACCESS_KEY: "",
    R2_BUCKET_NAME: "",
  });

  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.mode, "dry-run");
  assert.equal(report.mutations, 0);
  assert.equal(report.tenantId, tenantId);
  assert.ok(report.uploads.length >= 20);
  assert.ok(report.uploads.every((asset) => asset.tenantId === tenantId));
  assert.ok(report.uploads.every((asset) => asset.localPath.startsWith("public/") || asset.localPath.startsWith("app/")));
  assert.ok(report.uploads.every((asset) => asset.key.startsWith(`tenants/${tenantId}/wanfancabletray/`)));
  assert.ok(report.uploads.every((asset) => asset.publicUrl.startsWith(`${publicBase}/tenants/${tenantId}/wanfancabletray/`)));
  assert.match(report.databaseMedia.tenant.logo_url, /^https:\/\/pub-unit\.r2\.dev\//);
  assert.match(report.databaseMedia.tenant.favicon_url, /^https:\/\/pub-unit\.r2\.dev\//);
  assert.equal(report.databaseMedia.products.length, 10);
  assert.ok(report.databaseMedia.products.every((product) => product.tenant_id === tenantId));
  assert.ok(report.databaseMedia.products.every((product) => /^https:\/\/pub-unit\.r2\.dev\//.test(product.image_url)));
});

test("Vercel setup defaults to dry-run, targets the company team, and never prints env values", () => {
  const sentinels = {
    NEXT_PUBLIC_SUPABASE_URL: "https://secret-project.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-secret-sentinel",
    NEXT_PUBLIC_TENANT_ID: tenantId,
    NEXT_PUBLIC_ADMIN_URL: "https://admin.globle-trade.com",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-secret-sentinel",
    VERCEL_TOKEN: "vercel-secret-sentinel",
  };
  const result = runScript("scripts/setup-vercel-project.mjs", [], sentinels);

  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.mode, "dry-run");
  assert.equal(report.mutations, 0);
  assert.equal(report.teamId, "team_v0pxRIIzSUGJleUTRNSz6GS4");
  assert.equal(report.projectName, "wanfancabletray");
  assert.equal(report.link.explicit, true);
  assert.equal(report.link.teamId, "team_v0pxRIIzSUGJleUTRNSz6GS4");
  assert.equal(report.cliBootstrap, "pnpm dlx vercel@latest");
  assert.deepEqual(report.environments, ["production", "preview", "development"]);
  assert.deepEqual(report.environmentVariables.map((item) => item.name), [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_TENANT_ID",
    "NEXT_PUBLIC_ADMIN_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]);
  assert.ok(report.environmentVariables.every((item) => item.present === true));

  const output = `${result.stdout}\n${result.stderr}`;
  for (const secret of Object.values(sentinels)) {
    assert.doesNotMatch(output, new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Vercel setup rejects an unapproved HTTPS admin origin before any mutation", () => {
  const result = runScript("scripts/setup-vercel-project.mjs", ["--dry-run"], {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-test",
    NEXT_PUBLIC_ADMIN_URL: "https://attacker.example",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /NEXT_PUBLIC_ADMIN_URL must equal https:\/\/admin\.globle-trade\.com/);
  assert.doesNotMatch(result.stderr, /service-role-test|anon-test/);
});

test("shared-admin preflight blocks readiness until both customer origins are configured", () => {
  const sharedAdminRoot = createSharedAdminFixture({ staticOrigins: ["wanfancabletray.com"] });
  try {
    const result = runScript("scripts/verify-shared-admin-readiness.mjs", ["--preflight", "--shared-admin-root", sharedAdminRoot], {
      SERVER_ACTION_ALLOWED_ORIGINS: "",
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Missing shared admin origins: www\.wanfancabletray\.com/);
    const report = JSON.parse(result.stdout);
    assert.equal(report.mode, "preflight");
    assert.equal(report.mutations, 0);
    assert.equal(report.deployReady, false);
    assert.equal(report.dependency.id, "shared-admin-server-action-origins");
    assert.equal(report.dependency.owner, "huanqiu-admin shared capability");
    assert.equal(report.dependency.customerRepoMayMutate, false);
    assert.deepEqual(report.dependency.requiredOrigins, ["wanfancabletray.com", "www.wanfancabletray.com"]);
    assert.deepEqual(report.dependency.missingOrigins, ["www.wanfancabletray.com"]);
  } finally {
    fs.rmSync(sharedAdminRoot, { recursive: true, force: true });
  }
});

test("shared-admin preflight rejects process and local env origin strings as deployment proof", () => {
  const sharedAdminRoot = createSharedAdminFixture({
    environmentOrigins: ["wanfancabletray.com", "www.wanfancabletray.com"],
  });
  try {
    const result = runScript("scripts/verify-shared-admin-readiness.mjs", ["--preflight", "--shared-admin-root", sharedAdminRoot], {
      SERVER_ACTION_ALLOWED_ORIGINS: "wanfancabletray.com,www.wanfancabletray.com",
    });

    assert.notEqual(result.status, 0);
    const report = JSON.parse(result.stdout);
    assert.equal(report.deployReady, false);
    assert.deepEqual(report.dependency.missingOrigins, ["wanfancabletray.com", "www.wanfancabletray.com"]);
    assert.deepEqual(report.dependency.confirmedOrigins, []);
  } finally {
    fs.rmSync(sharedAdminRoot, { recursive: true, force: true });
  }
});

test("shared-admin preflight does not treat commented origin names as configuration", () => {
  const sharedAdminRoot = createSharedAdminFixture();
  fs.appendFileSync(
    path.join(sharedAdminRoot, "next.config.mjs"),
    "// Historical examples only: 'wanfancabletray.com', 'www.wanfancabletray.com'\n",
    "utf8",
  );
  try {
    const result = runScript("scripts/verify-shared-admin-readiness.mjs", ["--preflight", "--shared-admin-root", sharedAdminRoot], {
      SERVER_ACTION_ALLOWED_ORIGINS: "",
    });

    assert.notEqual(result.status, 0);
    const report = JSON.parse(result.stdout);
    assert.equal(report.deployReady, false);
    assert.deepEqual(report.dependency.missingOrigins, ["wanfancabletray.com", "www.wanfancabletray.com"]);
  } finally {
    fs.rmSync(sharedAdminRoot, { recursive: true, force: true });
  }
});

test("live shared-admin proof rejects the wrong Vercel project or team", async () => {
  const verifier = await import("../scripts/verify-shared-admin-readiness.mjs");
  assert.equal(typeof verifier.inspectLiveSharedAdminReadiness, "function");
  const sharedAdminRoot = createSharedAdminFixture({ staticOrigins: ["wanfancabletray.com", "www.wanfancabletray.com"] });
  const commitSha = sharedAdminFixtureHead(sharedAdminRoot);
  const deployment = {
    meta: {
      githubCommitSha: commitSha,
      githubOrg: "luqite-ux",
      githubRepo: "huanqiu-admin",
      githubCommitRef: "main",
    },
  };
  try {
    for (const [project, issue] of [
      [{ id: "prj_wrong_project" }, /project id/i],
      [{ accountId: "team_wrong_scope" }, /team/i],
    ]) {
      const fixture = createVercelFetchFixture({ project, deployment });
      const report = await verifier.inspectLiveSharedAdminReadiness({
        token: "fixture-vercel-token",
        sharedAdminRoot,
        fetchImpl: fixture.fetch,
      });
      assert.equal(report.deployReady, false);
      assert.match(report.dependency.issues.join("\n"), issue);
      assert.equal(report.mutations, 0);
    }
  } finally {
    fs.rmSync(sharedAdminRoot, { recursive: true, force: true });
  }
});

test("live shared-admin proof rejects preview-only deployments", async () => {
  const { inspectLiveSharedAdminReadiness } = await import("../scripts/verify-shared-admin-readiness.mjs");
  assert.equal(typeof inspectLiveSharedAdminReadiness, "function");
  const sharedAdminRoot = createSharedAdminFixture({ staticOrigins: ["wanfancabletray.com", "www.wanfancabletray.com"] });
  const commitSha = sharedAdminFixtureHead(sharedAdminRoot);
  const fixture = createVercelFetchFixture({
    deployments: [{
      uid: "dpl_preview_only",
      projectId: sharedAdminProjectId,
      target: "preview",
      state: "READY",
      readyState: "READY",
      created: 2_000,
      meta: { githubCommitSha: commitSha, githubOrg: "luqite-ux", githubRepo: "huanqiu-admin", githubCommitRef: "main" },
    }],
  });
  try {
    const report = await inspectLiveSharedAdminReadiness({ token: "fixture-vercel-token", sharedAdminRoot, fetchImpl: fixture.fetch });
    assert.equal(report.deployReady, false);
    assert.match(report.dependency.issues.join("\n"), /READY Production deployment/i);
    assert.equal(fixture.requests.some((request) => request.url.includes("/v13/deployments/")), false);
  } finally {
    fs.rmSync(sharedAdminRoot, { recursive: true, force: true });
  }
});

test("live shared-admin proof rejects a stale Production commit", async () => {
  const { inspectLiveSharedAdminReadiness } = await import("../scripts/verify-shared-admin-readiness.mjs");
  assert.equal(typeof inspectLiveSharedAdminReadiness, "function");
  const sharedAdminRoot = createSharedAdminFixture({ staticOrigins: ["wanfancabletray.com", "www.wanfancabletray.com"] });
  const fixture = createVercelFetchFixture({
    deployment: {
      meta: {
        githubCommitSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        githubOrg: "luqite-ux",
        githubRepo: "huanqiu-admin",
        githubCommitRef: "main",
      },
    },
  });
  try {
    const report = await inspectLiveSharedAdminReadiness({ token: "fixture-vercel-token", sharedAdminRoot, fetchImpl: fixture.fetch });
    assert.equal(report.deployReady, false);
    assert.match(report.dependency.issues.join("\n"), /Production commit.*verified config commit/i);
  } finally {
    fs.rmSync(sharedAdminRoot, { recursive: true, force: true });
  }
});

test("live shared-admin proof rejects a matching Production commit missing one required origin", async () => {
  const { inspectLiveSharedAdminReadiness } = await import("../scripts/verify-shared-admin-readiness.mjs");
  assert.equal(typeof inspectLiveSharedAdminReadiness, "function");
  const sharedAdminRoot = createSharedAdminFixture({ staticOrigins: ["wanfancabletray.com"] });
  const commitSha = sharedAdminFixtureHead(sharedAdminRoot);
  const fixture = createVercelFetchFixture({
    deployment: {
      meta: { githubCommitSha: commitSha, githubOrg: "luqite-ux", githubRepo: "huanqiu-admin", githubCommitRef: "main" },
    },
  });
  try {
    const report = await inspectLiveSharedAdminReadiness({ token: "fixture-vercel-token", sharedAdminRoot, fetchImpl: fixture.fetch });
    assert.equal(report.deployReady, false);
    assert.deepEqual(report.dependency.verifiedCommit.missingOrigins, ["www.wanfancabletray.com"]);
    assert.match(report.dependency.issues.join("\n"), /missing required origin/i);
  } finally {
    fs.rmSync(sharedAdminRoot, { recursive: true, force: true });
  }
});

test("live shared-admin proof accepts only a matching READY Production commit with both origins", async () => {
  const { inspectLiveSharedAdminReadiness } = await import("../scripts/verify-shared-admin-readiness.mjs");
  assert.equal(typeof inspectLiveSharedAdminReadiness, "function");
  const sharedAdminRoot = createSharedAdminFixture({ staticOrigins: ["wanfancabletray.com", "www.wanfancabletray.com"] });
  const commitSha = sharedAdminFixtureHead(sharedAdminRoot);
  const fixture = createVercelFetchFixture({
    deployment: {
      meta: { githubCommitSha: commitSha, githubOrg: "luqite-ux", githubRepo: "huanqiu-admin", githubCommitRef: "main" },
    },
  });
  try {
    const report = await inspectLiveSharedAdminReadiness({ token: "fixture-vercel-token", sharedAdminRoot, fetchImpl: fixture.fetch });
    assert.equal(report.deployReady, true);
    assert.deepEqual(report.dependency.issues, []);
    assert.equal(report.dependency.project.id, sharedAdminProjectId);
    assert.equal(report.dependency.project.teamId, sharedAdminTeamId);
    assert.equal(report.dependency.productionDeployment.commitSha, commitSha);
    assert.deepEqual(report.dependency.verifiedCommit.confirmedOrigins, ["wanfancabletray.com", "www.wanfancabletray.com"]);
    assert.equal(fixture.requests.length, 3);
  } finally {
    fs.rmSync(sharedAdminRoot, { recursive: true, force: true });
  }
});

test("Vercel readiness reports the separate shared-admin dependency and apply fails before CLI", () => {
  const sharedAdminRoot = createSharedAdminFixture();
  const deliveryEnvironment = {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-test",
    NEXT_PUBLIC_ADMIN_URL: "https://admin.globle-trade.com",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-test",
    SERVER_ACTION_ALLOWED_ORIGINS: "",
    HUANQIU_ADMIN_ROOT: sharedAdminRoot,
    VERCEL_TOKEN: "",
  };
  try {
    const dryRun = runScript("scripts/setup-vercel-project.mjs", ["--dry-run"], deliveryEnvironment);
    assert.equal(dryRun.status, 0, dryRun.stderr);
    const report = JSON.parse(dryRun.stdout);
    assert.equal(report.deployReady, false);
    assert.equal(report.sharedAdminDependency.id, "shared-admin-server-action-origins");
    assert.deepEqual(report.sharedAdminDependency.missingOrigins, ["wanfancabletray.com", "www.wanfancabletray.com"]);

    const apply = runScript("scripts/setup-vercel-project.mjs", ["--apply"], deliveryEnvironment);
    assert.notEqual(apply.status, 0);
    assert.match(apply.stderr, /Shared admin dependency blocked.*wanfancabletray\.com.*www\.wanfancabletray\.com/i);
    assert.doesNotMatch(apply.stderr, /VERCEL_TOKEN is required/);
  } finally {
    fs.rmSync(sharedAdminRoot, { recursive: true, force: true });
  }
});
