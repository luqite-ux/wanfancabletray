import type { MetadataRoute } from "next";
import { listAllPublishedArticles } from "@/lib/articles-db";
import { getProducts } from "@/lib/products-db";
import { buildSitemapEntries } from "@/lib/sitemap";
import { company } from "@/lib/site-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, products] = await Promise.all([
    listAllPublishedArticles(company.defaultLocale),
    getProducts(company.defaultLocale),
  ]);

  return buildSitemapEntries({ articles, products });
}
