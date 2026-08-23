import type { MetadataRoute } from "next";
import type { ArticleView } from "@/lib/articles-db";
import { absoluteUrl } from "@/lib/metadata";
import type { ProductView } from "@/lib/products-db";
import { localizePath, normalizeSupportedLocales } from "@/lib/locale-routing";
import { company } from "@/lib/site-data";

const staticPaths = [
  "/",
  "/products",
  "/solutions",
  "/manufacturing",
  "/quality",
  "/about",
  "/faq",
  "/news",
  "/contact",
  "/request-a-quote",
];

interface SitemapInput {
  articles: Array<Pick<ArticleView, "slug" | "publishedAt" | "updatedAt">>;
  products: Array<Pick<ProductView, "slug">>;
  supportedLocales?: string[];
}

function localizedEntry(path: string, lastModified: Date | string, supportedLocales: string[]): MetadataRoute.Sitemap[number][] {
  const languages = Object.fromEntries(
    supportedLocales.map((locale) => [locale, absoluteUrl(localizePath(path, locale, company.defaultLocale))]),
  );
  languages["x-default"] = absoluteUrl(path);

  return supportedLocales.map((locale) => ({
    url: absoluteUrl(localizePath(path, locale, company.defaultLocale)),
    lastModified,
    alternates: { languages },
  }));
}

export function buildSitemapEntries({ articles, products, supportedLocales = company.supportedLocales }: SitemapInput): MetadataRoute.Sitemap {
  const generatedAt = new Date();
  const normalizedLocales = normalizeSupportedLocales(supportedLocales, company.defaultLocale);

  return [
    ...staticPaths.flatMap((path) => localizedEntry(path, generatedAt, normalizedLocales)),
    ...products.flatMap((product) => localizedEntry(`/products/${product.slug}`, generatedAt, normalizedLocales)),
    ...articles.flatMap((article) => localizedEntry(
      `/news/${article.slug}`,
      article.updatedAt || article.publishedAt,
      normalizedLocales,
    )),
  ];
}
