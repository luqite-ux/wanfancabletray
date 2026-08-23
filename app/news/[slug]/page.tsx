import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleDetail } from "@/components/article-detail";
import {
  getPublishedArticleBySlug,
  listAllPublishedArticles,
} from "@/lib/articles-db";
import { buildPageMetadata } from "@/lib/metadata";
import { getRequestLocaleContext } from "@/lib/request-locale";
import { company } from "@/lib/site-data";

interface NewsDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;
export const dynamicParams = true;
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const articles = await listAllPublishedArticles();
  return articles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { locale, supportedLocales } = await getRequestLocaleContext();
  const article = await getPublishedArticleBySlug(slug, locale);
  if (!article) return { title: "News article not found", robots: { index: false, follow: false } };

  return buildPageMetadata({
    title: `${article.title} | ${company.brand}`,
    description: article.excerpt || `Published update from ${company.publicName}.`,
    path: `/news/${article.slug}`,
    image: article.featuredImage,
    imageAlt: article.title,
    type: "article",
    publishedTime: article.publishedAt,
    locale,
    supportedLocales,
  });
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = await params;
  const { locale } = await getRequestLocaleContext();
  const article = await getPublishedArticleBySlug(slug, locale);
  if (!article) notFound();

  return <main><ArticleDetail article={article} locale={locale} /></main>;
}
