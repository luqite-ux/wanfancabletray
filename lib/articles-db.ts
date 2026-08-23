import type { LocalizedText, SiteLocale } from "@/lib/localization";
import { resolveLocalizedText } from "@/lib/localization";
import { company } from "@/lib/site-data";
import { getSupabaseServerClient } from "@/lib/supabase";

export interface ArticleView {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  publishedAt: string;
  updatedAt: string | null;
}

export interface ArticleRow {
  slug: string;
  title?: string | null;
  title_en?: string | null;
  title_i18n?: LocalizedText | null;
  excerpt?: string | null;
  excerpt_en?: string | null;
  excerpt_i18n?: LocalizedText | null;
  content?: string | null;
  content_en?: string | null;
  content_i18n?: LocalizedText | null;
  featured_image?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

interface ArticleQueryResult {
  data: unknown[] | null;
  error: unknown;
}

interface ArticleQuery {
  select(columns: string): ArticleQuery;
  eq(column: string, value: unknown): ArticleQuery;
  order(column: string, options: { ascending: boolean }): ArticleQuery;
  limit(count: number): PromiseLike<ArticleQueryResult>;
  range(from: number, to: number): PromiseLike<ArticleQueryResult>;
}

export interface ArticleQueryClient {
  from(table: string): ArticleQuery;
}

const articleColumns = [
  "slug",
  "title",
  "title_en",
  "title_i18n",
  "excerpt",
  "excerpt_en",
  "excerpt_i18n",
  "content",
  "content_en",
  "content_i18n",
  "featured_image",
  "published_at",
  "updated_at",
  "created_at",
].join(",");

function localizedArticleText(
  value: LocalizedText | null | undefined,
  locale: SiteLocale,
  legacyEnglish: string | null | undefined,
  legacyText: string | null | undefined,
) {
  const requested = value?.[locale]?.trim();
  if (requested) return requested;

  const defaultValue = value?.[company.defaultLocale]?.trim();
  if (defaultValue) return defaultValue;

  const localized = resolveLocalizedText(value, locale, company.defaultLocale);
  if (localized) return localized;

  return legacyEnglish?.trim() || legacyText?.trim() || "";
}

export function mapArticleRow(row: ArticleRow, locale: SiteLocale = company.defaultLocale): ArticleView {
  return {
    slug: row.slug,
    title: localizedArticleText(row.title_i18n, locale, row.title_en, row.title),
    excerpt: localizedArticleText(row.excerpt_i18n, locale, row.excerpt_en, row.excerpt),
    content: localizedArticleText(row.content_i18n, locale, row.content_en, row.content),
    featuredImage: row.featured_image?.trim() || null,
    publishedAt: row.published_at || row.updated_at || row.created_at || "",
    updatedAt: row.updated_at || null,
  };
}

export async function readTenantPublishedArticles(
  client: ArticleQueryClient,
  tenantId: string,
  locale: SiteLocale = company.defaultLocale,
  limit = 100,
): Promise<ArticleView[]> {
  const { data, error } = await client
    .from("articles")
    .select(articleColumns)
    .eq("tenant_id", tenantId)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(Math.max(1, limit));

  if (error || !data) return [];

  return data
    .map((row) => mapArticleRow(row as ArticleRow, locale))
    .filter((article) => article.slug && article.title && article.publishedAt);
}

export async function readAllTenantPublishedArticles(
  client: ArticleQueryClient,
  tenantId: string,
  locale: SiteLocale = company.defaultLocale,
  pageSize = 1000,
): Promise<ArticleView[]> {
  const normalizedPageSize = Math.max(1, Math.floor(pageSize));
  const articles: ArticleView[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client
      .from("articles")
      .select(articleColumns)
      .eq("tenant_id", tenantId)
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .order("slug", { ascending: true })
      .range(offset, offset + normalizedPageSize - 1);

    if (error || !data) return [];

    articles.push(...data
      .map((row) => mapArticleRow(row as ArticleRow, locale))
      .filter((article) => article.slug && article.title && article.publishedAt));

    if (data.length < normalizedPageSize) break;
    offset += normalizedPageSize;
  }

  return articles;
}

export async function readTenantPublishedArticleBySlug(
  client: ArticleQueryClient,
  tenantId: string,
  slug: string,
  locale: SiteLocale = company.defaultLocale,
): Promise<ArticleView | null> {
  const { data, error } = await client
    .from("articles")
    .select(articleColumns)
    .eq("tenant_id", tenantId)
    .eq("is_published", true)
    .eq("slug", slug)
    .order("published_at", { ascending: false })
    .limit(1);

  if (error || !data?.[0]) return null;

  const article = mapArticleRow(data[0] as ArticleRow, locale);
  return article.slug && article.title && article.publishedAt ? article : null;
}

export async function listPublishedArticles(
  locale: SiteLocale = company.defaultLocale,
  limit?: number,
): Promise<ArticleView[]> {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
  const client = getSupabaseServerClient();
  if (!client || !tenantId) return [];

  return readTenantPublishedArticles(client as unknown as ArticleQueryClient, tenantId, locale, limit);
}

export async function listAllPublishedArticles(
  locale: SiteLocale = company.defaultLocale,
): Promise<ArticleView[]> {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
  const client = getSupabaseServerClient();
  if (!client || !tenantId) return [];

  return readAllTenantPublishedArticles(client as unknown as ArticleQueryClient, tenantId, locale);
}

export async function getPublishedArticleBySlug(
  slug: string,
  locale: SiteLocale = company.defaultLocale,
): Promise<ArticleView | null> {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
  const client = getSupabaseServerClient();
  if (!client || !tenantId) return null;

  return readTenantPublishedArticleBySlug(client as unknown as ArticleQueryClient, tenantId, slug, locale);
}

export function formatPublishedDate(value: string, locale: SiteLocale = company.defaultLocale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Publication date unavailable";

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale, {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}
