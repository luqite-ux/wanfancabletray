import assert from "node:assert/strict";
import test from "node:test";
import { resolvePrivilegedSupabaseConfig } from "../lib/supabase-privileged-config.ts";

test("privileged Supabase config uses only the server service-role key", () => {
  assert.deepEqual(resolvePrivilegedSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: " https://example.supabase.co/ ",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key-must-not-be-used",
    SUPABASE_SERVICE_ROLE_KEY: " service-role-key ",
  }), {
    url: "https://example.supabase.co/",
    serviceRoleKey: "service-role-key",
  });
});

test("privileged Supabase config refuses to fall back to an anon key", () => {
  assert.equal(resolvePrivilegedSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  }), null);
  assert.equal(resolvePrivilegedSupabaseConfig({
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  }), null);
});
