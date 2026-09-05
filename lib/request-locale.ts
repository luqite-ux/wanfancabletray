import { headers } from "next/headers";
import type { SiteLocale } from "@/lib/localization";
import { getRuntimeSupportedLocales } from "@/lib/locale-config";
import { LOCALE_REQUEST_HEADER, resolveLocaleHeader } from "@/lib/locale-routing";
import { company } from "@/lib/site-data";

export interface RequestLocaleContext {
  locale: SiteLocale;
  supportedLocales: SiteLocale[];
}

export async function getRequestLocaleContext(): Promise<RequestLocaleContext> {
  const supportedLocales = await getRuntimeSupportedLocales();
  let headerValue: string | null = null;
  try {
    headerValue = (await headers()).get(LOCALE_REQUEST_HEADER);
  } catch {
    // Direct component tests and build-time callers have no request scope.
  }
  return {
    locale: resolveLocaleHeader(headerValue, supportedLocales, company.defaultLocale),
    supportedLocales,
  };
}

export async function getRequestLocale() {
  return (await getRequestLocaleContext()).locale;
}
