import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { sanitizeArticleContent } from "@/lib/article-content";
import type { ArticleView } from "@/lib/articles-db";
import { formatPublishedDate } from "@/lib/articles-db";

export function ArticleDetail({ article }: { article: ArticleView }) {
  const contentHtml = sanitizeArticleContent(article.content);

  return (
    <article className="news-detail">
      <header className="news-detail__header">
        <div className="page-container">
          <Link className="back-link" href="/news"><ArrowLeft aria-hidden="true" size={18} /> Back to news</Link>
          <div className="news-detail__heading">
            <p className="eyebrow">Wanfan update</p>
            <h1>{article.title}</h1>
            <div className="news-detail__date"><CalendarDays aria-hidden="true" size={18} /><time dateTime={article.publishedAt}>{formatPublishedDate(article.publishedAt)}</time></div>
            {article.excerpt ? <p className="news-detail__excerpt">{article.excerpt}</p> : null}
          </div>
        </div>
      </header>
      {article.featuredImage ? (
        <div className="page-container news-detail__image">
          <Image alt={article.title} fill priority sizes="(max-width: 900px) 100vw, 900px" src={article.featuredImage} style={{ objectFit: "cover" }} />
        </div>
      ) : null}
      <div className="page-container news-detail__body" dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </article>
  );
}
