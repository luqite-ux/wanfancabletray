import type { MetadataRoute } from "next";
import { listAllPublishedArticles } from "@/lib/articles-db";
import { getProducts } from "@/lib/products-db";
import { buildSitemapEntries } from "@/lib/sitemap";
import { getRuntimeSupportedLocales } from "@/lib/locale-config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, products] = await Promise.all([
    listAllPublishedArticles(),
    getProducts(),
  ]);

  return buildSitemapEntries({ articles, products, supportedLocales: await getRuntimeSupportedLocales() });
}
