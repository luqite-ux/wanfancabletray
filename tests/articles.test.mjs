import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  listPublishedArticles,
  mapArticleRow,
  readTenantPublishedArticleBySlug,
  readTenantPublishedArticles,
} from "../lib/articles-db.ts";
import { NewsList } from "../components/news-list.tsx";
import { ArticleDetail } from "../components/article-detail.tsx";

const publishedRow = {
  tenant_id: "tenant-wanfan",
  slug: "project-drawing-review",
  title_i18n: { en: "Project Drawing Review", zh: "项目图纸复核" },
  excerpt_i18n: { en: "How confirmed drawings guide production.", zh: "确认图纸如何指导生产。" },
  content_i18n: { en: "Drawings establish the review basis.\n\nOrder inputs remain visible.", zh: "图纸确定复核依据。" },
  featured_image: "/assets/factory/workshop-01.jpg",
  is_published: true,
  published_at: "2026-08-15T08:30:00.000Z",
  updated_at: "2026-08-16T08:30:00.000Z",
};

function createArticleClient(rows) {
  return {
    from(table) {
      const tableRows = table === "articles" ? rows : [];
      const filters = new Map();
      let orderColumn = null;
      let ascending = true;

      const query = {
        select() {
          return query;
        },
        eq(column, value) {
          filters.set(column, value);
          return query;
        },
        order(column, options) {
          orderColumn = column;
          ascending = options.ascending;
          return query;
        },
        limit(count) {
          const data = tableRows
            .filter((row) => [...filters].every(([column, value]) => row[column] === value))
            .sort((left, right) => {
              if (!orderColumn) return 0;
              const comparison = String(left[orderColumn] ?? "").localeCompare(String(right[orderColumn] ?? ""));
              return ascending ? comparison : -comparison;
            })
            .slice(0, count);
          return Promise.resolve({ data, error: null });
        },
      };

      return query;
    },
  };
}

test("news has a true empty state when Supabase is not configured", async () => {
  const previous = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    tenant: process.env.NEXT_PUBLIC_TENANT_ID,
  };
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_TENANT_ID;

  try {
    assert.deepEqual(await listPublishedArticles("en"), []);
    const { default: NewsPage } = await import("../app/news/page.tsx");
    const html = renderToStaticMarkup(await NewsPage());
    assert.match(html, /No published updates yet/i);
    assert.doesNotMatch(html, /project drawing review/i);
  } finally {
    for (const [name, value] of Object.entries({
      NEXT_PUBLIC_SUPABASE_URL: previous.url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: previous.key,
      NEXT_PUBLIC_TENANT_ID: previous.tenant,
    })) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test("tenant article listing exposes only published rows with title and publication date", async () => {
  const rows = [
    publishedRow,
    { ...publishedRow, slug: "draft", title_i18n: { en: "Draft update" }, is_published: false },
    { ...publishedRow, tenant_id: "another-tenant", slug: "other-tenant", title_i18n: { en: "Other tenant update" } },
  ];

  const articles = await readTenantPublishedArticles(createArticleClient(rows), "tenant-wanfan", "en", 6);

  assert.deepEqual(articles.map(({ slug }) => slug), ["project-drawing-review"]);
  assert.equal(articles[0].title, "Project Drawing Review");
  assert.equal(articles[0].publishedAt, "2026-08-15T08:30:00.000Z");

  const html = renderToStaticMarkup(createElement(NewsList, { articles }));
  assert.match(html, /<time dateTime="2026-08-15T08:30:00.000Z">August 15, 2026<\/time>/);
  assert.match(html, /<h2[^>]*><a href="\/news\/project-drawing-review">Project Drawing Review<\/a><\/h2>/);
  assert.match(html, /href="\/news\/project-drawing-review"/);
  assert.doesNotMatch(html, /Draft update|Other tenant update/);
});

test("article localization falls back from requested locale to default and first non-empty locale", () => {
  assert.equal(mapArticleRow(publishedRow, "zh").title, "项目图纸复核");
  assert.equal(mapArticleRow({ ...publishedRow, title_i18n: { en: "English title" } }, "de").title, "English title");
  assert.equal(mapArticleRow({ ...publishedRow, title_i18n: { en: " ", fr: "Actualité française" } }, "de").title, "Actualité française");
});

test("article detail lookup cannot return drafts or another tenant's matching slug", async () => {
  const rows = [
    { ...publishedRow, tenant_id: "another-tenant" },
    { ...publishedRow, is_published: false },
  ];
  const client = createArticleClient(rows);

  assert.equal(await readTenantPublishedArticleBySlug(client, "tenant-wanfan", publishedRow.slug, "en"), null);

  const article = await readTenantPublishedArticleBySlug(
    createArticleClient([...rows, publishedRow]),
    "tenant-wanfan",
    publishedRow.slug,
    "en",
  );
  assert.equal(article?.title, "Project Drawing Review");
  assert.match(renderToStaticMarkup(createElement(ArticleDetail, { article })), /Drawings establish the review basis/);
});
