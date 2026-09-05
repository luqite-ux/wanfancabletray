import type { SiteLocale } from "@/lib/localization";
import { normalizeSupportedLocales } from "@/lib/locale-routing";
import { company } from "@/lib/site-data";

export function getConfiguredSupportedLocales(): SiteLocale[] {
  const testLocales = process.env.WANFAN_LOCALE_TEST_MODE === "1"
    ? process.env.WANFAN_TEST_SUPPORTED_LOCALES?.split(",")
    : undefined;
  return normalizeSupportedLocales(testLocales?.length ? testLocales : company.supportedLocales, company.defaultLocale);
}

export async function getRuntimeSupportedLocales(): Promise<SiteLocale[]> {
  const fallback = getConfiguredSupportedLocales();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
  if (!url || !key || !tenantId || process.env.WANFAN_LOCALE_TEST_MODE === "1") return fallback;

  try {
    const response = await fetch(
      `${url}/rest/v1/tenants?id=eq.${encodeURIComponent(tenantId)}&select=supported_languages`,
      {
        headers: { apikey: key, authorization: `Bearer ${key}` },
        next: { revalidate: 60 },
      },
    );
    if (!response.ok) return fallback;
    const rows = await response.json() as Array<{ supported_languages?: string[] }>;
    return normalizeSupportedLocales(rows[0]?.supported_languages?.length ? rows[0].supported_languages : fallback, company.defaultLocale);
  } catch {
    return fallback;
  }
}
