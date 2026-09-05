import type { LocalizedList, LocalizedText, SiteLocale } from "@/lib/localization";
import { resolveLocalizedText } from "@/lib/localization";
import { cableTrayMaterials, company, productFamilies } from "@/lib/site-data";
import { getSupabaseServerClient } from "@/lib/supabase";

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductView {
  slug: string;
  name: string;
  family: string;
  categorySlug: string;
  description: string;
  overview: string;
  image: string;
  imageAlt: string;
  gallery: ProductImage[];
  materials: string[];
  surfaces: string[];
  specifications: ProductSpecification[];
  applications: string[];
  features: string[];
  advantages: string[];
  customization: string[];
}

export interface ProductCategory {
  slug: string;
  label: string;
}

export const productCategories: ProductCategory[] = [
  { slug: "cable-management", label: "Cable management" },
  { slug: "structural-supports", label: "Structural supports" },
  { slug: "conduit-systems", label: "Conduit systems" },
  { slug: "stainless-components", label: "Stainless components" },
];

type ProductRow = {
  slug: string;
  name?: string | null;
  name_en?: string | null;
  name_i18n?: LocalizedText | null;
  category?: string | null;
  category_slug?: string | null;
  description?: string | null;
  description_en?: string | null;
  description_i18n?: LocalizedText | null;
  overview?: string | null;
  overview_en?: string | null;
  overview_i18n?: LocalizedText | null;
  image_url?: string | null;
  features?: string[] | null;
  features_i18n?: LocalizedList | null;
  applications?: string[] | null;
  applications_i18n?: LocalizedList | null;
  advantages?: string[] | null;
  advantages_i18n?: LocalizedList | null;
  specs?: unknown;
  extra_data?: Record<string, unknown> | null;
};

interface ProductQueryResult {
  data: unknown[] | null;
  error: unknown;
}

interface ProductQuery {
  select(columns: string): ProductQuery;
  eq(column: string, value: unknown): ProductQuery;
  order(column: string, options: { ascending: boolean }): PromiseLike<ProductQueryResult>;
}

export interface ProductQueryClient {
  from(table: string): ProductQuery;
}

interface FallbackConfiguration {
  categorySlug: ProductCategory["slug"];
  image: string;
  imageAlt: string;
  materials: string[];
  surfaces: string[];
  specifications: ProductSpecification[];
  applications: string[];
}

const standardCustomization = [
  "Drawing and requirement review",
  "Material and surface confirmation",
  "Sample confirmation when required",
  "Order-specific production scheduling",
  "Inspection against confirmed requirements",
  "Dispatch coordination",
];

const confirmedConfiguration: ProductSpecification[] = [
  { label: "Configuration", value: "Confirmed against drawings and order requirements" },
  { label: "Production basis", value: "Order-specific review before production" },
];

const genericMaterials = ["Material specification confirmed against project requirements"];
const genericSurfaces = ["Surface process confirmed with the order"];
const genericApplications = ["Drawing-specific project requirements"];
const genericFeatures = ["Drawing-based review", "Order-specific material and process confirmation"];
const genericAdvantages = ["Confirmed project inputs remain visible through production and inspection"];

