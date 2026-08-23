import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { NewsList } from "@/components/news-list";
import { listPublishedArticles } from "@/lib/articles-db";
import { buildPageMetadata } from "@/lib/metadata";
import { company } from "@/lib/site-data";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: `News | ${company.brand}`,
  description: "Published company and manufacturing updates from Wanfan.",
  path: "/news",
});

export default async function NewsPage() {
  const articles = await listPublishedArticles(company.defaultLocale);

  return (
    <main className="news-page">
      <section className="inner-page-hero" aria-labelledby="news-title">
        <div className="page-container inner-page-hero__grid">
          <div><p className="eyebrow">Published updates</p><h1 id="news-title">News</h1></div>
          <p>Company and manufacturing updates appear here after they are published through the Wanfan content workflow.</p>
        </div>
      </section>
      <section className="content-section" aria-label="Published news">
        <div className="page-container">
          {articles.length > 0 ? (
            <NewsList articles={articles} />
          ) : (
            <div className="news-empty-state" role="status">
              <Newspaper aria-hidden="true" />
              <h2>No published updates yet</h2>
              <p>Published Wanfan updates will appear here when they are available.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
