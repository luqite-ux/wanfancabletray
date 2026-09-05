import type { SiteLocale } from "@/lib/localization";

export const LOCALE_REQUEST_HEADER = "x-wanfan-locale";

const localeSegmentPattern = /^[a-z]{2}(?:-[a-z]{2})?$/i;

export type LocaleRouteDecision =
  | { kind: "next" | "redirect" | "rewrite"; locale: SiteLocale; pathname: string }
  | { kind: "reject"; locale: null; pathname: string };

export function normalizeLocale(locale: string) {
  return locale.trim().toLowerCase();
}

export function normalizeSupportedLocales(locales: readonly string[], defaultLocale: string) {
  const normalizedDefault = normalizeLocale(defaultLocale);
  const normalized = locales
    .map(normalizeLocale)
    .filter((locale) => localeSegmentPattern.test(locale));
  return [normalizedDefault, ...normalized.filter((locale) => locale !== normalizedDefault)]
    .filter((locale, index, values) => values.indexOf(locale) === index);
}

export function localizePath(pathname: string, locale: SiteLocale, defaultLocale: SiteLocale) {
  const normalizedLocale = normalizeLocale(locale);
  if (normalizedLocale === normalizeLocale(defaultLocale)) return pathname;
  if (pathname === "/") return `/${normalizedLocale}`;
  return `/${normalizedLocale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function resolveLocaleHeader(
  headerValue: string | null | undefined,
  supportedLocales: readonly SiteLocale[],
  defaultLocale: SiteLocale,
) {
  const normalizedLocales = normalizeSupportedLocales(supportedLocales, defaultLocale);
  const requested = normalizeLocale(headerValue || "");
  return normalizedLocales.includes(requested) ? requested : normalizeLocale(defaultLocale);
}

export function resolveLocaleRoute(
  pathname: string,
  supportedLocales: readonly SiteLocale[],
  defaultLocale: SiteLocale,
): LocaleRouteDecision {
  const normalizedDefault = normalizeLocale(defaultLocale);
  const normalizedLocales = normalizeSupportedLocales(supportedLocales, defaultLocale);
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  if (!firstSegment) return { kind: "next", locale: normalizedDefault, pathname };

  const normalizedPrefix = normalizeLocale(firstSegment);
  if (!normalizedLocales.includes(normalizedPrefix)) {
    return localeSegmentPattern.test(firstSegment)
      ? { kind: "reject", locale: null, pathname }
      : { kind: "next", locale: normalizedDefault, pathname };
  }

  const prefix = `/${firstSegment}`;
  const internalPathname = pathname.slice(prefix.length) || "/";
  if (normalizedPrefix === normalizedDefault) {
    return { kind: "redirect", locale: normalizedDefault, pathname: internalPathname };
  }

  if (firstSegment !== normalizedPrefix) {
    return {
      kind: "redirect",
      locale: normalizedPrefix,
      pathname: localizePath(internalPathname, normalizedPrefix, normalizedDefault),
    };
  }

  return { kind: "rewrite", locale: normalizedPrefix, pathname: internalPathname };
}