const familyConfiguration: Record<string, FallbackConfiguration> = {
  "cable-tray-systems": {
    categorySlug: "cable-management",
    image: "/assets/products/photo/cable-tray-systems.png",
    imageAlt: "Engineering illustration of a cable tray system profile",
    materials: cableTrayMaterials.en,
    surfaces: ["Galvanized", "Powder-coated", "Zinc-aluminum-magnesium coated", "Specified mill finish"],
    specifications: [
      { label: "Supplied thickness range", value: "0.5–3.0 mm" },
      { label: "Sizes and processes", value: "Customized to confirmed order requirements" },
    ],
    applications: ["Commercial buildings", "Industrial facilities", "Infrastructure corridors"],
  },
  "solar-mounting-structures": {
    categorySlug: "structural-supports",
    image: "/assets/products/photo/solar-mounting-structures.png",
    imageAlt: "Engineering illustration of a solar mounting structure profile",
    materials: ["Material specification confirmed against project drawings"],
    surfaces: ["Surface process confirmed with the order"],
    specifications: confirmedConfiguration,
    applications: ["Solar projects", "Drawing-based structural support requirements"],
  },
  "seismic-supports": {
    categorySlug: "structural-supports",
    image: "/assets/products/photo/seismic-supports.png",
    imageAlt: "Engineering illustration of a braced seismic support arrangement",
    materials: ["Material specification confirmed against project drawings"],
    surfaces: ["Surface process confirmed with the order"],
    specifications: confirmedConfiguration,
    applications: ["Coordinated building installations", "Project-specific support layouts"],
  },
  "utility-tunnel-supports": {
    categorySlug: "structural-supports",
    image: "/assets/products/photo/utility-tunnel-supports.png",
    imageAlt: "Engineering illustration of a utility-tunnel support profile",
    materials: ["Material specification confirmed against project drawings"],
    surfaces: ["Surface process confirmed with the order"],
    specifications: confirmedConfiguration,
    applications: ["Utility tunnels", "Infrastructure corridors"],
  },
  "aluminum-cable-trunking": {
    categorySlug: "cable-management",
    image: "/assets/products/photo/aluminum-cable-trunking.png",
    imageAlt: "Engineering illustration of an aluminum cable trunking profile",
    materials: ["Aluminum alloy"],
    surfaces: ["Finish confirmed with the order"],
    specifications: confirmedConfiguration,
    applications: ["Cable routing", "Coordinated building services"],
  },
  "stainless-steel-rainwater-outlets": {
    categorySlug: "stainless-components",
    image: "/assets/products/photo/stainless-steel-rainwater-outlets.png",
    imageAlt: "Engineering illustration of a stainless-steel rainwater outlet",
    materials: ["Stainless steel"],
    surfaces: ["Finish confirmed with the order"],
    specifications: confirmedConfiguration,
    applications: ["Drainage applications", "Project-specific outlet requirements"],
  },
  "emt-conduits": {
    categorySlug: "conduit-systems",
    image: "/assets/products/photo/emt-conduits.png",
    imageAlt: "Engineering illustration of straight EMT conduit sections",
    materials: ["Metal specification confirmed with the order"],
    surfaces: ["Surface process confirmed with the order"],
    specifications: confirmedConfiguration,
    applications: ["Electrical cable protection", "Coordinated building installations"],
  },
  "jdg-conduits": {
    categorySlug: "conduit-systems",
    image: "/assets/products/photo/jdg-conduits.png",
    imageAlt: "Engineering illustration of a JDG conduit and coupling",
    materials: ["Metal specification confirmed with the order"],
    surfaces: ["Surface process confirmed with the order"],
    specifications: confirmedConfiguration,
    applications: ["Electrical installations", "Cable protection routes"],
  },
  "stainless-steel-hose-clamps": {
    categorySlug: "stainless-components",
    image: "/assets/products/photo/stainless-steel-hose-clamps.png",
    imageAlt: "Engineering illustration of a stainless-steel hose clamp",
    materials: ["Stainless steel"],
    surfaces: ["Finish confirmed with the order"],
    specifications: confirmedConfiguration,
    applications: ["Secure connections", "Industrial assemblies"],
  },
  "stainless-steel-fasteners": {
    categorySlug: "stainless-components",
    image: "/assets/products/photo/stainless-steel-fasteners.png",
    imageAlt: "Engineering illustration of stainless-steel fastener components",
    materials: ["Stainless steel"],
    surfaces: ["Finish confirmed with the order"],
    specifications: confirmedConfiguration,
    applications: ["Industrial assemblies", "Cable-management and support installation"],
  },
};

function categoryLabel(slug: string) {
  return productCategories.find((category) => category.slug === slug)?.label || "Project components";
}

function isKnownCategorySlug(value: string) {
  return productCategories.some((category) => category.slug === value);
}

