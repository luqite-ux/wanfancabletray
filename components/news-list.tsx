import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { ArticleView } from "@/lib/articles-db";
import { formatPublishedDate } from "@/lib/articles-db";
import type { SiteLocale } from "@/lib/localization";
import { localizePath } from "@/lib/locale-routing";
import { company } from "@/lib/site-data";

export function NewsList({ articles, locale = company.defaultLocale }: { articles: ArticleView[]; locale?: SiteLocale }) {
  return (
    <div className="news-list-grid">
      {articles.map((article) => (
        <article className="news-list-card" key={article.slug}>
          <div className="news-list-card__date">
            <CalendarDays aria-hidden="true" size={18} />
            <time dateTime={article.publishedAt}>{formatPublishedDate(article.publishedAt, locale)}</time>
          </div>
          <h2><Link href={localizePath(`/news/${article.slug}`, locale, company.defaultLocale)}>{article.title}</Link></h2>
          {article.excerpt ? <p>{article.excerpt}</p> : null}
          <Link className="text-link" href={localizePath(`/news/${article.slug}`, locale, company.defaultLocale)}>Read update <span aria-hidden="true">→</span></Link>
        </article>
      ))}
    </div>
  );
}
