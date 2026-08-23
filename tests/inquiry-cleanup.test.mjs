import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  createFixtureCleanupClient,
  parseCleanupArgs,
  runInquiryAttachmentCleanup,
} from "../scripts/cleanup-orphan-inquiry-attachments.mjs";

const fixturePath = new URL("./fixtures/inquiry-attachment-cleanup.json", import.meta.url);
const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const now = new Date("2026-08-23T12:00:00.000Z");

test("cleanup arguments default to dry-run and require an explicit safe selector", () => {
  assert.deepEqual(parseCleanupArgs(["--correlation-id", "11111111-1111-4111-8111-111111111111"]), {
    mode: "dry-run",
    correlationId: "11111111-1111-4111-8111-111111111111",
    olderThanHours: null,
    fixturePath: null,
  });
  assert.deepEqual(parseCleanupArgs(["--apply", "--older-than-hours", "24"]), {
    mode: "apply",
    correlationId: null,
    olderThanHours: 24,
    fixturePath: null,
  });
  assert.throws(() => parseCleanupArgs([]), /correlation-id.*older-than-hours/i);
  assert.throws(() => parseCleanupArgs(["--apply", "--older-than-hours", "0"]), /positive/i);
  assert.throws(() => parseCleanupArgs(["--correlation-id", "../another-tenant"]), /safe correlation/i);
});

test("exact-correlation dry-run stays under the tenant prefix and never removes", async () => {
  const { client, operations } = createFixtureCleanupClient(fixture);
  const result = await runInquiryAttachmentCleanup({
    client,
    tenantId: "tenant-wanfan",
    mode: "dry-run",
    correlationId: "11111111-1111-4111-8111-111111111111",
    olderThanHours: null,
    now,
  });

  assert.deepEqual(result.candidatePaths, ["tenant-wanfan/11111111-1111-4111-8111-111111111111/orphan.pdf"]);
  assert.deepEqual(result.removedPaths, []);
  assert.deepEqual(operations.removals, []);
  assert.equal(operations.storagePrefixes.every((prefix) => prefix.startsWith("tenant-wanfan/")), true);
  assert.equal(operations.storagePrefixes.some((prefix) => prefix.includes("another-tenant")), false);
});

test("age-threshold apply protects referenced and recent objects before deleting only old orphans", async () => {
  const { client, operations } = createFixtureCleanupClient(fixture);
  const result = await runInquiryAttachmentCleanup({
    client,
    tenantId: "tenant-wanfan",
    mode: "apply",
    correlationId: null,
    olderThanHours: 24,
    now,
  });

  assert.deepEqual(result.candidatePaths, ["tenant-wanfan/11111111-1111-4111-8111-111111111111/orphan.pdf"]);
  assert.deepEqual(result.protectedReferencedPaths, ["tenant-wanfan/22222222-2222-4222-8222-222222222222/referenced.pdf"]);
  assert.deepEqual(result.protectedByAgePaths, ["tenant-wanfan/33333333-3333-4333-8333-333333333333/recent.pdf"]);
  assert.deepEqual(result.removedPaths, result.candidatePaths);
  assert.deepEqual(operations.removals, [result.candidatePaths]);
  assert.equal(result.scannedPaths.some((path) => path.startsWith("another-tenant/")), false);
});

test("exact apply refuses to delete an object referenced by the same tenant inquiry", async () => {
  const { client, operations } = createFixtureCleanupClient(fixture);
  const result = await runInquiryAttachmentCleanup({
    client,
    tenantId: "tenant-wanfan",
    mode: "apply",
    correlationId: "22222222-2222-4222-8222-222222222222",
    olderThanHours: null,
    now,
  });

  assert.deepEqual(result.candidatePaths, []);
  assert.deepEqual(result.protectedReferencedPaths, ["tenant-wanfan/22222222-2222-4222-8222-222222222222/referenced.pdf"]);
  assert.deepEqual(operations.removals, []);
});

test("real CLI fixture defaults to dry-run and reports zero mutations", () => {
  const result = spawnSync(process.execPath, [
    "scripts/cleanup-orphan-inquiry-attachments.mjs",
    "--fixture",
    "tests/fixtures/inquiry-attachment-cleanup.json",
    "--correlation-id",
    "11111111-1111-4111-8111-111111111111",
  ], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
    env: { ...process.env, NEXT_PUBLIC_TENANT_ID: "tenant-wanfan" },
  });

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.mode, "dry-run");
  assert.deepEqual(output.removedPaths, []);
  assert.deepEqual(output.candidatePaths, ["tenant-wanfan/11111111-1111-4111-8111-111111111111/orphan.pdf"]);
});