export const fallbackProducts: ProductView[] = productFamilies.map((family) => {
  const config = familyConfiguration[family.slug];
  const name = resolveLocalizedText(family.name, company.defaultLocale, company.defaultLocale);
  const description = resolveLocalizedText(family.description, company.defaultLocale, company.defaultLocale);

  return {
    slug: family.slug,
    name,
    family: categoryLabel(config.categorySlug),
    categorySlug: config.categorySlug,
    description,
    overview: `${description} Drawings, dimensions, material direction, quantity, and application context are reviewed before order confirmation.`,
    image: config.image,
    imageAlt: config.imageAlt,
    gallery: [{ src: config.image, alt: config.imageAlt }],
    materials: [...config.materials],
    surfaces: [...config.surfaces],
    specifications: config.specifications.map((item) => ({ ...item })),
    applications: [...config.applications],
    features: ["Drawing-based review", "Order-specific material and process confirmation"],
    advantages: ["Project requirements remain visible through production and inspection"],
    customization: [...standardCustomization],
  };
});

const fallbackBySlug = new Map(fallbackProducts.map((product) => [product.slug, product]));

function localizedText(
  value: LocalizedText | null | undefined,
  locale: SiteLocale,
  legacyEnglish = "",
  legacyFallback = "",
) {
  const requested = value?.[locale]?.trim();
  const defaultLocalized = value?.[company.defaultLocale]?.trim();
  const firstLocalized = value ? Object.values(value).find((entry) => entry?.trim())?.trim() : "";
  return requested
    || defaultLocalized
    || legacyEnglish.trim()
    || firstLocalized
    || legacyFallback.trim();
}

function localizedList(value: unknown, locale: SiteLocale, legacy: string[] = []) {
  const normalizedLegacy = legacy.map((item) => item.trim()).filter(Boolean);
  if (!value || typeof value !== "object" || Array.isArray(value)) return normalizedLegacy;
  const localized = value as LocalizedList;
  const normalize = (entries: string[] | undefined) => entries?.map((item) => item.trim()).filter(Boolean) || [];
  return [
    normalize(localized[locale]),
    normalize(localized[company.defaultLocale]),
    normalizedLegacy,
    ...Object.values(localized).map(normalize),
  ].find((entries) => entries.length > 0) || [];
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : [];
}

function localizedExtraList(extra: Record<string, unknown>, key: string, locale: SiteLocale) {
  return localizedList(extra[key], locale);
}

function normalizedSpecifications(value: unknown, fallback: ProductSpecification[]) {
  if (Array.isArray(value)) {
    const rows = value.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      const label = typeof record.label === "string" ? record.label : typeof record.key === "string" ? record.key : "";
      const specValue = typeof record.value === "string" || typeof record.value === "number" ? String(record.value) : "";
      return label.trim() && specValue.trim() ? [{ label: label.trim(), value: specValue.trim() }] : [];
    });
    if (rows.length) return rows;
  }

  if (value && typeof value === "object") {
    const rows = Object.entries(value as Record<string, unknown>).flatMap(([label, specValue]) => {
      if (typeof specValue !== "string" && typeof specValue !== "number") return [];
      return String(specValue).trim() ? [{ label, value: String(specValue).trim() }] : [];
    });
    if (rows.length) return rows;
  }

  return fallback.map((item) => ({ ...item }));
}

function localizedImageAlt(extra: Record<string, unknown>, locale: SiteLocale, fallback: string) {
  const value = extra.image_alt_i18n;
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  return localizedText(value as LocalizedText, locale, "", fallback) || fallback;
}

function productGallery(row: ProductRow, image: string, imageAlt: string) {
  const extra = row.extra_data || {};
  const sources = [row.image_url, ...stringArray(extra.gallery), ...stringArray(extra.images)].filter((source): source is string => Boolean(source));
  return [...new Set(sources.length ? sources : [image])].map((src, index) => ({
    src,
    alt: index === 0 ? imageAlt : `${imageAlt} — view ${index + 1}`,
  }));
}

