import type { SiteLocale } from "@/lib/localization";
import { normalizeSupportedLocales } from "@/lib/locale-routing";
import { company } from "@/lib/site-data";

export function getConfiguredSupportedLocales(): SiteLocale[] {
  const testLocales = process.env.WANFAN_LOCALE_TEST_MODE === "1"
    ? process.env.WANFAN_TEST_SUPPORTED_LOCALES?.split(",")
    : undefined;
  return normalizeSupportedLocales(testLocales?.length ? testLocales : company.supportedLocales, company.defaultLocale);
}
