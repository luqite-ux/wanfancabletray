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

      function selectRows(from = 0, to = Number.POSITIVE_INFINITY) {
        return tableRows
          .filter((row) => [...filters].every(([column, value]) => row[column] === value))
          .sort((left, right) => {
            if (!orderColumn) return 0;
            const comparison = String(left[orderColumn] ?? "").localeCompare(String(right[orderColumn] ?? ""));
            return ascending ? comparison : -comparison;
          })
          .slice(from, Number.isFinite(to) ? to + 1 : undefined);
      }

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
          return Promise.resolve({ data: selectRows(0, count - 1), error: null });
        },
        range(from, to) {
          return Promise.resolve({ data: selectRows(from, to), error: null });
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

  const foreignBeforeLegacy = mapArticleRow({
    ...publishedRow,
    title_i18n: { en: " ", fr: "Actualité française" },
    title_en: "Legacy English title",
  }, "de");
  assert.equal(foreignBeforeLegacy.title, "Actualité française");
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

test("article detail preserves safe shared-admin Tiptap images, marks, text styles, alignment, links, and table columns", () => {
  const article = mapArticleRow({
    ...publishedRow,
    featured_image: null,
    content_i18n: {
      en: [
        '<h2 style="text-align: center">Drawing review</h2>',
        '<p style="text-align: right"><span style="color: #2563eb; font-size: 18px">Styled text</span> <mark>Highlighted</mark> <a href="https://example.com/spec" target="_blank" rel="noopener noreferrer nofollow" style="color: #16a34a">Specification</a></p>',
        '<img src="https://pub-wanfan.r2.dev/articles/line.jpg" alt="Cable tray line" title="Workshop" width="1280" height="720" class="max-w-full rounded">',
        '<table style="min-width: 150px"><colgroup><col style="width: 100px"><col width="50" span="2" style="min-width: 25px"></colgroup><tbody><tr><th colspan="2" rowspan="1" data-colwidth="100, 50" style="text-align: center"><p>Header</p></th></tr><tr><td colspan="1" rowspan="1" data-colwidth="100" style="text-align: right"><p>Value</p></td></tr></tbody></table>',
      ].join(""),
    },
  }, "en");
  const html = renderToStaticMarkup(createElement(ArticleDetail, { article }));

  assert.match(html, /<h2 style="text-align:\s*center">Drawing review<\/h2>/);
  assert.match(html, /<span style="(?=[^"]*color:\s*#2563eb)(?=[^"]*font-size:\s*18px)[^"]*">Styled text<\/span>/);
  assert.match(html, /<mark>Highlighted<\/mark>/);
  assert.match(html, /<a (?=[^>]*href="https:\/\/example\.com\/spec")(?=[^>]*target="_blank")(?=[^>]*rel="noopener noreferrer nofollow")(?=[^>]*style="color:\s*#16a34a")[^>]*>Specification<\/a>/);
  assert.match(html, /<img (?=[^>]*src="https:\/\/pub-wanfan\.r2\.dev\/articles\/line\.jpg")(?=[^>]*alt="Cable tray line")(?=[^>]*title="Workshop")(?=[^>]*width="1280")(?=[^>]*height="720")[^>]*>/);
  assert.match(html, /<table style="min-width:\s*150px"><colgroup><col style="width:\s*100px"\s*\/><col (?=[^>]*width="50")(?=[^>]*span="2")(?=[^>]*style="min-width:\s*25px")[^>]*\/><\/colgroup>/);
  assert.match(html, /<th (?=[^>]*colspan="2")(?=[^>]*rowspan="1")(?=[^>]*data-colwidth="100,50")(?=[^>]*style="text-align:\s*center")[^>]*>/);
  assert.match(html, /<td (?=[^>]*colspan="1")(?=[^>]*rowspan="1")(?=[^>]*data-colwidth="100")(?=[^>]*style="text-align:\s*right")[^>]*>/);
});

test("article detail removes unsafe Tiptap URLs, event handlers, dimensions, and CSS while retaining safe content", () => {
  const article = mapArticleRow({
    ...publishedRow,
    featured_image: null,
    content_i18n: {
      en: [
        '<script>alert(1)</script><p onclick="steal()" style="text-align: expression(alert(2)); background-image: url(javascript:alert(3))">Readable paragraph</p>',
        '<span style="color: red; font-size: 999px; position: fixed">Readable span</span>',
        '<a href="javascript:alert(4)" target="_self" rel="opener" style="color: expression(alert(5))" onmouseover="steal()">Bad link</a>',
        '<img src="data:image/svg+xml,&lt;svg onload=alert(6)&gt;" alt="Blocked data image"><img src="javascript:alert(7)" alt="Blocked script image"><img src="http://example.com/blocked.jpg" alt="Blocked HTTP image">',
        '<img src="https://pub-wanfan.r2.dev/articles/clean.jpg" alt="Clean image" width="99999" height="auto" style="background-image:url(javascript:alert(8))" onerror="steal()">',
        '<table style="width: calc(100% + 1px); background: url(javascript:alert(9))" onload="steal()"><colgroup span="999"><col width="javascript:alert(10)" span="999" style="width: expression(alert(11))"></colgroup><tbody><tr><td colspan="9999" rowspan="0" data-colwidth="100,javascript" style="text-align: expression(alert(12))">Readable cell</td></tr></tbody></table>',
      ].join(""),
    },
  }, "en");
  const html = renderToStaticMarkup(createElement(ArticleDetail, { article }));
  const cleanImage = html.match(/<img[^>]*clean\.jpg[^>]*>/)?.[0] ?? "";

  assert.match(html, /Readable paragraph/);
  assert.match(html, /Readable span/);
  assert.match(html, /Readable cell/);
  assert.match(cleanImage, /src="https:\/\/pub-wanfan\.r2\.dev\/articles\/clean\.jpg"/);
  assert.match(cleanImage, /alt="Clean image"/);
  assert.doesNotMatch(cleanImage, /width=|height=|style=|onerror=/i);
  assert.doesNotMatch(html, /<script|onclick|onmouseover|onerror|onload|javascript:|data:image|src="http:\/\/|expression\(|position\s*:|background(?:-image)?\s*:|font-size:\s*999px|span="999"|colspan="9999"|data-colwidth="[^"]*javascript/i);
  assert.doesNotMatch(html, /Blocked data image|Blocked script image|Blocked HTTP image/);
});

test("legacy plain-text articles render as paragraphs and explicit line breaks", () => {
  const article = mapArticleRow({
    ...publishedRow,
    content_i18n: { en: "First paragraph.\n\nSecond line\ncontinues." },
  }, "en");
  const html = renderToStaticMarkup(createElement(ArticleDetail, { article }));

  assert.match(html, /<p>First paragraph\.<\/p><p>Second line<br\s*\/>continues\.<\/p>/);
});

test("all-published reader paginates until every tenant article is returned", async () => {
  const rows = Array.from({ length: 205 }, (_, index) => ({
    ...publishedRow,
    slug: `published-${String(index).padStart(3, "0")}`,
    title_i18n: { en: `Published ${index}` },
  }));
  rows.push({ ...publishedRow, slug: "draft", is_published: false });
  rows.push({ ...publishedRow, slug: "other-tenant", tenant_id: "another-tenant" });

  const articleDb = await import("../lib/articles-db.ts");
  assert.equal(typeof articleDb.readAllTenantPublishedArticles, "function");
  const articles = await articleDb.readAllTenantPublishedArticles(
    createArticleClient(rows),
    "tenant-wanfan",
    "en",
    100,
  );

  assert.equal(articles.length, 205);
  assert.equal(new Set(articles.map(({ slug }) => slug)).size, 205);
  assert.equal(articles.some(({ slug }) => slug === "draft" || slug === "other-tenant"), false);
});