export function mapProductRow(row: ProductRow, locale: SiteLocale = company.defaultLocale): ProductView {
  const fallback = fallbackBySlug.get(row.slug);
  const extra = row.extra_data || {};
  const name = localizedText(row.name_i18n, locale, row.name_en || "", row.name || "") || fallback?.name || "Project Component";
  const description = localizedText(
    row.description_i18n,
    locale,
    row.description_en || "",
    row.description || "",
  ) || fallback?.description || "A project component configured against confirmed requirements.";
  const overview = localizedText(
    row.overview_i18n,
    locale,
    row.overview_en || "",
    row.overview || "",
  ) || description || fallback?.overview || "Configuration is reviewed against confirmed project requirements.";
  const categoryValue = row.category?.trim() || "";
  const categorySlug = row.category_slug?.trim()
    || (isKnownCategorySlug(categoryValue) ? categoryValue : "")
    || fallback?.categorySlug
    || "project-components";
  const family = categoryValue && categoryValue !== categorySlug ? categoryValue : categoryLabel(categorySlug);
  const image = row.image_url?.trim() || fallback?.image || "/assets/brand/logo.png";
  const defaultImageAlt = row.image_url?.trim()
    ? `${name} product view`
    : fallback?.imageAlt || `Wanfan brand mark shown for ${name}`;
  const imageAlt = localizedImageAlt(extra, locale, defaultImageAlt);
  const features = localizedList(row.features_i18n, locale, row.features || []);
  const applications = localizedList(row.applications_i18n, locale, row.applications || []);
  const advantages = localizedList(row.advantages_i18n, locale, row.advantages || []);

  return {
    slug: row.slug,
    name,
    family,
    categorySlug,
    description,
    overview,
    image,
    imageAlt,
    gallery: productGallery(row, image, imageAlt),
    materials: localizedExtraList(extra, "materials_i18n", locale).length
      ? localizedExtraList(extra, "materials_i18n", locale)
      : fallback?.materials || genericMaterials,
    surfaces: localizedExtraList(extra, "surface_options_i18n", locale).length
      ? localizedExtraList(extra, "surface_options_i18n", locale)
      : fallback?.surfaces || genericSurfaces,
    specifications: normalizedSpecifications(row.specs, fallback?.specifications || confirmedConfiguration),
    applications: applications.length ? applications : fallback?.applications || genericApplications,
    features: features.length ? features : fallback?.features || genericFeatures,
    advantages: advantages.length ? advantages : fallback?.advantages || genericAdvantages,
    customization: localizedExtraList(extra, "customization_i18n", locale).length
      ? localizedExtraList(extra, "customization_i18n", locale)
      : fallback?.customization || standardCustomization,
  };
}

const productColumns = [
  "slug",
  "name",
  "name_en",
  "name_i18n",
  "category",
  "category_slug",
  "description",
  "description_en",
  "description_i18n",
  "overview",
  "overview_en",
  "overview_i18n",
  "image_url",
  "features",
  "features_i18n",
  "applications",
  "applications_i18n",
  "advantages",
  "advantages_i18n",
  "specs",
  "extra_data",
].join(",");

export async function readTenantProducts(client: ProductQueryClient, tenantId: string, locale: SiteLocale = company.defaultLocale) {
  if (!tenantId.trim()) throw new Error("A tenant ID is required to read products.");

  const { data, error } = await client
    .from("products")
    .select(productColumns)
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error("Unable to read tenant products.");
  return (data || []).map((row) => mapProductRow(row as ProductRow, locale));
}

function localizedFallbackProducts(locale: SiteLocale) {
  return productFamilies.map((family) => {
    const fallback = fallbackBySlug.get(family.slug)!;
    return {
      ...fallback,
      name: resolveLocalizedText(family.name, locale, company.defaultLocale),
      description: resolveLocalizedText(family.description, locale, company.defaultLocale),
    };
  });
}

export async function getProducts(locale: SiteLocale = company.defaultLocale): Promise<ProductView[]> {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
  const client = getSupabaseServerClient();
  if (!tenantId || !client) return localizedFallbackProducts(locale);

  try {
    const products = await readTenantProducts(client as unknown as ProductQueryClient, tenantId, locale);
    return products.length ? products : localizedFallbackProducts(locale);
  } catch {
    return localizedFallbackProducts(locale);
  }
}

export async function getProductBySlug(slug: string, locale: SiteLocale = company.defaultLocale): Promise<ProductView | null> {
  const products = await getProducts(locale);
  return products.find((product) => product.slug === slug) || null;
}
