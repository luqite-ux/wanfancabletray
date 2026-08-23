#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const BUCKET = "inquiry-attachments";
const PAGE_SIZE = 100;
const INQUIRY_PAGE_SIZE = 1000;

function valueAfter(argv, index, option) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value.`);
  return value;
}

function safeCorrelationId(value) {
  return /^[A-Za-z0-9-]{8,128}$/.test(value);
}

function safeTenantId(value) {
  return /^[A-Za-z0-9-]+$/.test(value);
}

export function parseCleanupArgs(argv) {
  let mode = "dry-run";
  let explicitMode = null;
  let correlationId = null;
  let olderThanHours = null;
  let fixturePath = null;

  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (option === "--dry-run" || option === "--apply") {
      const nextMode = option === "--apply" ? "apply" : "dry-run";
      if (explicitMode && explicitMode !== nextMode) throw new Error("Choose either --dry-run or --apply, not both.");
      explicitMode = nextMode;
      mode = nextMode;
      continue;
    }
    if (option === "--correlation-id") {
      correlationId = valueAfter(argv, index, option);
      index += 1;
      continue;
    }
    if (option === "--older-than-hours") {
      const raw = valueAfter(argv, index, option);
      olderThanHours = Number(raw);
      if (!Number.isFinite(olderThanHours) || olderThanHours <= 0) {
        throw new Error("--older-than-hours must be a positive number.");
      }
      index += 1;
      continue;
    }
    if (option === "--fixture") {
      fixturePath = valueAfter(argv, index, option);
      index += 1;
      continue;
    }
    throw new Error(`Unknown option: ${option}`);
  }

  if (!correlationId && olderThanHours === null) {
    throw new Error("Provide --correlation-id or --older-than-hours as a safe cleanup selector.");
  }
  if (correlationId && !safeCorrelationId(correlationId)) {
    throw new Error("Provide a safe correlation ID containing only letters, numbers, and hyphens.");
  }

  return { mode, correlationId, olderThanHours, fixturePath };
}

function tenantPrefix(tenantId) {
  if (!safeTenantId(tenantId)) throw new Error("NEXT_PUBLIC_TENANT_ID is not a safe tenant identifier.");
  return tenantId;
}

function correlationPrefix(tenantId, correlationId) {
  if (!safeCorrelationId(correlationId)) throw new Error("Correlation ID is not safe.");
  return `${tenantPrefix(tenantId)}/${correlationId}`;
}

function safeObjectName(name) {
  return /^[A-Za-z0-9_.-]+$/.test(name) && !name.startsWith(".") && !name.includes("..");
}

async function listAll(client, prefix) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await client.storage.from(BUCKET).list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`Unable to list ${prefix}: ${error.message || "storage error"}`);
    const page = data || [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

function fullObject(prefix, row) {
  if (!safeObjectName(row.name)) throw new Error(`Unsafe storage object name under ${prefix}.`);
  return {
    path: `${prefix}/${row.name}`,
    createdAt: row.created_at || row.updated_at || null,
  };
}

async function listCorrelationObjects(client, tenantId, correlationId) {
  const prefix = correlationPrefix(tenantId, correlationId);
  return (await listAll(client, prefix))
    .filter((row) => row.id !== null && row.id !== undefined)
    .map((row) => fullObject(prefix, row));
}

async function listTenantObjects(client, tenantId) {
  const prefix = tenantPrefix(tenantId);
  const rootRows = await listAll(client, prefix);
  const correlations = rootRows
    .filter((row) => row.id === null || row.id === undefined)
    .map((row) => row.name);

  const objects = [];
  for (const correlationId of correlations) {
    if (!safeCorrelationId(correlationId)) throw new Error(`Unsafe correlation folder under ${prefix}.`);
    objects.push(...await listCorrelationObjects(client, tenantId, correlationId));
  }
  return objects;
}

async function readTenantInquiryMessages(client, tenantId) {
  const messages = [];
  for (let from = 0; ; from += INQUIRY_PAGE_SIZE) {
    const { data, error } = await client
      .from("inquiries")
      .select("id,message")
      .eq("tenant_id", tenantId)
      .range(from, from + INQUIRY_PAGE_SIZE - 1);
    if (error) throw new Error(`Unable to read tenant inquiries: ${error.message || "database error"}`);
    const page = data || [];
    for (const row of page) if (typeof row.message === "string") messages.push(row.message);
    if (page.length < INQUIRY_PAGE_SIZE) return messages;
  }
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

export async function runInquiryAttachmentCleanup({
  client,
  tenantId,
  mode = "dry-run",
  correlationId = null,
  olderThanHours = null,
  now = new Date(),
}) {
  const prefix = `${tenantPrefix(tenantId)}/`;
  if (mode !== "dry-run" && mode !== "apply") throw new Error("Cleanup mode must be dry-run or apply.");
  if (!correlationId && olderThanHours === null) throw new Error("A cleanup selector is required.");

  const byPath = new Map();
  const exactPaths = new Set();
  if (correlationId) {
    for (const object of await listCorrelationObjects(client, tenantId, correlationId)) {
      byPath.set(object.path, object);
      exactPaths.add(object.path);
    }
  }
  if (olderThanHours !== null) {
    for (const object of await listTenantObjects(client, tenantId)) byPath.set(object.path, object);
  }

  const objects = [...byPath.values()];
  if (objects.some(({ path }) => !path.startsWith(prefix))) throw new Error("Cross-tenant storage object detected.");

  const messages = await readTenantInquiryMessages(client, tenantId);
  const protectedReferencedPaths = [];
  const protectedByAgePaths = [];
  const candidatePaths = [];
  const cutoff = olderThanHours === null ? null : now.valueOf() - olderThanHours * 60 * 60 * 1000;

  for (const object of objects) {
    if (messages.some((message) => message.includes(object.path))) {
      protectedReferencedPaths.push(object.path);
      continue;
    }
    if (!exactPaths.has(object.path) && cutoff !== null) {
      const createdAt = object.createdAt ? new Date(object.createdAt).valueOf() : Number.NaN;
      if (!Number.isFinite(createdAt) || createdAt > cutoff) {
        protectedByAgePaths.push(object.path);
        continue;
      }
    }
    candidatePaths.push(object.path);
  }

  const orderedCandidates = sorted(candidatePaths);
  const removedPaths = [];
  if (mode === "apply") {
    for (let offset = 0; offset < orderedCandidates.length; offset += PAGE_SIZE) {
      const batch = orderedCandidates.slice(offset, offset + PAGE_SIZE);
      const { error } = await client.storage.from(BUCKET).remove(batch);
      if (error) throw new Error(`Unable to remove selected attachments: ${error.message || "storage error"}`);
      removedPaths.push(...batch);
    }
  }

  return {
    mode,
    tenantId,
    bucket: BUCKET,
    selectors: { correlationId, olderThanHours },
    scannedPaths: sorted(objects.map(({ path }) => path)),
    protectedReferencedPaths: sorted(protectedReferencedPaths),
    protectedByAgePaths: sorted(protectedByAgePaths),
    candidatePaths: orderedCandidates,
    removedPaths,
  };
}

export function createFixtureCleanupClient(fixture) {
  const storageObjects = fixture.storageObjects.map((row) => ({ ...row }));
  const inquiries = fixture.inquiries.map((row) => ({ ...row }));
  const operations = { storagePrefixes: [], inquiryTenantIds: [], removals: [] };

  const client = {
    storage: {
      from(bucket) {
        if (bucket !== BUCKET) throw new Error(`Unexpected fixture bucket: ${bucket}`);
        return {
          async list(prefix, options) {
            operations.storagePrefixes.push(prefix);
            const rootPrefix = `${prefix}/`;
            const descendants = storageObjects.filter(({ path }) => path.startsWith(rootPrefix));
            const rows = prefix.split("/").length === 1
              ? [...new Set(descendants.map(({ path }) => path.slice(rootPrefix.length).split("/")[0]))]
                .map((name) => ({ name, id: null, created_at: null, updated_at: null }))
              : descendants
                .filter(({ path }) => !path.slice(rootPrefix.length).includes("/"))
                .map(({ path, created_at, updated_at }) => ({
                  name: path.slice(rootPrefix.length),
                  id: path,
                  created_at: created_at || null,
                  updated_at: updated_at || null,
                }));
            return { data: rows.slice(options.offset, options.offset + options.limit), error: null };
          },
          async remove(paths) {
            operations.removals.push([...paths]);
            return { data: paths, error: null };
          },
        };
      },
    },
    from(table) {
      if (table !== "inquiries") throw new Error(`Unexpected fixture table: ${table}`);
      let selectedTenantId = null;
      const query = {
        select() { return query; },
        eq(column, value) {
          if (column !== "tenant_id") throw new Error(`Unexpected fixture filter: ${column}`);
          selectedTenantId = value;
          operations.inquiryTenantIds.push(value);
          return query;
        },
        async range(from, to) {
          const rows = inquiries.filter(({ tenant_id }) => tenant_id === selectedTenantId).slice(from, to + 1);
          return { data: rows.map(({ id, message }) => ({ id, message })), error: null };
        },
      };
      return query;
    },
  };

  return { client, operations };
}

function privilegedClient(environment) {
  const url = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
}

async function main() {
  const args = parseCleanupArgs(process.argv.slice(2));
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID?.trim();
  if (!tenantId) throw new Error("NEXT_PUBLIC_TENANT_ID is required and must be explicit.");

  let client;
  if (args.fixturePath) {
    const fixture = JSON.parse(await readFile(resolve(process.cwd(), args.fixturePath), "utf8"));
    if (fixture.tenantId !== tenantId) throw new Error("Fixture tenant does not match NEXT_PUBLIC_TENANT_ID.");
    ({ client } = createFixtureCleanupClient(fixture));
  } else {
    client = privilegedClient(process.env);
  }

  const result = await runInquiryAttachmentCleanup({
    client,
    tenantId,
    mode: args.mode,
    correlationId: args.correlationId,
    olderThanHours: args.olderThanHours,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
