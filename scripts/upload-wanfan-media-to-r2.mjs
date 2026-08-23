#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
export const DEFAULT_MEDIA_MANIFEST = path.join(os.tmpdir(), "wanfancabletray-r2-media.json");

const productAssets = [
  ["cable-tray-systems", "cable-tray-system.svg"],
  ["solar-mounting-structures", "solar-mounting-structure.svg"],
  ["seismic-supports", "seismic-support.svg"],
  ["utility-tunnel-supports", "utility-tunnel-support.svg"],
  ["aluminum-cable-trunking", "aluminum-cable-trunking.svg"],
  ["stainless-steel-rainwater-outlets", "stainless-steel-rainwater-outlet.svg"],
  ["emt-conduits", "emt-conduit.svg"],
  ["jdg-conduits", "jdg-conduit.svg"],
  ["stainless-steel-hose-clamps", "stainless-steel-hose-clamp.svg"],
  ["stainless-steel-fasteners", "stainless-steel-fasteners.svg"],
];

const staticAssets = [
  { kind: "brand", name: "logo", localPath: "public/assets/brand/logo.png", objectPath: "brand/logo.png" },
  { kind: "brand", name: "favicon", localPath: "app/icon.png", objectPath: "brand/favicon.png" },
  { kind: "brand", name: "apple-icon", localPath: "app/apple-icon.png", objectPath: "brand/apple-icon.png" },
  ...productAssets.map(([slug, filename]) => ({
    kind: "product",
    name: slug,
    slug,
    localPath: `public/assets/products/${filename}`,
    objectPath: `products/${filename}`,
  })),
  ...Array.from({ length: 13 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      kind: "factory",
      name: `workshop-${number}`,
      localPath: `public/assets/factory/workshop-${number}.jpg`,
      objectPath: `factory/workshop-${number}.jpg`,
    };
  }),
  { kind: "factory", name: "production-poster", localPath: "public/assets/factory/production-poster.jpg", objectPath: "factory/production-poster.jpg" },
  { kind: "factory", name: "production-clip", localPath: "public/assets/factory/production-clip.mp4", objectPath: "factory/production-clip.mp4" },
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1].startsWith("#")) continue;
    const value = match[2].replace(/^(['"])(.*)\1$/, "$2");
    process.env[match[1]] ??= value;
  }
}

export function loadDeliveryEnvironment() {
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

export function requireTenantId(environment = process.env) {
  const tenantId = environment.NEXT_PUBLIC_TENANT_ID?.trim();
  if (!tenantId) throw new Error("NEXT_PUBLIC_TENANT_ID is required and must be explicit.");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)) {
    throw new Error("NEXT_PUBLIC_TENANT_ID must be a valid UUID.");
  }
  return tenantId;
}

export function requirePublicR2Base(environment = process.env) {
  const base = (
    environment.R2_PUBLIC_URL_PREFIX
    || environment.R2_PUBLIC_URL
    || environment.NEXT_PUBLIC_R2_PUBLIC_URL_PREFIX
    || ""
  ).trim().replace(/\/+$/, "");
  if (!/^https:\/\/pub-[a-z0-9-]+\.r2\.dev$/i.test(base)) {
    throw new Error("A public https://pub-*.r2.dev R2 URL is required.");
  }
  return base;
}

function contentType(localPath) {
  switch (path.extname(localPath).toLowerCase()) {
    case ".png": return "image/png";
    case ".svg": return "image/svg+xml";
    case ".mp4": return "video/mp4";
    default: return "image/jpeg";
  }
}

export function buildUploadPlan(tenantId, publicBase, { verifyFiles = true } = {}) {
  const prefix = `tenants/${tenantId}/wanfancabletray`;
  return staticAssets.map((asset) => {
    const absolutePath = path.join(ROOT, ...asset.localPath.split("/"));
    if (verifyFiles && !fs.existsSync(absolutePath)) {
      throw new Error(`Required media file is missing: ${asset.localPath}`);
    }
    const key = `${prefix}/${asset.objectPath}`;
    return {
      ...asset,
      tenantId,
      absolutePath,
      key,
      publicUrl: `${publicBase}/${key.split("/").map(encodeURIComponent).join("/")}`,
      contentType: contentType(asset.localPath),
    };
  });
}

export function buildDatabaseMedia(uploads, tenantId) {
  const byName = new Map(uploads.map((asset) => [asset.name, asset]));
  const logo = byName.get("logo")?.publicUrl;
  const favicon = byName.get("favicon")?.publicUrl;
  if (!logo || !favicon) throw new Error("The upload plan must include the logo and favicon.");
  return {
    tenant: { tenant_id: tenantId, logo_url: logo, favicon_url: favicon },
    products: productAssets.map(([slug]) => {
      const imageUrl = byName.get(slug)?.publicUrl;
      if (!imageUrl) throw new Error(`The upload plan is missing media for ${slug}.`);
      return { tenant_id: tenantId, slug, image_url: imageUrl, images: [imageUrl] };
    }),
  };
}

function parseArguments(args) {
  let mode = "dry-run";
  let manifestPath = DEFAULT_MEDIA_MANIFEST;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--dry-run") mode = "dry-run";
    else if (argument === "--apply") mode = "apply";
    else if (argument === "--manifest") {
      manifestPath = path.resolve(args[index + 1] || "");
      index += 1;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  return { mode, manifestPath };
}

async function uploadAll(uploads, environment) {
  const required = ["R2_S3_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"];
  for (const key of required) {
    if (!environment[key]?.trim()) throw new Error(`${key} is required with --apply.`);
  }
  const { PutObjectCommand, S3Client } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: "auto",
    endpoint: environment.R2_S3_ENDPOINT.trim(),
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: environment.R2_ACCESS_KEY_ID.trim(),
      secretAccessKey: environment.R2_SECRET_ACCESS_KEY.trim(),
    },
  });
  for (const asset of uploads) {
    await client.send(new PutObjectCommand({
      Bucket: environment.R2_BUCKET_NAME.trim(),
      Key: asset.key,
      Body: fs.readFileSync(asset.absolutePath),
      ContentType: asset.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }));
  }
}

export async function main(args = process.argv.slice(2), environment = process.env) {
  loadDeliveryEnvironment();
  const { mode, manifestPath } = parseArguments(args);
  const tenantId = requireTenantId(environment);
  const publicBase = requirePublicR2Base(environment);
  const uploads = buildUploadPlan(tenantId, publicBase);
  const databaseMedia = buildDatabaseMedia(uploads, tenantId);
  const publicUploads = uploads.map(({ absolutePath: _absolutePath, ...asset }) => asset);

  if (mode === "apply") {
    await uploadAll(uploads, environment);
    fs.writeFileSync(manifestPath, `${JSON.stringify({ tenantId, publicBase, uploads: publicUploads, databaseMedia }, null, 2)}\n`, "utf8");
  }

  return {
    mode,
    mutations: mode === "apply" ? uploads.length : 0,
    tenantId,
    publicBase,
    manifestPath: mode === "apply" ? manifestPath : null,
    uploads: publicUploads,
    databaseMedia,
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
