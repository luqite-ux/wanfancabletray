export type SiteLocale = string;
export type LocalizedText = Record<string, string>;
export type LocalizedList = Record<string, string[]>;

export function resolveLocalizedText(value: LocalizedText | null | undefined, requested = "en", defaultLocale = "en") {
  if (!value) return "";
  return value[requested]?.trim() || value[defaultLocale]?.trim() || Object.values(value).find((entry) => entry?.trim())?.trim() || "";
}
export function resolveLocalizedList(value: LocalizedList | null | undefined, requested = "en", defaultLocale = "en") {
  if (!value) return [];
  const normalize = (entries: string[] | undefined) => entries?.map((entry) => entry.trim()).filter(Boolean) || [];
  return [value[requested], value[defaultLocale], ...Object.values(value)]
    .map(normalize)
    .find((entries) => entries.length > 0) || [];
}
