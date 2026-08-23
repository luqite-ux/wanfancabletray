import assert from "node:assert/strict";
import test from "node:test";
import { getRuntimeSupportedLocales } from "../lib/locale-config";

test("runtime locales follow the exact tenant supported_languages setting", async () => {
  const previous = { ...process.env };
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  process.env.NEXT_PUBLIC_TENANT_ID = "12349fb9-b9f7-46aa-8623-c3cff85fad23";
  delete process.env.WANFAN_LOCALE_TEST_MODE;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    assert.match(String(input), /tenants\?id=eq\.12349fb9/);
    return Response.json([{ supported_languages: ["en", "zh"] }]);
  }) as typeof fetch;
  try {
    assert.deepEqual(await getRuntimeSupportedLocales(), ["en", "zh"]);
  } finally {
    globalThis.fetch = originalFetch;
    process.env = previous;
  }
});
