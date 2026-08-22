export type SiteLocale = string;
export type LocalizedText = Record<string, string>;
export type LocalizedList = Record<string, string[]>;

export function resolveLocalizedText(value: LocalizedText | null | undefined, requested = "en", defaultLocale = "en") {
  if (!value) return "";
  return value[requested]?.trim() || value[defaultLocale]?.trim() || Object.values(value).find((entry) => entry?.trim())?.trim() || "";
}
export function resolveLocalizedList(value: LocalizedList | null | undefined, requested = "en", defaultLocale = "en") {
  if (!value) return [];
  return value[requested]?.filter(Boolean).length
    ? value[requested].filter(Boolean)
    : value[defaultLocale]?.filter(Boolean).length
      ? value[defaultLocale].filter(Boolean)
      : Object.values(value).find((entry) => entry?.filter(Boolean).length)?.filter(Boolean) || [];
}
