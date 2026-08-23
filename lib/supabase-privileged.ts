import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolvePrivilegedSupabaseConfig } from "@/lib/supabase-privileged-config";

export function getPrivilegedSupabaseClient(): SupabaseClient | null {
  const config = resolvePrivilegedSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!config) return null;

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
