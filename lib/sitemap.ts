import type { MetadataRoute } from "next";
import type { ArticleView } from "@/lib/articles-db";
import { absoluteUrl } from "@/lib/metadata";
import type { ProductView } from "@/lib/products-db";
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
];

interface SitemapInput {
  articles: Array<Pick<ArticleView, "slug" | "publishedAt" | "updatedAt">>;
  products: Array<Pick<ProductView, "slug">>;
}

function localizedPath(path: string, locale: string) {
  if (locale === company.defaultLocale) return path;
  return `/${locale}${path === "/" ? "" : path}`;
}

function localizedEntry(path: string, lastModified: Date | string): MetadataRoute.Sitemap[number][] {
  const languages = Object.fromEntries(
    company.supportedLocales.map((locale) => [locale, absoluteUrl(localizedPath(path, locale))]),
  );

  return company.supportedLocales.map((locale) => ({
    url: absoluteUrl(localizedPath(path, locale)),
    lastModified,
    alternates: { languages },
  }));
}

export function buildSitemapEntries({ articles, products }: SitemapInput): MetadataRoute.Sitemap {
  const generatedAt = new Date();

  return [
    ...staticPaths.flatMap((path) => localizedEntry(path, generatedAt)),
    ...products.flatMap((product) => localizedEntry(`/products/${product.slug}`, generatedAt)),
    ...articles.flatMap((article) => localizedEntry(
      `/news/${article.slug}`,
      article.updatedAt || article.publishedAt,
    )),
  ];
}
