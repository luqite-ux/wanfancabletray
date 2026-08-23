import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tenantId = "11111111-2222-4333-8444-555555555555";
const publicBase = "https://pub-unit.r2.dev";

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
