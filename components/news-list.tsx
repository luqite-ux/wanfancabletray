import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { ArticleView } from "@/lib/articles-db";
import { formatPublishedDate } from "@/lib/articles-db";

export function NewsList({ articles }: { articles: ArticleView[] }) {
  return (
    <div className="news-list-grid">
      {articles.map((article) => (
        <article className="news-list-card" key={article.slug}>
          <div className="news-list-card__date">
            <CalendarDays aria-hidden="true" size={18} />
            <time dateTime={article.publishedAt}>{formatPublishedDate(article.publishedAt)}</time>
          </div>
          <h2><Link href={`/news/${article.slug}`}>{article.title}</Link></h2>
          {article.excerpt ? <p>{article.excerpt}</p> : null}
          <Link className="text-link" href={`/news/${article.slug}`}>Read update <span aria-hidden="true">→</span></Link>
        </article>
      ))}
    </div>
  );
}
