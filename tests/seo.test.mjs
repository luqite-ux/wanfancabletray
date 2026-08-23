import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildOrganizationJsonLd,
  buildPageMetadata,
  buildProductJsonLd,
  siteOrigin,
} from "../lib/metadata.ts";
import { company } from "../lib/site-data.ts";
import { fallbackProducts } from "../lib/products-db.ts";
import { buildSitemapEntries } from "../lib/sitemap.ts";

test("page metadata keeps canonical and Open Graph URLs on the verified public domain", () => {
  const metadata = buildPageMetadata({
    title: "Manufacturing | Wanfan",
    description: "Drawing-led manufacturing coordination.",
    path: "/manufacturing",
  });

  assert.equal(siteOrigin, "https://wanfancabletray.com");
  assert.equal(metadata.alternates.canonical, "https://wanfancabletray.com/manufacturing");
  assert.equal(metadata.alternates.languages.en, "https://wanfancabletray.com/manufacturing");
  assert.equal(metadata.alternates.languages["x-default"], "https://wanfancabletray.com/manufacturing");
  assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
  assert.equal(metadata.openGraph.title, metadata.title);
  assert.equal(metadata.openGraph.description, metadata.description);
  assert.match(metadata.openGraph.images[0].url, /^https:\/\/wanfancabletray\.com\//);
});

test("Organization structured data uses the same verified company and contact facts as shared chrome", () => {
  const organization = buildOrganizationJsonLd();

  assert.equal(organization.name, company.publicName);
  assert.equal(organization.url, `https://${company.domain}`);
  assert.equal(organization.email, company.email);
  assert.equal(organization.telephone, company.phone);
  assert.equal(organization.address.streetAddress, company.address);
  assert.equal(organization.logo, `https://${company.domain}/assets/brand/logo.png`);
});

test("Product structured data describes the product without commerce offers or pricing", () => {
  const schema = buildProductJsonLd(fallbackProducts[0]);
  const serialized = JSON.stringify(schema);

  assert.equal(schema["@type"], "Product");
  assert.equal(schema.manufacturer.name, company.publicName);
  assert.equal(schema.brand.name, company.brand);
  assert.equal(schema.image.every((url) => url.startsWith(`https://${company.domain}/`)), true);
  assert.doesNotMatch(serialized, /offers|price|priceCurrency|availability/i);
});

test("locale-aware sitemap includes real detail routes and excludes drafts and empty locale pages", () => {
  const entries = buildSitemapEntries({
    articles: [{ slug: "published-update", updatedAt: "2026-08-16T08:30:00.000Z", publishedAt: "2026-08-15T08:30:00.000Z" }],
    products: [fallbackProducts[0]],
  });
  const urls = entries.map(({ url }) => url);

  assert.ok(urls.includes("https://wanfancabletray.com/news/published-update"));
  assert.ok(urls.includes("https://wanfancabletray.com/products/cable-tray-systems"));
  assert.ok(urls.includes("https://wanfancabletray.com/news"));
  assert.equal(urls.some((url) => url.includes("/draft-update")), false);
  assert.equal(urls.some((url) => /\/zh(?:\/|$)/.test(url)), false);
  assert.equal(entries.every((entry) => entry.alternates.languages.en === entry.url), true);
});

test("robots exposes the canonical sitemap and host", async () => {
  const { default: robots } = await import("../app/robots.ts");
  const result = robots();

  assert.equal(result.sitemap, "https://wanfancabletray.com/sitemap.xml");
  assert.equal(result.host, "https://wanfancabletray.com");
  assert.deepEqual(result.rules, { userAgent: "*", allow: "/", disallow: ["/admin/"] });
});

test("Open Graph image route returns a generated PNG response", async () => {
  const { default: OpenGraphImage } = await import("../app/opengraph-image.tsx");
  const response = await OpenGraphImage();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^image\/png/);
  await response.arrayBuffer();
});

test("every independent static page exposes canonical Open Graph metadata and the shared image", async () => {
  const routes = [
    ["/", await import("../app/page.tsx")],
    ["/products", await import("../app/products/page.tsx")],
    ["/solutions", await import("../app/solutions/page.tsx")],
    ["/manufacturing", await import("../app/manufacturing/page.tsx")],
    ["/quality", await import("../app/quality/page.tsx")],
    ["/about", await import("../app/about/page.tsx")],
    ["/faq", await import("../app/faq/page.tsx")],
    ["/news", await import("../app/news/page.tsx")],
  ];

  for (const [path, route] of routes) {
    const expectedUrl = new URL(path, `${siteOrigin}/`).toString();
    assert.equal(route.metadata.alternates.canonical, expectedUrl);
    assert.equal(route.metadata.openGraph.url, expectedUrl);
    assert.equal(route.metadata.openGraph.images[0].url, `${siteOrigin}/opengraph-image`);
  }
});

test("homepage Organization and product Product schemas share the same entity identity without offers", async () => {
  const [{ default: HomePage }, { default: ProductDetailPage }] = await Promise.all([
    import("../app/page.tsx"),
    import("../app/products/[slug]/page.tsx"),
  ]);
  const homeHtml = renderToStaticMarkup(await HomePage());
  const productHtml = renderToStaticMarkup(await ProductDetailPage({
    params: Promise.resolve({ slug: "cable-tray-systems" }),
  }));
  const organization = JSON.parse(homeHtml.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1] ?? "null");
  const product = JSON.parse(productHtml.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1] ?? "null");

  assert.equal(organization["@type"], "Organization");
  assert.equal(organization.name, company.publicName);
  assert.equal(product["@type"], "Product");
  assert.equal(product.manufacturer["@id"], organization["@id"]);
  assert.doesNotMatch(JSON.stringify(product), /offers|price|priceCurrency/i);
});
